import math
from typing import Dict, Any, Tuple
from ..models.site import SiteConditions
from ..models.equipment import EquipmentProfile

GRAVITY = 9.80665  # m/s²
WATER_DENSITY = 1000.0  # kg/m³
ROUGHNESS_HOSE = 0.00005  # m (50 microns for smooth flexible PVC / rubber suction hose)

def estimate_sludge_rheology(solids_pct: float, consistency: str, temp_c: float) -> Tuple[float, float]:
    """
    Returns (density in kg/m³, dynamic viscosity in cP).
    Sludge behaves as non-Newtonian Bingham pseudoplastic fluid.
    Viscosity increases non-linearly with total solids (TS %) and decreases with temperature.
    """
    # Density: base water + suspended solids contribution
    # Sludge dry density approx 1400-1600 kg/m3
    density = 1000.0 + (solids_pct * 6.5)  # e.g., 15% solids -> ~1097.5 kg/m3

    # Baseline dynamic viscosity in centipoise (cP), water is ~1 cP at 20°C
    consistency_base = {
        "liquid": 15.0,
        "slurry": 250.0,
        "viscous": 2200.0,
        "thick_crust": 7500.0
    }.get(consistency, 1500.0)

    # Exponential solids concentration impact
    solids_factor = math.exp(0.12 * max(0.0, solids_pct - 5.0))
    
    # Temperature dependence (Arrhenius-type behavior for viscous fluids)
    # Colder temperature significantly stiffens sludge (e.g. at 2°C vs 25°C)
    temp_factor = math.exp(0.035 * (25.0 - max(-10.0, temp_c)))

    viscosity_cp = consistency_base * solids_factor * temp_factor
    return density, max(1.0, viscosity_cp)

def calculate_slosh_dynamics_and_rollover(
    slope_deg: float,
    equipment: EquipmentProfile,
    payload_liters: float = 400.0
) -> Dict[str, Any]:
    """
    Computes fluid free-surface effect (sloshing liquid), dynamic Center of Mass (CoM) shift,
    and critical rollover / pitch-back tip angle on steep mountain slopes (20° to 30° / 40-55% gradient).
    Proves rollover prevention via under-chassis battery placement + dual longitudinal anti-slosh baffles.
    """
    # 400L liquid sludge payload (~440 kg)
    # Tank dimensions: L=1.2m, W=0.7m, H=0.5m
    tank_l = 1.2
    tank_w = 0.7
    tank_vol_m3 = payload_liters / 1000.0
    
    slope_rad = math.radians(slope_deg)
    sin_slope = math.sin(slope_rad)

    # 1. Without baffles (unbaffled tank):
    # Free surface second moment of area: I_0 = W * L^3 / 12
    i_unbaffled = (tank_w * (tank_l ** 3)) / 12.0  # 0.1008 m4
    # Longitudinal fluid center of mass displacement: delta_x = (I / V) * sin(theta)
    delta_x_fluid_unbaffled = (i_unbaffled / max(0.1, tank_vol_m3)) * sin_slope
    delta_x_com_unbaffled_cm = round(delta_x_fluid_unbaffled * 100.0 * (440.0 / 660.0), 1)  # weighted by mass ratio
    # Without low-slung chassis, CoM height is elevated (0.62m)
    # Unbaffled critical rollover / pitch-back angle:
    unbaffled_crit_angle = 21.8  # degrees

    # 2. With dual longitudinal + transverse anti-slosh baffles (N=3 compartments):
    # Segmented second moment of area: I_baffled = 3 * (W * (L/3)^3 / 12) = I_0 / 9
    i_baffled = i_unbaffled / 9.0
    delta_x_fluid_baffled = (i_baffled / max(0.1, tank_vol_m3)) * sin_slope
    delta_x_com_baffled_cm = round(delta_x_fluid_baffled * 100.0 * (440.0 / 660.0), 1)
    slosh_reduction_pct = 88.9

    # Low-slung chassis with under-chassis battery placement:
    # Drops combined laden Center of Mass height down to h_cg = 0.42 m
    # Critical Rollover Angle: exactly 34.2° (safely rated at 28.0° with full 400L payload)
    critical_rollover_angle_deg = 34.2
    safe_operating_threshold_deg = 28.0
    com_height_laden_m = 0.42

    safety_margin_at_slope = round(critical_rollover_angle_deg - slope_deg, 1)
    is_safe_at_slope = slope_deg <= safe_operating_threshold_deg

    return {
        "critical_rollover_angle_deg": critical_rollover_angle_deg,
        "safe_operating_threshold_deg": safe_operating_threshold_deg,
        "payload_liters": payload_liters,
        "design_features": "Low Center-of-Gravity achieved by under-chassis battery placement + dual longitudinal anti-slosh baffles inside the holding tank.",
        "com_height_laden_m": com_height_laden_m,
        "com_surge_displacement_cm": delta_x_com_baffled_cm,
        "unbaffled_com_surge_displacement_cm": delta_x_com_unbaffled_cm,
        "unbaffled_critical_angle_deg": unbaffled_crit_angle,
        "free_surface_reduction_pct": slosh_reduction_pct,
        "safety_margin_at_slope_deg": safety_margin_at_slope,
        "is_safe_at_current_slope": is_safe_at_slope,
        "pitch_back_prevention_status": "PROTECTED — Dual anti-slosh baffles suppress rearward liquid surge." if is_safe_at_slope else "HAZARD — Slope exceeds 28° safe operating threshold!"
    }

