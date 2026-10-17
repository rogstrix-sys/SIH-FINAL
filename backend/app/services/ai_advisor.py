from typing import List, Dict, Any
from ..models.site import SiteConditions
from ..models.equipment import EquipmentProfile
from .recommendation import EquipmentRecommendation

def generate_ai_engineering_narrative(
    site: SiteConditions,
    recommendations: List[EquipmentRecommendation]
) -> Dict[str, Any]:
    """
    Generates deterministic, explainable engineering synthesis and decision support insights.
    Identifies governing physical bottlenecks, trade-offs, and design improvements.
    """
    if not recommendations:
        return {
            "executive_summary": "No equipment catalog available for evaluation.",
            "governing_constraints": [],
            "top_choice_rationale": "N/A",
            "tradeoff_analysis": "N/A",
            "missing_data_advisory": [],
            "engineering_action_items": []
        }

    feasible_recs = [r for r in recommendations if r.is_feasible]
    infeasible_recs = [r for r in recommendations if not r.is_feasible]
    top_choice = feasible_recs[0] if feasible_recs else None

    # Identify primary bottlenecks
    governing_constraints = []
    if site.slope_degrees >= 18.0:
        governing_constraints.append(
            f"Steep Terrain ({site.slope_degrees}°): Severe rollover hazard eliminates heavy wheeled tankers and restricts operations to tracked or man-portable frames."
        )
    if site.access_width_m <= 1.2:
        governing_constraints.append(
            f"Corridor Bottleneck ({site.access_width_m}m): Alleyway width limits vehicular access; units wider than {site.access_width_m - 0.2:.1f}m cannot navigate."
        )
    if site.vertical_suction_lift_m >= 5.0:
        governing_constraints.append(
            f"High Suction Lift ({site.vertical_suction_lift_m}m): Approaches atmospheric barometric vacuum cavitation threshold (10.33m theoretical, ~6.5m practical for vacuum units)."
        )
    if site.solids_concentration_pct >= 18.0 or site.sludge_consistency in ["viscous", "thick_crust"]:
        governing_constraints.append(
            f"High Sludge Rheology ({site.solids_concentration_pct}% solids, '{site.sludge_consistency}'): High yield stress induces friction head loss and requires mechanical disruption or water injection."
        )
    if site.temperature_c <= 0.0:
        governing_constraints.append(
            f"Sub-zero Freeze Risk ({site.temperature_c}°C): Sludge viscosity increases sharply; risk of discharge hose freeze and engine fluid gelation."
        )
    if site.rainfall_mm_h >= 15.0:
        governing_constraints.append(
            f"Precipitation & Mud ({site.rainfall_mm_h} mm/h): Surface traction degraded; risk of pit inundation and electrical hazards."
        )

    if not governing_constraints:
        governing_constraints.append("Favorable site conditions: Standard road access, moderate slope, and manageable sludge consistency.")

    # Executive Summary
    if top_choice:
        top_name = top_choice.equipment.name
        top_cost = top_choice.calculations["costs"]["total_cost_usd"]
        top_time = top_choice.calculations["total_cycle_time_h"]
        top_tdh = top_choice.calculations["hydraulics"]["total_dynamic_head_m"]
        summary = (
            f"SITE ANALYSIS COMPLETE. Selected primary solution is '{top_name}' (Composite Score: {top_choice.composite_score:.1f}/100). "
            f"The operation will extract {site.containment_volume_liters:.0f}L of {site.sludge_consistency} sludge at {site.solids_concentration_pct}% solids, "
            f"overcoming a Total Dynamic Head of {top_tdh:.1f}m. Projected complete job cycle is {top_time:.1f} hours at an estimated cost of ${top_cost:.2f} "
            f"(${top_choice.calculations['costs']['cost_per_m3_usd']:.2f}/m³)."
        )
    else:
        summary = (
            "CRITICAL FEASIBILITY ALERT: Zero catalog configurations satisfy all mandatory site and safety gate constraints. "
            "Manual review or site pre-treatment (such as road grading or deploying multi-stage booster bladders) is required."
        )

    # Top choice rationale
    if top_choice:
        top_rationale = (
            f"'{top_choice.equipment.name}' is selected because it directly addresses the governing site bottlenecks. "
            f"With an operating width of {top_choice.equipment.width_m}m, it clears the {site.access_width_m}m access corridor with safety margin. "
            f"Its climbing capability of {top_choice.equipment.max_slope_degrees}° safely negotiates the {site.slope_degrees}° terrain gradient. "
            f"The positive displacement/vacuum mechanism provides {top_choice.calculations['effective_flow_m3_h']:.1f} m³/h effective pumping throughput, "
            f"maintaining a {top_choice.calculations['power_margin_pct']:.1f}% engine power reserve."
        )
    else:
        top_rationale = "No single unit meets all environmental, hydraulic, and access criteria simultaneously."

    # Trade-off analysis
    tradeoff_points = []
    if len(feasible_recs) >= 2:
        runner_up = feasible_recs[1]
        tradeoff_points.append(
            f"Alternative Option: '{runner_up.equipment.name}' ranked #2 (Score {runner_up.composite_score:.1f}). "
            f"Cost difference: ${runner_up.calculations['costs']['total_cost_usd'] - top_choice.calculations['costs']['total_cost_usd']:+.2f}; "
            f"Time difference: {runner_up.calculations['total_cycle_time_h'] - top_choice.calculations['total_cycle_time_h']:+.1f} hours. "
            f"{'Faster pumping throughput but heavier footprint' if runner_up.equipment.weight_kg > top_choice.equipment.weight_kg else 'Lighter portability but lower pumping capacity'}."
        )
    
    if infeasible_recs:
        top_infeasible = infeasible_recs[0]
        reasons_summary = "; ".join(top_infeasible.rejection_reasons[:2])
        tradeoff_points.append(
            f"Rejected Option: '{top_infeasible.equipment.name}' was eliminated due to: {reasons_summary}."
        )

    tradeoff_text = " ".join(tradeoff_points) if tradeoff_points else "No alternative feasible candidates available for trade-off comparison."

    # Missing data advisory
    missing_data = []
    if site.solids_concentration_pct == 14.0:
        missing_data.append("Sludge Total Solids (TS%) is estimated at nominal default (14%). Direct lab gravimetric test recommended.")
    if site.vertical_suction_lift_m == 3.5:
        missing_data.append("Suction depth is assumed at 3.5m. Measure bottom sludge depth to verify pump impeller cavitation margin.")
    if site.route_length_m == 1200.0:
        missing_data.append("Disposal transit distance is set to default (1.2 km). Confirm legal FSTP tipping facility route.")
    if site.water_available_l < 100 and site.sludge_consistency in ["viscous", "thick_crust"]:
        missing_data.append("Water supply is low for dense sludge. Survey nearest municipal hydrant or domestic tap.")

    # Engineering Action Items
    action_items = []
    if top_choice:
        action_items.extend(top_choice.practical_improvements)
    action_items.append("Conduct ambient 4-gas atmosphere test at pit mouth prior to seal displacement.")
    action_items.append("Verify non-entry protocol: assemble remote fluidization wand before uncapping.")

    return {
        "executive_summary": summary,
        "governing_constraints": governing_constraints,
        "top_choice_rationale": top_rationale,
        "tradeoff_analysis": tradeoff_text,
        "missing_data_advisory": missing_data,
        "engineering_action_items": action_items
    }
