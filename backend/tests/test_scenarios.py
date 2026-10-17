import pytest
from app.routers.scenarios import REFERENCE_PRESETS
from app.models.site import SiteConditions
from app.services.recommendation import evaluate_and_rank_catalog

def test_five_reference_scenarios_exist():
    assert len(REFERENCE_PRESETS) == 5
    ids = [p["id"] for p in REFERENCE_PRESETS]
    assert "PRESET-01" in ids  # Himalayan
    assert "PRESET-02" in ids  # Narrow mountain lane
    assert "PRESET-03" in ids  # Monsoon rural
    assert "PRESET-04" in ids  # Hot arid
    assert "PRESET-05" in ids  # Flat peri-urban

def test_himalayan_scenario_recommends_appropriate_equipment():
    # Himalayan: steep (24°), freezing (-3°C), 1.2m road
    himalayan = next(p for p in REFERENCE_PRESETS if p["id"] == "PRESET-01")
    site = SiteConditions(**himalayan["site_conditions"])
    recs = evaluate_and_rank_catalog(site)

    # Tanker and compact motorized should be infeasible due to 24° slope
    tanker = next(r for r in recs if r.equipment.equipment_type == "small_vacuum_tanker")
    assert not tanker.is_feasible

    # Top choice must be portable, remote crawler, or modular assembled
    assert recs[0].is_feasible
    assert recs[0].equipment.equipment_type in ["portable_pump_hose", "remote_tracked_unit", "modular_site_assembled"]

def test_narrow_mountain_lane_recommends_narrow_unit():
    # Mountain lane: 0.85m width, 28° slope
    lane = next(p for p in REFERENCE_PRESETS if p["id"] == "PRESET-02")
    site = SiteConditions(**lane["site_conditions"])
    recs = evaluate_and_rank_catalog(site)

    top_choice = recs[0]
    assert top_choice.is_feasible
    # Must fit in 0.85m
    assert top_choice.equipment.min_access_width_m <= 0.85

def test_flat_peri_urban_recommends_high_capacity():
    # Flat peri-urban: 6000L, paved, 2.8m road width
    urban = next(p for p in REFERENCE_PRESETS if p["id"] == "PRESET-05")
    site = SiteConditions(**urban["site_conditions"])
    recs = evaluate_and_rank_catalog(site)

    # Small vacuum tanker should be feasible and highly ranked
    tanker = next(r for r in recs if r.equipment.equipment_type == "small_vacuum_tanker")
    assert tanker.is_feasible
    assert tanker.rank <= 2  # Top tier for urban paved roads