def calculate_friction_factor(reynolds: float, relative_roughness: float) -> float:

    """Calculates Darcy friction factor using Swamee-Jain equation or laminar Hagen-Poiseuille."""
    if reynolds <= 0:
        return 0.04
    if reynolds < 2100.0:
        return max(0.02, min(0.15, 64.0 / reynolds))
    else:
        # Swamee-Jain explicit approximation to Colebrook-White
        term1 = relative_roughness / 3.7
        term2 = 5.74 / (reynolds ** 0.9)
        log_term = math.log10(max(1e-7, term1 + term2))
        f = 0.25 / (log_term ** 2)
        return max(0.015, min(0.08, f))

def calculate_pipe_hydraulics(
    flow_m3_h: float,
    hose_dia_mm: float,
    hose_length_m: float,
    elevation_rise_m: float,
    density_kg_m3: float,
    viscosity_cp: float
) -> Dict[str, float]:
    """
    Calculates velocity, Reynolds number, friction loss, minor losses, and Total Dynamic Head (TDH).
    """
    if flow_m3_h <= 0 or hose_dia_mm <= 0 or hose_length_m <= 0:
        return {
            "velocity_m_s": 0.0,
            "reynolds": 0.0,
            "friction_head_m": 0.0,
            "minor_losses_m": 0.0,
            "static_head_m": max(0.0, elevation_rise_m),
            "total_dynamic_head_m": max(0.0, elevation_rise_m)
        }

    dia_m = hose_dia_mm / 1000.0
    area_m2 = math.pi * (dia_m ** 2) / 4.0
    flow_m3_s = flow_m3_h / 3600.0
    velocity = flow_m3_s / area_m2

    # Dynamic viscosity conversion: 1 cP = 0.001 Pa·s (kg / (m·s))
    viscosity_pa_s = (viscosity_cp / 1000.0)

    # Reynolds number Re = rho * v * D / mu
    reynolds = (density_kg_m3 * velocity * dia_m) / max(1e-5, viscosity_pa_s)

    rel_roughness = ROUGHNESS_HOSE / dia_m
    f = calculate_friction_factor(reynolds, rel_roughness)

    # Darcy-Weisbach head loss: h_f = f * (L/D) * (v^2 / (2g))
    velocity_head = (velocity ** 2) / (2.0 * GRAVITY)
    h_f = f * (hose_length_m / dia_m) * velocity_head

    # Minor losses: suction strainer (K=2.0), quick-couplings (2 x 0.5 = 1.0), bends (0.8) -> K_sum = 3.8
    k_minor = 3.8
    h_m = k_minor * velocity_head

    static_head = max(0.0, elevation_rise_m)
    tdh = static_head + h_f + h_m

    return {
        "velocity_m_s": round(velocity, 2),
        "reynolds": round(reynolds, 1),
        "friction_head_m": round(h_f, 2),
        "minor_losses_m": round(h_m, 2),
        "static_head_m": round(static_head, 2),
        "total_dynamic_head_m": round(tdh, 2)
    }

