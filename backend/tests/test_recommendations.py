import pytest
from app.models.site import SiteConditions
from app.models.equipment import DEFAULT_EQUIPMENT_CATALOG
from app.services.recommendation import evaluate_and_rank_catalog, check_feasibility
from app.services.calculations import perform_engineering_calculations

@pytest.fixture
def standard_site():
    return SiteConditions(
        terrain_type="rolling",
        slope_degrees=12.0,
        access_width_m=2.0,
        distance_to_facility_m=30.0,
        route_length_m=1000.0,
        road_surface="gravel",
        elevation_m=500.0,
        climate_zone="temperate",
        temperature_c=22.0,
        rainfall_mm_h=0.0,
        containment_volume_liters=3000.0,
        sludge_consistency="slurry",
        solids_concentration_pct=10.0,
        pumping_distance_m=30.0,
        vertical_suction_lift_m=3.0,
        water_available_l=300.0,
        power_available=True,
        budget_usd=400.0,
        desired_duration_h=4.0
    )

def test_excessive_slope_rejection(standard_site):
    # 26 degree slope: exceeds small tanker (14°) and compact motorized (15°), trailer (18°)
    steep_site = standard_site.model_copy(update={"slope_degrees": 26.0})
    recs = evaluate_and_rank_catalog(steep_site)
    
    tanker_rec = next(r for r in recs if r.equipment.equipment_type == "small_vacuum_tanker")
    assert not tanker_rec.is_feasible
    assert any("slope" in reason.lower() for reason in tanker_rec.rejection_reasons)

    portable_rec = next(r for r in recs if r.equipment.equipment_type == "portable_pump_hose")
    assert portable_rec.is_feasible

def test_narrow_access_width_rejection(standard_site):
    # 1.1m road: narrow corridor eliminates small vacuum tanker (1.92m width, 2.2m min access)
    narrow_site = standard_site.model_copy(update={"access_width_m": 1.1})
    recs = evaluate_and_rank_catalog(narrow_site)

    tanker_rec = next(r for r in recs if r.equipment.equipment_type == "small_vacuum_tanker")
    assert not tanker_rec.is_feasible
    assert any("clearance" in reason.lower() or "bottleneck" in reason.lower() for reason in tanker_rec.rejection_reasons)

def test_suction_lift_cutoff(standard_site):
    # 8.0m suction lift exceeds standard vacuum units (max 5.5 - 6.2m)
    deep_site = standard_site.model_copy(update={"vertical_suction_lift_m": 8.0})
    recs = evaluate_and_rank_catalog(deep_site)

    vac_rec = next(r for r in recs if r.equipment.equipment_type == "compact_motorized")
    assert not vac_rec.is_feasible
    assert any("suction" in reason.lower() for reason in vac_rec.rejection_reasons)

def test_extreme_freeze_rejection(standard_site):
    # -20°C freeze condition rejects units with -2°C or -5°C limit
    frozen_site = standard_site.model_copy(update={"temperature_c": -20.0})
    recs = evaluate_and_rank_catalog(frozen_site)

    vac_rec = next(r for r in recs if r.equipment.equipment_type == "compact_motorized")
    assert not vac_rec.is_feasible
    assert any("freeze" in reason.lower() or "cold" in reason.lower() for reason in vac_rec.rejection_reasons)

def test_ranking_order_feasible_first(standard_site):
    recs = evaluate_and_rank_catalog(standard_site)
    # Ensure all feasible items appear before infeasible items
    feasible_indices = [i for i, r in enumerate(recs) if r.is_feasible]
    infeasible_indices = [i for i, r in enumerate(recs) if not r.is_feasible]

    if feasible_indices and infeasible_indices:
        assert max(feasible_indices) < min(infeasible_indices)
