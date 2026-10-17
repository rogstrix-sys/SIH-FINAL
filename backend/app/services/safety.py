from typing import List, Dict, Any
from pydantic import BaseModel, Field
from ..models.site import SiteConditions
from ..models.equipment import EquipmentProfile
from .calculations import calculate_slosh_dynamics_and_rollover


class SafetyAssessmentResult(BaseModel):
    confined_space_mandate: str
    overall_risk_level: str  # "LOW", "MODERATE", "HIGH", "CRITICAL"
    gas_hazard: Dict[str, Any]
    pathogen_hazard: Dict[str, Any]
    slope_stability_hazard: Dict[str, Any]
    slosh_stability: Dict[str, Any]
    pressure_hazard: Dict[str, Any]
    electrical_hazard: Dict[str, Any]
    spill_control_plan: Dict[str, Any]
    required_ppe: List[Dict[str, str]]
    emergency_protocols: List[str]
    compliance_warnings: List[str]


def evaluate_safety_and_environment(
    site: SiteConditions,
    equipment: EquipmentProfile
) -> SafetyAssessmentResult:
    """
    Evaluates worker safety, toxic gas dynamics, slope tipping stability, and environmental protection.
    Strictly reinforces the ZERO-ENTRY confined-space mandate.
    """
    # 1. Confined Space Zero-Entry Rule
    zero_entry_rule = (
        "CRITICAL LIFE-SAFETY MANDATE: STRICT ZERO-ENTRY POLICY ENFORCED. "
        "No worker or personnel may enter the septic tank, pit, or manhole for manual desludging, "
        "inspection, or hose placement. Mechanized suction wands, remote fluidizers, or guide tethers "
        "must be operated from ground level outside the containment opening."
    )

    # 2. Toxic Gas Hazard Analysis (H2S, CH4, CO2, NH3)
    # Gas generation accelerates at higher temperatures and high anaerobic containment volumes
    temp = site.temperature_c
    vol = site.containment_volume_liters
    
    if temp > 30.0 and vol > 2000.0:
        gas_risk = "HIGH"
        gas_notes = (
            "Accelerated anaerobic digestion at elevated temperature creates dangerous H2S (Hydrogen Sulfide, toxic/corrosive) "
            "and CH4 (Methane, explosive). Continuous 4-gas monitoring (LEL, O2, H2S, CO) is mandatory before and during pit opening."
        )
    elif temp < 5.0:
        gas_risk = "MODERATE"
        gas_notes = (
            "Low ambient temperature slows microbial kinetics, but enclosed pit headspace can still trap lethal H2S and deficient O2 (<19.5%). "
            "Forced-air ventilation recommended before uncapping."
        )
    else:
        gas_risk = "MODERATE"
        gas_notes = "Standard anaerobic biogas accumulation. Stand upwind during cover removal; avoid ignition sources."

    gas_hazard = {
        "risk_level": gas_risk,
        "primary_toxicants": ["Hydrogen Sulfide (H₂S)", "Methane (CH₄)", "Carbon Dioxide (CO₂)", "Ammonia (NH₃)"],
        "recommended_monitoring": "Portable 4-gas monitor calibrated within 30 days, bump-tested prior to shift.",
        "operational_protocol": gas_notes
    }

    # 3. Pathogen and Biohazard Exposure
    pathogen_hazard = {
        "risk_level": "HIGH",
        "biological_agents": ["Vibrio cholerae", "Salmonella typhi", "Hepatitis A/E", "Ascaris lumbricoides helminth eggs"],
        "transmission_vectors": ["Aerosolization from high-pressure jetting", "Hose disconnection splash", "Dermal contact with slurry"],
        "mitigation": "Camlock safety locking levers with secondary R-clips; 100% splash-shield containment shroud over manhole."
    }

    # 4. Vehicle & Equipment Slope Rollover Stability
    # Static tip angle calculation: theta = arctan(half_track / cg_height)
    # Compact units have track ~0.7-1.2m, CG height ~0.6-0.9m
    # Estimated critical tip angle approx 30° to 38°
    critical_tip_angle = min(40.0, equipment.max_slope_degrees * 1.25)
    slope_safety_factor = round(critical_tip_angle / max(1.0, site.slope_degrees), 2)
    
    if site.slope_degrees >= equipment.max_slope_degrees:
        slope_risk = "CRITICAL"
        slope_notes = f"Site slope {site.slope_degrees}° exceeds safe equipment operational limit {equipment.max_slope_degrees}°. Danger of rollover or runaway descent."
    elif site.slope_degrees >= 15.0:
        slope_risk = "HIGH"
        slope_notes = f"Steep mountain gradient ({site.slope_degrees}°). Chock all wheels, set mechanical parking brake, and anchor unit with tensioned recovery winch cable."
    elif site.slope_degrees >= 8.0:
        slope_risk = "MODERATE"
        slope_notes = f"Moderate slope ({site.slope_degrees}°). Orient vehicle uphill/downhill; avoid perpendicular side-hill parking."
    else:
        slope_risk = "LOW"
        slope_notes = "Flat terrain; standard wheel chocks and handbrake sufficient."

    slope_stability_hazard = {
        "risk_level": slope_risk,
        "slope_degrees": site.slope_degrees,
        "critical_tip_angle_deg": critical_tip_angle,
        "safety_factor": slope_safety_factor,
        "mitigation": slope_notes
    }

    # 5. Pressure & Hose Failure Hazards
    hose_sf = equipment.hose_burst_safety_factor
    pressure_hazard = {
        "risk_level": "LOW" if hose_sf >= 3.0 else "MODERATE",
        "burst_safety_factor": hose_sf,
        "whip_arrestor_required": True,
        "mitigation": "Install safety whip-check cables on all pressurized hose couplings. Verify suction hose vacuum collapse rating (-0.9 bar minimum)."
    }

    # 6. Electrical Hazard in Wet Environments
    if equipment.power_source == "electric_grid" or site.rainfall_mm_h > 0:
        elec_risk = "HIGH" if (site.rainfall_mm_h > 15.0 or site.road_surface == "mud") else "MODERATE"
        elec_notes = "Mandatory 30mA GFCI / RCD circuit breaker on power source. All junction boxes rated IP66 minimum."
    else:
        elec_risk = "LOW"
        elec_notes = "Combustion engine or battery powered; keep spark plug leads dry and grounded."

    electrical_hazard = {
        "risk_level": elec_risk,
        "ground_fault_protection": "Mandatory 30mA RCD/GFCI breaker",
        "mitigation": elec_notes
    }

    # 7. Spill Control & Environmental Protection
    spill_control_plan = {
        "berm_kit_required": True,
        "absorbent_capacity_liters": max(50.0, round(site.containment_volume_liters * 0.05, 0)),
        "disinfection_agent": "0.5% Sodium Hypochlorite (bleach) solution or powdered calcium hypochlorite for post-job decontamination.",
        "containment_method": "Place secondary containment drip trays under all hose joints, pump intake, and vehicle manifold before pumping."
    }

    # 8. Required PPE Matrix
    required_ppe = [
        {"item": "Chemical & Pathogen Resistant Coverall", "standard": "EN 14605 Type 4/3 or OSHA Level C impervious suit"},
        {"item": "Heavy-Duty Nitrile/Neoprene Gauntlets", "standard": "EN 388 / EN 374 chemical & puncture resistant"},
        {"item": "Full-Face Visor / Chemical Splash Goggles", "standard": "ANSI Z87.1 / EN 166 anti-fog impact shield"},
        {"item": "Respiratory Protection (Organic Vapor/P100)", "standard": "NIOSH OV/P100 or FFP3 half-mask for bioaerosol/H2S odor"},
        {"item": "Safety Steel-Toe Rubber Boots", "standard": "EN ISO 20345 S5 SRC slip-resistant sole"},
        {"item": "High-Visibility Vest & Industrial Hard Hat", "standard": "EN ISO 20471 / ANSI Class 2 (for roadside traffic safety)"}
    ]

    # 9. Emergency Protocols
    emergency_protocols = [
        "IMMEDIATE SHUTDOWN: Press emergency kill switch on engine/pump, close tank suction ball valve, isolate power.",
        "TOXIC GAS ALARM (>10 ppm H2S or >10% LEL): Evacuate upwind immediately. Do NOT enter pit to rescue fallen comrades without SCBA. Call emergency services.",
        "HOSE BLOWOUT OR RUPTURE: Cut pump throttle immediately, deploy absorbent spill booms to prevent sludge entering surface water or storm drains.",
        "EYE OR SKIN CONTAMINATION: Flush affected area with clean emergency eyewash water for minimum 15 minutes. Report to medical clinic."
    ]

    # Compliance warnings
    warnings = []
    if site.slope_degrees > 20:
        warnings.append("High slope warning: Physical winch anchor and double wheel chocks required by ISO 21876 / sanitation standards.")
    if site.rainfall_mm_h > 20:
        warnings.append("Monsoon warning: Saturated muddy soil reduces vehicle traction; postpone desludging if flash flood or landslide hazard exists.")
    if site.containment_volume_liters > 10000:
        warnings.append("Large volume warning: Requires multi-trip shuttle or intermediate transfer bladder to prevent overloading axle weights.")

    # Determine overall risk
    if slope_risk == "CRITICAL" or gas_risk == "HIGH" and elec_risk == "HIGH":
        overall_risk = "CRITICAL"
    elif slope_risk == "HIGH" or gas_risk == "HIGH" or site.rainfall_mm_h > 20:
        overall_risk = "HIGH"
    elif slope_risk == "MODERATE" or gas_risk == "MODERATE":
        overall_risk = "MODERATE"
    else:
        overall_risk = "LOW"

    slosh_stability = calculate_slosh_dynamics_and_rollover(
        slope_deg=site.slope_degrees,
        equipment=equipment,
        payload_liters=min(400.0, site.containment_volume_liters)
    )

    return SafetyAssessmentResult(
        confined_space_mandate=zero_entry_rule,
        overall_risk_level=overall_risk,
        gas_hazard=gas_hazard,
        pathogen_hazard=pathogen_hazard,
        slope_stability_hazard=slope_stability_hazard,
        slosh_stability=slosh_stability,
        pressure_hazard=pressure_hazard,
        electrical_hazard=electrical_hazard,
        spill_control_plan=spill_control_plan,
        required_ppe=required_ppe,
        emergency_protocols=emergency_protocols,
        compliance_warnings=warnings
    )

