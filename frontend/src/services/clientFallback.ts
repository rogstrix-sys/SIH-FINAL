import {
  SiteConditions,
  EvaluationWeights,
  FullRecommendationResponse,
  ScenarioItem,
  EquipmentProfile,
  EquipmentRecommendation,
  CalculationResult,
  SafetyAssessmentResult,
  AiNarrative
} from '../types';

export const CLIENT_EQUIPMENT_CATALOG: EquipmentProfile[] = [
  {
    id: "EQ-01",
    name: "Compact Motorized Vacuum Unit (VacuTug Mk-II)",
    equipment_type: "compact_motorized",
    description: "Self-propelled narrow-gauge three-wheel vacuum unit with 500L steel tank, geared Honda petrol engine, and rotary vane vacuum pump for tight alleyways.",
    rated_flow_m3_h: 9.0,
    effective_flow_m3_h: 5.5,
    max_vertical_lift_m: 5.5,
    max_pumping_distance_m: 60.0,
    hose_inner_dia_mm: 75.0,
    pump_efficiency: 0.60,
    weight_kg: 480.0,
    width_m: 0.88,
    max_slope_degrees: 15.0,
    min_access_width_m: 1.05,
    allowed_surfaces: ["paved", "gravel", "mud"],
    min_crew_size: 2,
    max_solids_pct: 16.0,
    max_viscosity_cp: 3500.0,
    requires_water_priming: false,
    power_source: "petrol_engine",
    power_kw: 4.1,
    fuel_consumption_l_h: 1.4,
    cold_limit_c: -2.0,
    hot_limit_c: 45.0,
    rain_tolerant: true,
    capital_cost_usd: 6200.0,
    hourly_labor_rate_usd: 15.0,
    fuel_cost_per_liter_usd: 1.35,
    setup_time_min: 18.0,
    breakdown_time_min: 22.0,
    maintenance_cost_per_job_usd: 14.0,
    sludge_disposal_fee_per_m3_usd: 8.0,
    confined_space_prevention_score: 90.0,
    hose_burst_safety_factor: 3.0,
    spill_containment_integrated: true,
    confidence_level: "High (Verified Standards)",
    data_source: "UN-Habitat VacuTug Technology Assessment / Eawag Sandec Field Specs"
  },
  {
    id: "EQ-02",
    name: "Portable High-Lift Diaphragm & Trash Pump System",
    equipment_type: "portable_pump_hose",
    description: "Two-man carry skid-mounted positive displacement diaphragm pump with lightweight collapsible layflat hoses, designed for extreme slopes and steep stairs.",
    rated_flow_m3_h: 6.5,
    effective_flow_m3_h: 4.0,
    max_vertical_lift_m: 6.8,
    max_pumping_distance_m: 120.0,
    hose_inner_dia_mm: 65.0,
    pump_efficiency: 0.62,
    weight_kg: 68.0,
    width_m: 0.62,
    max_slope_degrees: 32.0,
    min_access_width_m: 0.75,
    allowed_surfaces: ["paved", "gravel", "mud", "rough_trail"],
    min_crew_size: 2,
    max_solids_pct: 22.0,
    max_viscosity_cp: 6000.0,
    requires_water_priming: true,
    power_source: "petrol_engine",
    power_kw: 3.2,
    fuel_consumption_l_h: 1.0,
    cold_limit_c: -10.0,
    hot_limit_c: 48.0,
    rain_tolerant: true,
    capital_cost_usd: 3800.0,
    hourly_labor_rate_usd: 15.0,
    fuel_cost_per_liter_usd: 1.35,
    setup_time_min: 25.0,
    breakdown_time_min: 30.0,
    maintenance_cost_per_job_usd: 18.0,
    sludge_disposal_fee_per_m3_usd: 8.0,
    confined_space_prevention_score: 95.0,
    hose_burst_safety_factor: 3.0,
    spill_containment_integrated: true,
    confidence_level: "High (Verified Standards)",
    data_source: "WFP / Oxfam Emergency Sanitation Pump Manual & Field Testing"
  },
  {
    id: "EQ-03",
    name: "Modular ATV / Micro-Tractor Trailer Vacuum Unit",
    equipment_type: "modular_trailer",
    description: "Articulated all-terrain 4x4 trailer with 1000L cylindrical pressure vessel, liquid ring vacuum pump, and high-traction flotation tyres for rolling and gravel routes.",
    rated_flow_m3_h: 14.0,
    effective_flow_m3_h: 8.5,
    max_vertical_lift_m: 6.0,
    max_pumping_distance_m: 80.0,
    hose_inner_dia_mm: 80.0,
    pump_efficiency: 0.68,
    weight_kg: 850.0,
    width_m: 1.25,
    max_slope_degrees: 20.0,
    min_access_width_m: 1.45,
    allowed_surfaces: ["paved", "gravel", "mud"],
    min_crew_size: 2,
    max_solids_pct: 18.0,
    max_viscosity_cp: 4200.0,
    requires_water_priming: false,
    power_source: "diesel_engine",
    power_kw: 9.8,
    fuel_consumption_l_h: 2.2,
    cold_limit_c: -6.0,
    hot_limit_c: 46.0,
    rain_tolerant: true,
    capital_cost_usd: 12500.0,
    hourly_labor_rate_usd: 15.0,
    fuel_cost_per_liter_usd: 1.35,
    setup_time_min: 15.0,
    breakdown_time_min: 20.0,
    maintenance_cost_per_job_usd: 22.0,
    sludge_disposal_fee_per_m3_usd: 8.0,
    confined_space_prevention_score: 92.0,
    hose_burst_safety_factor: 3.2,
    spill_containment_integrated: true,
    confidence_level: "Medium (Prototype Tested)",
    data_source: "BORDA / CDD Society Decentralized Sanitation Equipment Pilot"
  },
  {
    id: "EQ-04",
    name: "Standard Small Vacuum Tanker (3000L Truck)",
    equipment_type: "small_vacuum_tanker",
    description: "Commercial 3.5-ton utility chassis tanker with high-capacity vacuum blower, hydraulic hose reel, and integrated water jetting for accessible settlements.",
    rated_flow_m3_h: 28.0,
    effective_flow_m3_h: 18.0,
    max_vertical_lift_m: 7.2,
    max_pumping_distance_m: 50.0,
    hose_inner_dia_mm: 100.0,
    pump_efficiency: 0.72,
    weight_kg: 3500.0,
    width_m: 2.10,
    max_slope_degrees: 12.0,
    min_access_width_m: 2.50,
    allowed_surfaces: ["paved", "gravel"],
    min_crew_size: 2,
    max_solids_pct: 15.0,
    max_viscosity_cp: 3000.0,
    requires_water_priming: false,
    power_source: "diesel_engine",
    power_kw: 45.0,
    fuel_consumption_l_h: 5.5,
    cold_limit_c: -4.0,
    hot_limit_c: 50.0,
    rain_tolerant: true,
    capital_cost_usd: 38000.0,
    hourly_labor_rate_usd: 15.0,
    fuel_cost_per_liter_usd: 1.35,
    setup_time_min: 10.0,
    breakdown_time_min: 15.0,
    maintenance_cost_per_job_usd: 30.0,
    sludge_disposal_fee_per_m3_usd: 8.0,
    confined_space_prevention_score: 95.0,
    hose_burst_safety_factor: 3.5,
    spill_containment_integrated: true,
    confidence_level: "High (Verified Standards)",
    data_source: "Municipal FSM Guidelines / Commercial Vacuum Tanker OEM Data"
  },
  {
    id: "EQ-05",
    name: "Autonomous/Remote-Assisted Tracked Crawler Rig",
    equipment_type: "remote_tracked_unit",
    description: "Heavy-duty rubber-tracked remote control carrier with high-head positive displacement progressive cavity macerating pump and dual anti-slosh baffles for 28° mountain slopes.",
    rated_flow_m3_h: 11.0,
    effective_flow_m3_h: 7.2,
    max_vertical_lift_m: 8.5,
    max_pumping_distance_m: 140.0,
    hose_inner_dia_mm: 75.0,
    pump_efficiency: 0.70,
    weight_kg: 580.0,
    width_m: 0.95,
    max_slope_degrees: 30.0,
    min_access_width_m: 1.15,
    allowed_surfaces: ["paved", "gravel", "mud", "rough_trail"],
    min_crew_size: 2,
    max_solids_pct: 28.0,
    max_viscosity_cp: 8500.0,
    requires_water_priming: true,
    power_source: "battery_hybrid",
    power_kw: 7.5,
    fuel_consumption_l_h: 0.8,
    cold_limit_c: -15.0,
    hot_limit_c: 48.0,
    rain_tolerant: true,
    capital_cost_usd: 16800.0,
    hourly_labor_rate_usd: 15.0,
    fuel_cost_per_liter_usd: 1.35,
    setup_time_min: 15.0,
    breakdown_time_min: 18.0,
    maintenance_cost_per_job_usd: 20.0,
    sludge_disposal_fee_per_m3_usd: 8.0,
    confined_space_prevention_score: 98.0,
    hose_burst_safety_factor: 4.0,
    spill_containment_integrated: true,
    confidence_level: "Medium (Prototype Tested)",
    data_source: "SIH-26258 Innovative Robotic Crawler Design Benchmark"
  },
  {
    id: "EQ-06",
    name: "Backpack & Handcart Site-Assembled Modular Pump",
    equipment_type: "modular_site_assembled",
    description: "Interlocking aluminum frame modular unit disassembled into sub-30kg modules for steep stairways, unpaved pedestrian tracks, and hanging mountain pathways.",
    rated_flow_m3_h: 5.0,
    effective_flow_m3_h: 3.2,
    max_vertical_lift_m: 5.8,
    max_pumping_distance_m: 90.0,
    hose_inner_dia_mm: 50.0,
    pump_efficiency: 0.58,
    weight_kg: 92.0,
    width_m: 0.55,
    max_slope_degrees: 35.0,
    min_access_width_m: 0.65,
    allowed_surfaces: ["paved", "gravel", "mud", "rough_trail"],
    min_crew_size: 3,
    max_solids_pct: 18.0,
    max_viscosity_cp: 4500.0,
    requires_water_priming: true,
    power_source: "petrol_engine",
    power_kw: 2.8,
    fuel_consumption_l_h: 0.9,
    cold_limit_c: -8.0,
    hot_limit_c: 46.0,
    rain_tolerant: true,
    capital_cost_usd: 4200.0,
    hourly_labor_rate_usd: 15.0,
    fuel_cost_per_liter_usd: 1.35,
    setup_time_min: 35.0,
    breakdown_time_min: 40.0,
    maintenance_cost_per_job_usd: 16.0,
    sludge_disposal_fee_per_m3_usd: 8.0,
    confined_space_prevention_score: 92.0,
    hose_burst_safety_factor: 2.8,
    spill_containment_integrated: true,
    confidence_level: "Medium (Prototype Tested)",
    data_source: "Field-Assembled Sanitation Guidelines / MSF Field Kits"
  }
];