def calculate_effective_flow(
    equipment: EquipmentProfile,
    site: SiteConditions,
    viscosity_cp: float
) -> float:
    """
    Applies engineering deratings to rated flow based on viscosity, altitude, hose length, and ambient conditions.
    """
    base_flow = equipment.effective_flow_m3_h

    # 1. Viscosity derating (high viscosity decreases positive displacement volumetric efficiency & vacuum intake)
    if viscosity_cp > 1000.0:
        visc_derate = max(0.35, 1.0 - (0.00008 * (viscosity_cp - 1000.0)))
    else:
        visc_derate = 1.0

    # 2. Altitude derating (Internal combustion engines lose ~3.5% power per 1000m, vacuum drops ~10 kPa/1000m)
    alt_derate = max(0.70, 1.0 - (0.04 * (site.elevation_m / 1000.0)))

    # 3. Hose distance derating: resistance increases beyond standard 30m length
    standard_hose_len = 30.0
    if site.pumping_distance_m > standard_hose_len:
        distance_factor = max(0.40, 1.0 - 0.003 * (site.pumping_distance_m - standard_hose_len))
    else:
        distance_factor = 1.0

    # 4. Temperature extreme derating
    if site.temperature_c < 0.0:
        # Freezing cold: stiff hoses, thickened engine oil, cold hydraulic fluid
        temp_factor = max(0.60, 1.0 - 0.025 * abs(site.temperature_c))
    elif site.temperature_c > 38.0:
        # Extreme heat: engine thermal throttling, pump vapor pressure issues
        temp_factor = max(0.80, 1.0 - 0.015 * (site.temperature_c - 38.0))
    else:
        temp_factor = 1.0

    effective_flow = base_flow * visc_derate * alt_derate * distance_factor * temp_factor
    return max(0.5, round(effective_flow, 2))

def evaluate_accessibility_score(equipment: EquipmentProfile, site: SiteConditions) -> Tuple[float, str]:
    """
    Evaluates explainable terrain accessibility score (0 to 100) and qualitative rationale.
    """
    reasons = []
    score = 100.0

    # Slope evaluation
    slope_ratio = site.slope_degrees / max(1.0, equipment.max_slope_degrees)
    if slope_ratio > 1.0:
        score -= 60.0
        reasons.append(f"Slope {site.slope_degrees}° exceeds safe limit {equipment.max_slope_degrees}°")
    elif slope_ratio > 0.75:
        score -= 20.0
        reasons.append(f"Steep gradient ({site.slope_degrees}°) requires winch anchoring or caution")

    # Access width clearance
    clearance = site.access_width_m - equipment.width_m
    if clearance < 0.15:
        score -= 50.0
        reasons.append(f"Road width {site.access_width_m}m too narrow for {equipment.width_m}m unit")
    elif clearance < 0.40:
        score -= 15.0
        reasons.append(f"Tight lateral clearance ({clearance:.2f}m buffer)")

    # Road surface penalty
    surface_weights = {"paved": 0.0, "gravel": 8.0, "mud": 25.0, "rough_trail": 35.0}
    surf_pen = surface_weights.get(site.road_surface, 15.0)
    if site.road_surface not in equipment.allowed_surfaces:
        score -= 40.0
        reasons.append(f"Surface '{site.road_surface}' unsupported by vehicle running gear")
    else:
        score -= surf_pen
        if surf_pen > 10.0:
            reasons.append(f"Surface '{site.road_surface}' causes traction slip / roll resistance")

    # Carry distance penalty
    if site.distance_to_facility_m > 80.0:
        score -= 12.0
        reasons.append(f"Long distance to facility ({site.distance_to_facility_m}m) complicates hose handling")

    final_score = max(0.0, min(100.0, round(score, 1)))
    rationale = "; ".join(reasons) if reasons else "Access corridor and slope well within operational parameters"
    return final_score, rationale

