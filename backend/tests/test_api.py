import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.site import SiteConditions

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_list_equipment_endpoint():
    response = client.get("/api/equipment")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 6
    assert any(item["equipment_type"] == "portable_pump_hose" for item in items)

def test_recommendation_endpoint():
    payload = {
        "site": SiteConditions(
            terrain_type="hilly",
            slope_degrees=15.0,
            access_width_m=1.8,
            distance_to_facility_m=40.0,
            route_length_m=1500.0,
            road_surface="gravel",
            elevation_m=1200.0,
            climate_zone="temperate",
            temperature_c=18.0,
            rainfall_mm_h=0.0,
            containment_volume_liters=3000.0,
            sludge_consistency="slurry",
            solids_concentration_pct=12.0,
            pumping_distance_m=40.0,
            vertical_suction_lift_m=3.0,
            water_available_l=200.0,
            power_available=False,
            budget_usd=300.0,
            desired_duration_h=4.0
        ).model_dump()
    }
    response = client.post("/api/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert "safety_assessment" in data
    assert "ai_narrative" in data
    assert len(data["recommendations"]) >= 6

def test_scenario_presets_and_csv_export():
    presets_resp = client.get("/api/scenarios/presets")
    assert presets_resp.status_code == 200
    presets = presets_resp.json()
    assert len(presets) == 5

    csv_resp = client.get("/api/scenarios/export/csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