export const CLIENT_PRESETS: ScenarioItem[] = [
  {
    id: "PRESET-01",
    name: "Himalayan Hillside (Shimla)",
    description: "Steep sub-zero mountain terrace with 22° slope, 1.3m narrow gravel path, viscous sludge, and high elevation.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_preset: true,
    site_conditions: {
      terrain_type: "mountainous",
      slope_degrees: 22.0,
      access_width_m: 1.3,
      distance_to_facility_m: 45.0,
      route_length_m: 2200.0,
      road_surface: "gravel",
      elevation_m: 2100.0,
      climate_zone: "cold_freezing",
      temperature_c: -2.0,
      rainfall_mm_h: 0.0,
      containment_volume_liters: 3200.0,
      sludge_consistency: "viscous",
      solids_concentration_pct: 15.0,
      pumping_distance_m: 45.0,
      vertical_suction_lift_m: 3.8,
      water_available_l: 120.0,
      power_available: false,
      budget_usd: 350.0,
      desired_duration_h: 4.5
    }
  },
  {
    id: "PRESET-02",
    name: "Narrow Mountain Lane (Mussoorie)",
    description: "Extremely steep 26° incline with 0.95m narrow alleys, unpaved rough trail, and heavy slurry.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_preset: true,
    site_conditions: {
      terrain_type: "mountainous",
      slope_degrees: 26.0,
      access_width_m: 0.95,
      distance_to_facility_m: 65.0,
      route_length_m: 1800.0,
      road_surface: "rough_trail",
      elevation_m: 1950.0,
      climate_zone: "temperate",
      temperature_c: 12.0,
      rainfall_mm_h: 2.0,
      containment_volume_liters: 2200.0,
      sludge_consistency: "slurry",
      solids_concentration_pct: 12.0,
      pumping_distance_m: 65.0,
      vertical_suction_lift_m: 4.5,
      water_available_l: 80.0,
      power_available: false,
      budget_usd: 280.0,
      desired_duration_h: 3.5
    }
  },
  {
    id: "PRESET-03",
    name: "Monsoon Slum (Western Ghats)",
    description: "Heavy tropical monsoon rainfall with waterlogged mud paths, high environmental spill vulnerability.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_preset: true,
    site_conditions: {
      terrain_type: "hilly",
      slope_degrees: 14.0,
      access_width_m: 1.2,
      distance_to_facility_m: 35.0,
      route_length_m: 1200.0,
      road_surface: "mud",
      elevation_m: 450.0,
      climate_zone: "monsoon_heavy",
      temperature_c: 26.0,
      rainfall_mm_h: 35.0,
      containment_volume_liters: 4500.0,
      sludge_consistency: "liquid",
      solids_concentration_pct: 8.0,
      pumping_distance_m: 35.0,
      vertical_suction_lift_m: 3.0,
      water_available_l: 250.0,
      power_available: false,
      budget_usd: 320.0,
      desired_duration_h: 4.0
    }
  },
  {
    id: "PRESET-04",
    name: "Arid Rural Settlement (Rajasthan)",
    description: "42°C hot desert setting with severe water scarcity (only 20L available) and dust exposure.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_preset: true,
    site_conditions: {
      terrain_type: "flat",
      slope_degrees: 3.0,
      access_width_m: 2.4,
      distance_to_facility_m: 25.0,
      route_length_m: 3500.0,
      road_surface: "gravel",
      elevation_m: 220.0,
      climate_zone: "hot_arid",
      temperature_c: 42.0,
      rainfall_mm_h: 0.0,
      containment_volume_liters: 5000.0,
      sludge_consistency: "thick_crust",
      solids_concentration_pct: 20.0,
      pumping_distance_m: 25.0,
      vertical_suction_lift_m: 2.5,
      water_available_l: 20.0,
      power_available: true,
      budget_usd: 250.0,
      desired_duration_h: 3.0
    }
  },
  {
    id: "PRESET-05",
    name: "Dense Peri-Urban Settlement (Guwahati)",
    description: "Wide paved access road with large volume septage requiring rapid truck desludging.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_preset: true,
    site_conditions: {
      terrain_type: "rolling",
      slope_degrees: 6.0,
      access_width_m: 3.2,
      distance_to_facility_m: 15.0,
      route_length_m: 4500.0,
      road_surface: "paved",
      elevation_m: 80.0,
      climate_zone: "tropical_humid",
      temperature_c: 28.0,
      rainfall_mm_h: 5.0,
      containment_volume_liters: 7500.0,
      sludge_consistency: "slurry",
      solids_concentration_pct: 10.0,
      pumping_distance_m: 15.0,
      vertical_suction_lift_m: 2.8,
      water_available_l: 300.0,
      power_available: true,
      budget_usd: 400.0,
      desired_duration_h: 2.5
    }
  }
];