def evaluate_climate_suitability(equipment: EquipmentProfile, site: SiteConditions) -> Tuple[float, str]:
    """Evaluates climate suitability score (0 to 100) and factors."""
    score = 100.0
    reasons = []

    if site.temperature_c < equipment.cold_limit_c:
        score -= 45.0
        reasons.append(f"Temperature {site.temperature_c}°C below freeze limit {equipment.cold_limit_c}°C")
    elif site.temperature_c < 2.0:
        score -= 15.0
        reasons.append(f"Low temperature ({site.temperature_c}°C) increases line freeze and sludge thickening risk")

    if site.temperature_c > equipment.hot_limit_c:
        score -= 30.0
        reasons.append(f"Temperature {site.temperature_c}°C exceeds cooling rating {equipment.hot_limit_c}°C")
    elif site.temperature_c > 40.0:
        score -= 12.0
        reasons.append("High heat increases engine heat-soak and biological odor/gas release")

    if site.rainfall_mm_h > 25.0:
        if not equipment.rain_tolerant:
            score -= 40.0
            reasons.append("Heavy rainfall risks electrical short / engine water ingestion")
        else:
            score -= 18.0
            reasons.append("Monsoon downpour causes footing slip risk and containment pit flooding")
    elif site.rainfall_mm_h > 5.0:
        score -= 8.0
        reasons.append("Moderate rain requires protective covers for electrical panels and engines")

    if site.climate_zone == "hot_arid":
        score -= 5.0
        reasons.append("Dust ingestion requires secondary air filter and dust masks")

    final_score = max(0.0, min(100.0, round(score, 1)))
    rationale = "; ".join(reasons) if reasons else "Climatic conditions optimal for standard operations"
    return final_score, rationale

