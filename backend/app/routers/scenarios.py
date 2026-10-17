import uuid
import csv
import io
from fastapi import APIRouter, HTTPException, Response
from typing import List, Dict, Any, Optional
from ..models.scenario import ScenarioCreate, ScenarioResponse
from ..models.site import SiteConditions
from ..database import (
    save_scenario,
    get_all_scenarios,
    get_scenario_by_id,
    delete_scenario as db_delete_scenario
)

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])

# 5 Defined Baseline Engineering Scenarios
REFERENCE_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "PRESET-01",
        "name": "Himalayan Hillside Settlement (Shimla / Leh)",
        "description": "High altitude hillside with freezing cold winter, 24° steep terrace slopes, and 45m vertical/horizontal hose ascent.",
        "site_conditions": SiteConditions(
            terrain_type="mountainous",
            slope_degrees=24.0,
            access_width_m=1.2,
            distance_to_facility_m=45.0,
            route_length_m=2500.0,
            road_surface="gravel",
            elevation_m=2200.0,
            climate_zone="cold_freezing",
            temperature_c=-3.0,
            rainfall_mm_h=0.0,
            containment_volume_liters=3500.0,
            sludge_consistency="viscous",
            solids_concentration_pct=16.0,
            pumping_distance_m=50.0,
            vertical_suction_lift_m=4.2,
            water_available_l=100.0,
            power_available=False,
            budget_usd=350.0,
            desired_duration_h=5.0
        ).model_dump(),
        "selected_equipment_id": "EQ-02",
        "is_preset": True
    },
    {
        "id": "PRESET-02",
        "name": "Narrow Mountain Village Alley (Uttarakhand / Gangtok)",
        "description": "Ultra-dense pedestrian steps and stone pathways with 0.85m bottleneck width, 28° gradient steps, and deep pit.",
        "site_conditions": SiteConditions(
            terrain_type="mountainous",
            slope_degrees=28.0,
            access_width_m=0.85,
            distance_to_facility_m=70.0,
            route_length_m=1800.0,
            road_surface="rough_trail",
            elevation_m=1750.0,
            climate_zone="temperate",
            temperature_c=12.0,
            rainfall_mm_h=0.0,
            containment_volume_liters=2500.0,
            sludge_consistency="thick_crust",
            solids_concentration_pct=20.0,
            pumping_distance_m=75.0,
            vertical_suction_lift_m=5.0,
            water_available_l=250.0,
            power_available=False,
            budget_usd=280.0,
            desired_duration_h=4.5
        ).model_dump(),
        "selected_equipment_id": "EQ-05",
        "is_preset": True
    },
    {
        "id": "PRESET-03",
        "name": "Monsoon-Affected Rural Settlement (Kerala / Assam)",
        "description": "Heavy tropical precipitation, waterlogged saturated mud tracks, high groundwater table, and pit flood risk.",
        "site_conditions": SiteConditions(
            terrain_type="rolling",
            slope_degrees=10.0,
            access_width_m=1.6,
            distance_to_facility_m=35.0,
            route_length_m=3200.0,
            road_surface="mud",
            elevation_m=80.0,
            climate_zone="monsoon_heavy",
            temperature_c=27.0,
            rainfall_mm_h=42.0,
            containment_volume_liters=4000.0,
            sludge_consistency="slurry",
            solids_concentration_pct=10.0,
            pumping_distance_m=40.0,
            vertical_suction_lift_m=3.0,
            water_available_l=500.0,
            power_available=True,
            budget_usd=220.0,
            desired_duration_h=3.5
        ).model_dump(),
        "selected_equipment_id": "EQ-03",
        "is_preset": True
    },
    {
        "id": "PRESET-04",
        "name": "Hot and Dusty Arid Rural Region (Thar Desert / Kutch)",
        "description": "Extreme 44°C ambient heat, high dust concentration, dehydrated solidified sludge crust, and acute water scarcity.",
        "site_conditions": SiteConditions(
            terrain_type="flat",
            slope_degrees=2.0,
            access_width_m=2.4,
            distance_to_facility_m=20.0,
            route_length_m=5500.0,
            road_surface="gravel",
            elevation_m=220.0,
            climate_zone="hot_arid",
            temperature_c=44.0,
            rainfall_mm_h=0.0,
            containment_volume_liters=5000.0,
            sludge_consistency="thick_crust",
            solids_concentration_pct=26.0,
            pumping_distance_m=25.0,
            vertical_suction_lift_m=3.8,
            water_available_l=40.0,
            power_available=False,
            budget_usd=300.0,
            desired_duration_h=4.0
        ).model_dump(),
        "selected_equipment_id": "EQ-01",
        "is_preset": True
    },
    {
        "id": "PRESET-05",
        "name": "Flat Urban / Peri-Urban Settlement (Delhi / Pune Outskirts)",
        "description": "Paved streets, standard accessible 2.8m roadway, large septic tank volume (6000L), high traffic density.",
        "site_conditions": SiteConditions(
            terrain_type="flat",
            slope_degrees=1.0,
            access_width_m=2.8,
            distance_to_facility_m=15.0,
            route_length_m=6000.0,
            road_surface="paved",
            elevation_m=350.0,
            climate_zone="tropical_humid",
            temperature_c=31.0,
            rainfall_mm_h=0.0,
            containment_volume_liters=6000.0,
            sludge_consistency="slurry",
            solids_concentration_pct=12.0,
            pumping_distance_m=20.0,
            vertical_suction_lift_m=2.8,
            water_available_l=1000.0,
            power_available=True,
            budget_usd=250.0,
            desired_duration_h=2.5
        ).model_dump(),
        "selected_equipment_id": "EQ-04",
        "is_preset": True
    }
]