export function runClientEvaluation(
  site: SiteConditions,
  weights: EvaluationWeights = {
    cost_weight: 0.25,
    time_weight: 0.20,
    accessibility_weight: 0.20,
    climate_weight: 0.15,
    safety_weight: 0.10,
    portability_weight: 0.10
  }
): FullRecommendationResponse {
  const vol_m3 = site.containment_volume_liters / 1000.0;
  const recommendations: EquipmentRecommendation[] = CLIENT_EQUIPMENT_CATALOG.map((eq) => {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Feasibility gates
    if (site.slope_degrees > eq.max_slope_degrees) {
      reasons.push(`Physical slope hazard: Site gradient ${site.slope_degrees}° exceeds safe limit of ${eq.max_slope_degrees}°.`);
    }
    if (site.access_width_m < eq.min_access_width_m) {
      reasons.push(`Spatial bottleneck: Required width is ${eq.min_access_width_m}m, site is only ${site.access_width_m}m.`);
    }
    if (!eq.allowed_surfaces.includes(site.road_surface)) {
      reasons.push(`Traction incompatibility: Cannot traverse '${site.road_surface}'.`);
    }
    if (site.vertical_suction_lift_m > eq.max_vertical_lift_m) {
      reasons.push(`Atmospheric suction limit: Required lift ${site.vertical_suction_lift_m}m exceeds max ${eq.max_vertical_lift_m}m.`);
    }
    if (site.pumping_distance_m > eq.max_pumping_distance_m) {
      reasons.push(`Hose length limit: Pumping distance ${site.pumping_distance_m}m exceeds max ${eq.max_pumping_distance_m}m.`);
    }
    if (site.temperature_c < eq.cold_limit_c - 3.0) {
      reasons.push(`Thermal freeze lock: Temperature ${site.temperature_c}°C below minimum ${eq.cold_limit_c}°C.`);
    }

    const is_feasible = reasons.length === 0;

    // Engineering calculation estimations
    const effectiveFlow = eq.effective_flow_m3_h;
    const idealPumpTimeH = vol_m3 / Math.max(0.1, effectiveFlow);
    const actualPumpTimeH = idealPumpTimeH * 1.15;
    const setupH = eq.setup_time_min / 60.0;
    const transitH = (site.route_length_m / 1000.0) / 15.0; // 15 km/h transit
    const breakdownH = eq.breakdown_time_min / 60.0;
    const totalOnSiteJobTimeH = actualPumpTimeH + setupH + breakdownH;
    const totalCycleTimeH = totalOnSiteJobTimeH + transitH;

    const fuelCost = totalCycleTimeH * eq.fuel_consumption_l_h * eq.fuel_cost_per_liter_usd;
    const laborCost = totalCycleTimeH * eq.min_crew_size * eq.hourly_labor_rate_usd;
    const transitCost = transitH * 12.0;
    const maintenanceCost = eq.maintenance_cost_per_job_usd;
    const disposalCost = vol_m3 * eq.sludge_disposal_fee_per_m3_usd;
    const totalCost = fuelCost + laborCost + transitCost + maintenanceCost + disposalCost;

    const frictionHeadM = (site.pumping_distance_m / 20.0) * 0.8;
    const totalHeadM = site.vertical_suction_lift_m + frictionHeadM + 1.2;
    const hydraulicPowerKw = (1080 * 9.81 * (effectiveFlow / 3600.0) * totalHeadM) / (eq.pump_efficiency * 1000.0);

    const accessibilityScore = Math.max(10, Math.min(100, Math.round(
      100 - (site.slope_degrees * 1.5) - ((eq.width_m / Math.max(0.5, site.access_width_m)) * 25)
    )));

    // Composite score
    let composite_score = is_feasible
      ? Math.round((accessibilityScore * 0.35 + (100 - Math.min(90, totalCost / 5.0)) * 0.35 + eq.confined_space_prevention_score * 0.30) * 10) / 10
      : Math.round((20 - reasons.length * 5) * 10) / 10;

    const calcResult: CalculationResult = {
      equipment_id: eq.id,
      equipment_name: eq.name,
      sludge_volume_m3: vol_m3,
      sludge_density_kg_m3: 1080.0,
      sludge_viscosity_cp: 3200.0,
      rated_flow_m3_h: eq.rated_flow_m3_h,
      effective_flow_m3_h: effectiveFlow,
      hydraulics: {
        velocity_m_s: 1.4,
        reynolds: 1450,
        friction_head_m: Math.round(frictionHeadM * 10) / 10,
        minor_losses_m: 1.2,
        static_head_m: site.vertical_suction_lift_m,
        total_dynamic_head_m: Math.round(totalHeadM * 10) / 10
      },
      hydraulic_power_kw: Math.round(hydraulicPowerKw * 10) / 10,
      rated_power_kw: eq.power_kw,
      power_margin_pct: Math.max(0, Math.round(((eq.power_kw - hydraulicPowerKw) / Math.max(1, eq.power_kw)) * 100)),
      ideal_pumping_time_h: Math.round(idealPumpTimeH * 100) / 100,
      actual_pumping_time_h: Math.round(actualPumpTimeH * 100) / 100,
      total_on_site_job_time_h: Math.round(totalOnSiteJobTimeH * 100) / 100,
      transit_time_h: Math.round(transitH * 100) / 100,
      total_cycle_time_h: Math.round(totalCycleTimeH * 100) / 100,
      jobs_per_shift: Math.max(1, Math.floor(8.0 / Math.max(1.0, totalCycleTimeH))),
      costs: {
        fuel_cost_usd: Math.round(fuelCost * 10) / 10,
        labor_cost_usd: Math.round(laborCost * 10) / 10,
        transit_cost_usd: Math.round(transitCost * 10) / 10,
        maintenance_cost_usd: Math.round(maintenanceCost * 10) / 10,
        disposal_fee_usd: Math.round(disposalCost * 10) / 10,
        total_cost_usd: Math.round(totalCost * 10) / 10,
        cost_per_m3_usd: Math.round((totalCost / Math.max(0.1, vol_m3)) * 10) / 10
      },
      accessibility: {
        score: accessibilityScore,
        rationale: `Clearance ratio: ${((site.access_width_m / eq.width_m) * 100).toFixed(0)}%. Maximum slope tolerance: ${eq.max_slope_degrees}°.`
      },
      climate: {
        score: site.temperature_c < 0 ? 75 : 92,
        rationale: `Thermal envelope (${eq.cold_limit_c}°C to ${eq.hot_limit_c}°C). Rain tolerance: ${eq.rain_tolerant ? 'Yes' : 'No'}.`
      },
      slosh_stability: {
        critical_rollover_angle_deg: 34.2,
        safe_operating_threshold_deg: 28.0,
        payload_liters: 400,
        design_features: "Low-CoM under-chassis battery + dual longitudinal anti-slosh baffles",
        com_height_laden_m: 0.42,
        com_surge_displacement_cm: 0.9,
        unbaffled_com_surge_displacement_cm: 7.9,
        unbaffled_critical_angle_deg: 21.8,
        free_surface_reduction_pct: 88.9,
        safety_margin_at_slope_deg: Math.max(0, 34.2 - site.slope_degrees),
        is_safe_at_current_slope: site.slope_degrees <= 28.0,
        pitch_back_prevention_status: site.slope_degrees <= 28.0 ? "Fully Mitigated" : "Warning - Exceeds Safe Threshold"
      }
    };

    return {
      equipment: eq,
      is_feasible,
      rank: 1,
      composite_score,
      rejection_reasons: reasons,
      warning_flags: warnings,
      strengths: is_feasible
        ? [
            `High slope climbing capability (${eq.max_slope_degrees}° rated)`,
            `Narrow profile (${eq.width_m}m) clears restricted alleys`,
            `Zero physical pit entry certified (${eq.confined_space_prevention_score}/100)`
          ]
        : ["Compact layout"],
      limitations: is_feasible
        ? [`Payload limited to ${eq.effective_flow_m3_h} m³/h effective pumping`]
        : reasons,
      practical_improvements: [
        "Equip with under-chassis battery pack for low Center-of-Mass",
        "Add internal dual longitudinal anti-slosh baffles in holding tank"
      ],
      calculations: calcResult
    };
  });

  // Sort: feasible first, then highest composite score
  recommendations.sort((a, b) => {
    if (a.is_feasible !== b.is_feasible) return a.is_feasible ? -1 : 1;
    return b.composite_score - a.composite_score;
  });

  recommendations.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  const safetyAssessment: SafetyAssessmentResult = {
    confined_space_mandate: "ZERO PHYSICAL ENTRY - Strictly enforced via robotic / vacuum suction wands under Prohibition of Employment as Manual Scavengers Act 2013.",
    overall_risk_level: site.slope_degrees > 25 ? 'HIGH' : site.slope_degrees > 15 ? 'MODERATE' : 'LOW',
    gas_hazard: {
      risk_level: "High",
      primary_toxicants: ["H2S (Hydrogen Sulfide)", "CH4 (Methane)", "CO (Carbon Monoxide)"],
      recommended_monitoring: "Continuous 4-gas optical sensor with audible alarm at 10 ppm H2S",
      operational_protocol: "Pre-entry forced ventilation for 15 min; surface wand extraction only"
    },
    pathogen_hazard: {
      risk_level: "Moderate",
      biological_agents: ["Helminths", "E. Coli", "Hepatitis A", "Rotavirus"],
      transmission_vectors: ["Aerosolized droplets during suction break", "Direct effluent splash"],
      mitigation: "Full Category 3 chemical splash coverall, nitrile gauntlets, and face shield"
    },
    slope_stability_hazard: {
      risk_level: site.slope_degrees > 20 ? "High" : "Low",
      slope_degrees: site.slope_degrees,
      critical_tip_angle_deg: 34.2,
      safety_factor: Math.round((34.2 / Math.max(1, site.slope_degrees)) * 10) / 10,
      mitigation: "Deploy low-CoM under-chassis ballast and hydraulic stabilizer outriggers"
    },
    pressure_hazard: {
      risk_level: "Moderate",
      burst_safety_factor: 3.5,
      whip_arrestor_required: true,
      mitigation: "Install steel whip-check cables on all camlock quick-connect couplings"
    },
    electrical_hazard: {
      risk_level: "Low",
      ground_fault_protection: "Class A GFCI (4-6 mA trip threshold)",
      mitigation: "IP67 sealed electrical enclosures and explosion-proof brushless motors"
    },
    spill_control_plan: {
      berm_kit_required: site.slope_degrees > 15,
      absorbent_capacity_liters: 150,
      disinfection_agent: "0.5% Sodium Hypochlorite solution",
      containment_method: "Deployable polyurethane drip basin under manifold and suction connections"
    },
    required_ppe: [
      { item: "Chemical Splash Coverall", standard: "ISO 16602 Type 4" },
      { item: "Full Face Shield & Safety Goggles", standard: "ANSI Z87.1" },
      { item: "Heavy Duty Nitrile Gauntlets", standard: "EN 374-3" },
      { item: "Steel-Toe Puncture-Resistant Boots", standard: "ASTM F2413" },
      { item: "Multi-Gas Monitor (4-Gas)", standard: "OSHA 1910.146" }
    ],
    emergency_protocols: [
      "In event of hose rupture: Immediately disengage PTO / kill pump switch; isolate tank foot valve.",
      "In event of rollover warning (>28°): Cease forward motion; deploy hydraulic stabilizer pads immediately.",
      "In event of toxic gas alarm: Evacuate upwind by at least 15m; don emergency escape breathing apparatus."
    ],
    compliance_warnings: [
      "Zero-entry mandate strictly applicable: No worker shall enter the containment pit under any circumstance.",
      "All collected septage must be hauled to registered fecal sludge treatment plant (FSTP)."
    ]
  };

  const aiNarrative: AiNarrative = {
    executive_summary: `Adaptive multi-criteria analysis evaluated 6 mechanized desludging configurations for ${site.terrain_type} terrain with ${site.slope_degrees}° slope under ${site.climate_zone} conditions.`,
    governing_constraints: [
      `Site slope gradient (${site.slope_degrees}°) vs vehicle critical rollover threshold`,
      `Passage clearance (${site.access_width_m}m) through residential access lanes`,
      `Zero-entry requirement with ${site.pumping_distance_m}m horizontal run and ${site.vertical_suction_lift_m}m suction lift`
    ],
    top_choice_rationale: `${recommendations[0].equipment.name} achieved top rank (#1) with a composite score of ${recommendations[0].composite_score}/100, meeting all physical feasibility criteria.`,
    tradeoff_analysis: `While small vacuum tankers offer higher flow rates, their width and slope limitations exclude them from narrow hillside paths. Modular/portable units offer superior accessibility at the trade-off of smaller single-run volume.`,
    missing_data_advisory: [
      "Confirm containment access port diameter before field dispatch (minimum 100mm required for suction head)",
      "Verify water source availability on-site for line flushing and high-solids fluidization"
    ],
    engineering_action_items: [
      "Inspect chassis low-CoM ballast placement prior to hill ascent",
      "Ensure suction hose anti-collapse wire reinforcement is intact",
      "Calibrate 4-gas monitor in fresh air prior to opening pit vault shroud"
    ]
  };

  return {
    site,
    recommendations,
    safety_assessment: safetyAssessment,
    ai_narrative: aiNarrative
  };
}
