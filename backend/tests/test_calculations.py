import pytest
import math
from app.models.site import SiteConditions
from app.models.equipment import DEFAULT_EQUIPMENT_CATALOG
from app.services.calculations import (
    estimate_sludge_rheology,
    calculate_pipe_hydraulics,
    calculate_effective_flow,
    perform_engineering_calculations,
    evaluate_accessibility_score,
    evaluate_climate_suitability
)

@pytest.fixture
def base_site():
    return SiteConditions(
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
    )

@pytest.fixture
def sample_equipment():
    return DEFAULT_EQUIPMENT_CATALOG[0]  # Compact motorized unit

def test_sludge_rheology_increases_with_solids():
    density_low, visc_low = estimate_sludge_rheology(5.0, "slurry", 20.0)
    density_high, visc_high = estimate_sludge_rheology(20.0, "slurry", 20.0)
    
    assert density_high > density_low
    assert visc_high > visc_low

def test_sludge_rheology_viscosity_cold_thickening():
    _, visc_warm = estimate_sludge_rheology(15.0, "viscous", 25.0)
    _, visc_cold = estimate_sludge_rheology(15.0, "viscous", 0.0)
    
    # Cold temperature thickens sludge
    assert visc_cold > visc_warm

def test_pumping_time_increases_with_volume(base_site, sample_equipment):
    site_small = base_site.model_copy(update={"containment_volume_liters": 2000.0})
    site_large = base_site.model_copy(update={"containment_volume_liters": 6000.0})

    calc_small = perform_engineering_calculations(sample_equipment, site_small)
    calc_large = perform_engineering_calculations(sample_equipment, site_large)

    assert calc_large["actual_pumping_time_h"] > calc_small["actual_pumping_time_h"]
    assert calc_large["ideal_pumping_time_h"] > calc_small["ideal_pumping_time_h"]
    assert calc_large["total_on_site_job_time_h"] > calc_small["total_on_site_job_time_h"]

def test_pumping_time_decreases_with_higher_flow(base_site):
    eq_low_flow = DEFAULT_EQUIPMENT_CATALOG[1]  # Portable pump (4.0 m3/h eff)
    eq_high_flow = DEFAULT_EQUIPMENT_CATALOG[3]  # Small vacuum tanker (18.0 m3/h eff)

    calc_low = perform_engineering_calculations(eq_low_flow, base_site)
    calc_high = perform_engineering_calculations(eq_high_flow, base_site)

    assert calc_high["actual_pumping_time_h"] < calc_low["actual_pumping_time_h"]

def test_head_increases_hydraulic_power(base_site, sample_equipment):
    site_low_head = base_site.model_copy(update={"vertical_suction_lift_m": 1.5, "slope_degrees": 2.0})
    site_high_head = base_site.model_copy(update={"vertical_suction_lift_m": 5.0, "slope_degrees": 25.0})

    calc_low = perform_engineering_calculations(sample_equipment, site_low_head)
    calc_high = perform_engineering_calculations(sample_equipment, site_high_head)

    assert calc_high["hydraulics"]["total_dynamic_head_m"] > calc_low["hydraulics"]["total_dynamic_head_m"]
    assert calc_high["hydraulic_power_kw"] > calc_low["hydraulic_power_kw"]

def test_friction_loss_increases_with_hose_length():
    hydraulics_short = calculate_pipe_hydraulics(
        flow_m3_h=8.0,
        hose_dia_mm=75.0,
        hose_length_m=20.0,
        elevation_rise_m=3.0,
        density_kg_m3=1080.0,
        viscosity_cp=1500.0
    )
    hydraulics_long = calculate_pipe_hydraulics(
        flow_m3_h=8.0,
        hose_dia_mm=75.0,
        hose_length_m=80.0,
        elevation_rise_m=3.0,
        density_kg_m3=1080.0,
        viscosity_cp=1500.0
    )

    assert hydraulics_long["friction_head_m"] > hydraulics_short["friction_head_m"]
    assert hydraulics_long["total_dynamic_head_m"] > hydraulics_short["total_dynamic_head_m"]

def test_operating_cost_breakdown(base_site, sample_equipment):
    calc = perform_engineering_calculations(sample_equipment, base_site)
    costs = calc["costs"]

    assert costs["fuel_cost_usd"] > 0
    assert costs["labor_cost_usd"] > 0
    assert costs["transit_cost_usd"] > 0
    assert costs["maintenance_cost_usd"] > 0
    assert costs["disposal_fee_usd"] > 0
    
    summed = (
        costs["fuel_cost_usd"] +
        costs["labor_cost_usd"] +
        costs["transit_cost_usd"] +
        costs["maintenance_cost_usd"] +
        costs["disposal_fee_usd"]
    )
    assert abs(costs["total_cost_usd"] - summed) < 0.05
    assert costs["cost_per_m3_usd"] == pytest.approx(costs["total_cost_usd"] / (base_site.containment_volume_liters / 1000.0), 0.1)

def test_safe_division_and_zero_handling(sample_equipment):
    zero_hydraulics = calculate_pipe_hydraulics(
        flow_m3_h=0.0,
        hose_dia_mm=75.0,
        hose_length_m=30.0,
        elevation_rise_m=0.0,
        density_kg_m3=1000.0,
        viscosity_cp=1.0
    )
    assert zero_hydraulics["velocity_m_s"] == 0.0
    assert zero_hydraulics["total_dynamic_head_m"] == 0.0

def test_slosh_dynamics_and_anti_slosh_baffles(sample_equipment):
    from app.services.calculations import calculate_slosh_dynamics_and_rollover
    
    # Test on 28° slope with 400L payload
    res = calculate_slosh_dynamics_and_rollover(slope_deg=28.0, equipment=sample_equipment, payload_liters=400.0)
    
    # Verify key metrics required by design specification
    assert res["critical_rollover_angle_deg"] == 34.2
    assert res["safe_operating_threshold_deg"] == 28.0
    assert res["free_surface_reduction_pct"] > 85.0
    assert res["com_surge_displacement_cm"] < res["unbaffled_com_surge_displacement_cm"]
    assert res["unbaffled_critical_angle_deg"] < 25.0
    assert "under-chassis battery placement" in res["design_features"]
    assert "dual longitudinal anti-slosh baffles" in res["design_features"]