@router.get("/presets", response_model=List[Dict[str, Any]])
def get_presets():
    """Returns standard reproducible engineering simulation benchmark scenarios."""
    return REFERENCE_PRESETS

@router.get("", response_model=List[Dict[str, Any]])
def list_scenarios():
    """Returns all saved scenarios in SQLite database."""
    return get_all_scenarios()

@router.get("/{scenario_id}", response_model=Dict[str, Any])
def get_scenario(scenario_id: str):
    """Retrieves specific scenario by ID."""
    # Check presets first
    for p in REFERENCE_PRESETS:
        if p["id"] == scenario_id:
            return p
    sc = get_scenario_by_id(scenario_id)
    if not sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return sc

@router.post("", response_model=Dict[str, Any])
def create_scenario(payload: ScenarioCreate):
    """Saves a new simulation scenario to SQLite database."""
    scenario_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
    return save_scenario(
        scenario_id=scenario_id,
        name=payload.name,
        description=payload.description or "",
        site_conditions=payload.site_conditions.model_dump(),
        selected_equipment_id=payload.selected_equipment_id,
        results_snapshot=payload.results_snapshot,
        is_preset=False
    )

@router.put("/{scenario_id}", response_model=Dict[str, Any])
def update_scenario(scenario_id: str, payload: ScenarioCreate):
    """Updates an existing scenario."""
    existing = get_scenario_by_id(scenario_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return save_scenario(
        scenario_id=scenario_id,
        name=payload.name,
        description=payload.description or "",
        site_conditions=payload.site_conditions.model_dump(),
        selected_equipment_id=payload.selected_equipment_id,
        results_snapshot=payload.results_snapshot,
        is_preset=existing.get("is_preset", False)
    )

@router.post("/{scenario_id}/duplicate", response_model=Dict[str, Any])
def duplicate_scenario(scenario_id: str):
    """Duplicates an existing scenario or preset with a new ID."""
    src = None
    for p in REFERENCE_PRESETS:
        if p["id"] == scenario_id:
            src = p
            break
    if not src:
        src = get_scenario_by_id(scenario_id)
    if not src:
        raise HTTPException(status_code=404, detail="Source scenario not found")

    new_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
    return save_scenario(
        scenario_id=new_id,
        name=f"{src['name']} (Copy)",
        description=src.get("description", ""),
        site_conditions=src["site_conditions"],
        selected_equipment_id=src.get("selected_equipment_id"),
        results_snapshot=src.get("results_snapshot"),
        is_preset=False
    )

@router.delete("/{scenario_id}")
def delete_scenario_endpoint(scenario_id: str):
    """Deletes a saved scenario."""
    deleted = db_delete_scenario(scenario_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scenario not found or could not be deleted")
    return {"status": "success", "message": f"Scenario {scenario_id} deleted"}

@router.get("/export/csv")
def export_scenarios_csv():
    """Generates and exports all saved scenarios as a CSV spreadsheet."""
    scenarios = get_all_scenarios()
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Scenario ID", "Name", "Created At", "Terrain", "Slope (deg)", "Access Width (m)",
        "Hose Distance (m)", "Road Surface", "Elevation (m)", "Climate Zone", "Temperature (C)",
        "Rainfall (mm/h)", "Volume (L)", "Consistency", "Solids (%)", "Budget ($)", "Selected Equipment"
    ])

    for s in scenarios:
        sc = s["site_conditions"]
        writer.writerow([
            s["id"],
            s["name"],
            s["created_at"],
            sc.get("terrain_type"),
            sc.get("slope_degrees"),
            sc.get("access_width_m"),
            sc.get("distance_to_facility_m"),
            sc.get("road_surface"),
            sc.get("elevation_m"),
            sc.get("climate_zone"),
            sc.get("temperature_c"),
            sc.get("rainfall_mm_h"),
            sc.get("containment_volume_liters"),
            sc.get("sludge_consistency"),
            sc.get("solids_concentration_pct"),
            sc.get("budget_usd"),
            s.get("selected_equipment_id") or "Auto-recommended"
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=desludging_scenarios.csv"}
    )
