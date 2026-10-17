from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from ..models.site import SiteConditions
from ..models.equipment import EquipmentProfile, DEFAULT_EQUIPMENT_CATALOG
from .calculations import perform_engineering_calculations

class EvaluationWeights(BaseModel):
    cost_weight: float = Field(default=0.25, ge=0.0, le=1.0)
    time_weight: float = Field(default=0.20, ge=0.0, le=1.0)
    accessibility_weight: float = Field(default=0.20, ge=0.0, le=1.0)
    climate_weight: float = Field(default=0.15, ge=0.0, le=1.0)
    safety_weight: float = Field(default=0.10, ge=0.0, le=1.0)
    portability_weight: float = Field(default=0.10, ge=0.0, le=1.0)

class FeasibilityResult(BaseModel):
    is_feasible: bool
    rejection_reasons: List[str]
    warning_flags: List[str]

class EquipmentRecommendation(BaseModel):
    equipment: EquipmentProfile
    is_feasible: bool
    rank: int
    composite_score: float
    rejection_reasons: List[str]
    warning_flags: List[str]
    strengths: List[str]
    limitations: List[str]
    practical_improvements: List[str]
    calculations: Dict[str, Any]

def check_feasibility(equipment: EquipmentProfile, site: SiteConditions, calculations: Dict[str, Any]) -> FeasibilityResult:
    """
    Applies strict engineering and physical gate constraints.
    Rejects equipment when laws of physics, mechanical dimensions, or environmental limits are breached.
    """
    reasons = []
    warnings = []

    # 1. Slope limit
    if site.slope_degrees > equipment.max_slope_degrees:
        reasons.append(
            f"Physical slope hazard: Site gradient {site.slope_degrees}° exceeds maximum safe vehicle/unit stability limit of {equipment.max_slope_degrees}° (rollover / runaway risk)."
        )

    # 2. Access width limit
    if site.access_width_m < equipment.min_access_width_m:
        reasons.append(
            f"Spatial bottleneck: Minimum required corridor clearance is {equipment.min_access_width_m}m, but site access is only {site.access_width_m}m."
        )

    # 3. Road surface suitability
    if site.road_surface not in equipment.allowed_surfaces:
        reasons.append(
            f"Traction incompatibility: Equipment chassis cannot traverse '{site.road_surface}' terrain (supported: {', '.join(equipment.allowed_surfaces)})."
        )

    # 4. Vertical suction lift limit (Barometric / Cavitation cutoff)
    if site.vertical_suction_lift_m > equipment.max_vertical_lift_m:
        reasons.append(
            f"Atmospheric suction limit: Required suction lift {site.vertical_suction_lift_m}m exceeds unit maximum {equipment.max_vertical_lift_m}m (exceeds vacuum pump cavitation threshold)."
        )

    # 5. Pumping distance limit
    if site.pumping_distance_m > equipment.max_pumping_distance_m:
        reasons.append(
            f"Discharge hose length limit: Distance to containment {site.pumping_distance_m}m exceeds max pump rating of {equipment.max_pumping_distance_m}m."
        )

    # 6. Sludge rheology / Solids handling
    if site.solids_concentration_pct > equipment.max_solids_pct:
        if site.water_available_l < 50.0:
            reasons.append(
                f"Solids clogging hazard: Sludge solids ({site.solids_concentration_pct}%) exceeds pump tolerance ({equipment.max_solids_pct}%) and insufficient water ({site.water_available_l}L) is available for fluidization."
            )
        else:
            warnings.append(
                f"High solids concentration ({site.solids_concentration_pct}%) requires on-site water slurrying ({site.water_available_l}L available)."
            )

    # 7. Extreme freezing limit
    if site.temperature_c < (equipment.cold_limit_c - 3.0):
        reasons.append(
            f"Thermal freeze lock: Ambient temperature {site.temperature_c}°C is below cold operational threshold ({equipment.cold_limit_c}°C). Pump casing and lines will freeze."
        )
    elif site.temperature_c <= 0.0:
        warnings.append(
            "Sub-zero conditions: High risk of hose freeze. Immediate drain/air-purge required post-desludging."
        )

    # 8. Power requirements
    if equipment.power_source == "electric_grid" and not site.power_available:
        reasons.append("Electrical utility missing: Unit requires grid power but site has no AC electrical connection.")

    # 9. Budget overrun check
    total_cost = calculations["costs"]["total_cost_usd"]
    if total_cost > (site.budget_usd * 1.6):
        warnings.append(
            f"Budget strain: Estimated cost (${total_cost}) exceeds target budget (${site.budget_usd}) by >60%."
        )

    # 10. Monsoon rain warning
    if site.rainfall_mm_h > 20.0 and not equipment.rain_tolerant:
        reasons.append("Precipitation limit: Unit has exposed electronics/engine and lacks IP54 rainproofing.")

    is_feasible = len(reasons) == 0
    return FeasibilityResult(is_feasible=is_feasible, rejection_reasons=reasons, warning_flags=warnings)