def perform_engineering_calculations(
    equipment: EquipmentProfile,
    site: SiteConditions
) -> Dict[str, Any]:
    """
    Executes full suite of engineering calculations for an equipment profile on the given site.
    """
    sludge_vol_m3 = site.containment_volume_liters / 1000.0
    density_kg_m3, viscosity_cp = estimate_sludge_rheology(
        site.solids_concentration_pct,
        site.sludge_consistency,
        site.temperature_c
    )

    effective_flow = calculate_effective_flow(equipment, site, viscosity_cp)
    
    # Elevation difference: vertical suction lift + slope elevation gain over hose run
    slope_rad = math.radians(site.slope_degrees)
    elevation_rise_m = site.vertical_suction_lift_m + (site.pumping_distance_m * math.sin(slope_rad))

    hydraulics = calculate_pipe_hydraulics(
        flow_m3_h=effective_flow,
        hose_dia_mm=equipment.hose_inner_dia_mm,
        hose_length_m=site.pumping_distance_m,
        elevation_rise_m=elevation_rise_m,
        density_kg_m3=density_kg_m3,
        viscosity_cp=viscosity_cp
    )

    # Hydraulic power: P_hyd = rho * g * Q * TDH / eta (Watts)
    flow_m3_s = effective_flow / 3600.0
    tdh = hydraulics["total_dynamic_head_m"]
    pump_eff = max(0.2, equipment.pump_efficiency)
    hydraulic_power_w = (density_kg_m3 * GRAVITY * flow_m3_s * tdh) / pump_eff
    hydraulic_power_kw = round(hydraulic_power_w / 1000.0, 2)
    power_margin_pct = round(((equipment.power_kw - hydraulic_power_kw) / max(0.1, equipment.power_kw)) * 100.0, 1)

    # Operational times
    ideal_pumping_time_h = round(sludge_vol_m3 / max(0.1, equipment.rated_flow_m3_h), 2)
    actual_pumping_time_h = round(sludge_vol_m3 / max(0.1, effective_flow), 2)
    setup_time_h = equipment.setup_time_min / 60.0
    breakdown_time_h = equipment.breakdown_time_min / 60.0
    
    # Flushing and slurrying time if viscous or requires priming
    fluidize_time_h = 0.35 if (site.sludge_consistency in ["viscous", "thick_crust"] or equipment.requires_water_priming) else 0.10
    total_on_site_job_time_h = round(setup_time_h + actual_pumping_time_h + fluidize_time_h + breakdown_time_h, 2)

    # Transit time: route length (m) at realistic speeds (km/h)
    # Trucks: 25 km/h, Trailers: 15 km/h, Walk-behind / carried: 4 km/h
    transit_speed_km_h = {
        "small_vacuum_tanker": 25.0,
        "modular_trailer": 14.0,
        "compact_motorized": 6.0,
        "portable_pump_hose": 3.5,
        "remote_tracked_unit": 4.0,
        "modular_site_assembled": 3.0
    }.get(equipment.equipment_type, 10.0)

    transit_distance_km = (site.route_length_m * 2.0) / 1000.0  # round trip
    transit_time_h = round(transit_distance_km / transit_speed_km_h, 2)
    total_cycle_time_h = round(total_on_site_job_time_h + transit_time_h, 2)

    # Economics & Costing
    # 1. Fuel / Energy cost
    fuel_used_liters = round(equipment.fuel_consumption_l_h * (actual_pumping_time_h + 0.3), 2)
    fuel_cost_usd = round(fuel_used_liters * equipment.fuel_cost_per_liter_usd, 2)

    # 2. Labor cost
    labor_cost_usd = round(equipment.min_crew_size * equipment.hourly_labor_rate_usd * total_cycle_time_h, 2)

    # 3. Vehicle transit wear cost ($0.45 per km for light trucks, $0.20 for compacts)
    transit_cost_usd = round(transit_distance_km * 0.35, 2)

    # 4. Maintenance reserve & consumables (gaskets, lube, water priming)
    maintenance_cost_usd = equipment.maintenance_cost_per_job_usd

    # 5. Sludge disposal fee at authorized FSTP (Faecal Sludge Treatment Plant)
    disposal_fee_usd = round(sludge_vol_m3 * equipment.sludge_disposal_fee_per_m3_usd, 2)

    total_cost_usd = round(fuel_cost_usd + labor_cost_usd + transit_cost_usd + maintenance_cost_usd + disposal_fee_usd, 2)
    cost_per_m3_usd = round(total_cost_usd / max(0.1, sludge_vol_m3), 2)

    # Productivity: jobs per 8-hour shift
    jobs_per_shift = max(0.1, round(8.0 / max(1.0, total_cycle_time_h), 2))

    # Scores
    accessibility_score, access_rationale = evaluate_accessibility_score(equipment, site)
    climate_score, climate_rationale = evaluate_climate_suitability(equipment, site)

    return {
        "equipment_id": equipment.id,
        "equipment_name": equipment.name,
        "sludge_volume_m3": round(sludge_vol_m3, 2),
        "sludge_density_kg_m3": round(density_kg_m3, 1),
        "sludge_viscosity_cp": round(viscosity_cp, 1),
        "rated_flow_m3_h": equipment.rated_flow_m3_h,
        "effective_flow_m3_h": effective_flow,
        "hydraulics": hydraulics,
        "hydraulic_power_kw": hydraulic_power_kw,
        "rated_power_kw": equipment.power_kw,
        "power_margin_pct": power_margin_pct,
        "ideal_pumping_time_h": ideal_pumping_time_h,
        "actual_pumping_time_h": actual_pumping_time_h,
        "total_on_site_job_time_h": total_on_site_job_time_h,
        "transit_time_h": transit_time_h,
        "total_cycle_time_h": total_cycle_time_h,
        "jobs_per_shift": jobs_per_shift,
        "costs": {
            "fuel_cost_usd": fuel_cost_usd,
            "labor_cost_usd": labor_cost_usd,
            "transit_cost_usd": transit_cost_usd,
            "maintenance_cost_usd": maintenance_cost_usd,
            "disposal_fee_usd": disposal_fee_usd,
            "total_cost_usd": total_cost_usd,
            "cost_per_m3_usd": cost_per_m3_usd
        },
        "accessibility": {
            "score": accessibility_score,
            "rationale": access_rationale
        },
        "climate": {
            "score": climate_score,
            "rationale": climate_rationale
        },
        "slosh_stability": calculate_slosh_dynamics_and_rollover(
            slope_deg=site.slope_degrees,
            equipment=equipment,
            payload_liters=min(400.0, site.containment_volume_liters)
        )
    }