def evaluate_and_rank_catalog(
    site: SiteConditions,
    catalog: Optional[List[EquipmentProfile]] = None,
    weights: Optional[EvaluationWeights] = None
) -> List[EquipmentRecommendation]:
    """
    Ranks equipment profiles using multi-criteria weighted utility.
    Infeasible models are strictly quarantined with explicit engineering explanations.
    """
    if catalog is None:
        catalog = DEFAULT_EQUIPMENT_CATALOG
    if weights is None:
        weights = EvaluationWeights()

    # Normalization baselines
    results: List[EquipmentRecommendation] = []
    calculations_map: Dict[str, Dict[str, Any]] = {}
    feasibility_map: Dict[str, FeasibilityResult] = {}

    for eq in catalog:
        calc = perform_engineering_calculations(eq, site)
        calculations_map[eq.id] = calc
        feasibility = check_feasibility(eq, site, calc)
        feasibility_map[eq.id] = feasibility

    # Identify min/max for normalization among feasible or all
    feasible_costs = [calculations_map[eq.id]["costs"]["total_cost_usd"] for eq in catalog]
    min_cost, max_cost = min(feasible_costs), max(feasible_costs)

    feasible_times = [calculations_map[eq.id]["total_cycle_time_h"] for eq in catalog]
    min_time, max_time = min(feasible_times), max(feasible_times)

    for eq in catalog:
        calc = calculations_map[eq.id]
        feas = feasibility_map[eq.id]

        # Normalized scores (0 - 100)
        # Cost score: inverted (lower cost = higher score)
        if max_cost > min_cost:
            cost_score = 100.0 * (1.0 - (calc["costs"]["total_cost_usd"] - min_cost) / (max_cost - min_cost))
        else:
            cost_score = 100.0

        # Time score: inverted (faster time = higher score)
        if max_time > min_time:
            time_score = 100.0 * (1.0 - (calc["total_cycle_time_h"] - min_time) / (max_time - min_time))
        else:
            time_score = 100.0

        access_score = calc["accessibility"]["score"]
        climate_score = calc["climate"]["score"]
        safety_score = eq.confined_space_prevention_score
        
        # Portability score: lighter weight & narrower width is better
        portability_score = max(10.0, 100.0 - (eq.weight_kg / 40.0) - (eq.width_m * 15.0))

        # Composite score calculation
        w_sum = (
            weights.cost_weight +
            weights.time_weight +
            weights.accessibility_weight +
            weights.climate_weight +
            weights.safety_weight +
            weights.portability_weight
        )
        if w_sum <= 0:
            w_sum = 1.0

        raw_composite = (
            (cost_score * weights.cost_weight) +
            (time_score * weights.time_weight) +
            (access_score * weights.accessibility_weight) +
            (climate_score * weights.climate_weight) +
            (safety_score * weights.safety_weight) +
            (portability_score * weights.portability_weight)
        ) / w_sum

        # Penalize composite score heavily if infeasible so it ranks at bottom
        final_composite = round(raw_composite if feas.is_feasible else (raw_composite * 0.25), 1)

        # Generate engineering strengths, limitations & improvements
        strengths = []
        limitations = []
        improvements = []

        if calc["accessibility"]["score"] >= 80:
            strengths.append(f"Excellent terrain mobility (Rated up to {eq.max_slope_degrees}° gradient).")
        if calc["costs"]["total_cost_usd"] <= site.budget_usd:
            strengths.append(f"Economically viable (${calc['costs']['total_cost_usd']:.0f} vs ${site.budget_usd:.0f} budget).")
        if eq.confined_space_prevention_score >= 95:
            strengths.append("High worker safety: Fully remote / non-entry suction geometry.")
        if calc["total_cycle_time_h"] <= site.desired_duration_h:
            strengths.append(f"Rapid operational cycle ({calc['total_cycle_time_h']:.1f} hrs vs target {site.desired_duration_h:.1f} hrs).")

        if calc["hydraulics"]["friction_head_m"] > 5.0:
            limitations.append(f"Significant friction head loss ({calc['hydraulics']['friction_head_m']:.1f}m) in narrow hose line.")
        if eq.requires_water_priming and site.water_available_l < 100:
            limitations.append("Pump requires water priming; on-site supply is scarce.")
        if eq.weight_kg > 300 and site.slope_degrees > 15:
            limitations.append(f"Heavy unit ({eq.weight_kg}kg) poses rollover/tethering hazard on slope.")

        # Practical improvements
        if site.slope_degrees > 15 and eq.equipment_type in ["portable_pump_hose", "remote_tracked_unit", "modular_site_assembled"]:
            improvements.append("Deploy ground-peg deadman winch anchor for anti-slip stabilization on slope.")
        if site.sludge_consistency in ["viscous", "thick_crust"]:
            improvements.append("Attach inlet fluidization jet ring or mechanical auger cutter to homogenize sludge.")
        if site.temperature_c < 2.0:
            improvements.append("Wrap discharge lines with foam thermal insulation and purge line with compressed air immediately after pumping.")
        if calc["hydraulics"]["total_dynamic_head_m"] > 12.0:
            improvements.append("Install mid-line booster pump or upgrade to 3-inch rigid spiral-wound suction hose.")

        results.append(EquipmentRecommendation(
            equipment=eq,
            is_feasible=feas.is_feasible,
            rank=0,  # assigned post-sort
            composite_score=final_composite,
            rejection_reasons=feas.rejection_reasons,
            warning_flags=feas.warning_flags,
            strengths=strengths if strengths else ["Standard baseline desludging functionality."],
            limitations=limitations if limitations else ["Standard routine operating limits apply."],
            practical_improvements=improvements if improvements else ["Operate according to standard operating manual."],
            calculations=calc
        ))

    # Sort: Feasible first (sorted by composite_score desc), then Infeasible (sorted by composite_score desc)
    feasible_items = sorted([r for r in results if r.is_feasible], key=lambda x: x.composite_score, reverse=True)
    infeasible_items = sorted([r for r in results if not r.is_feasible], key=lambda x: x.composite_score, reverse=True)

    sorted_results = feasible_items + infeasible_items
    for i, r in enumerate(sorted_results):
        r.rank = i + 1

    return sorted_results
