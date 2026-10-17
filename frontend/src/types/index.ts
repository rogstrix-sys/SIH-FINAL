export type TerrainType = 'flat' | 'rolling' | 'hilly' | 'mountainous';
export type RoadSurface = 'paved' | 'gravel' | 'mud' | 'rough_trail';
export type ClimateZone = 'hot_arid' | 'tropical_humid' | 'monsoon_heavy' | 'cold_freezing' | 'temperate';
export type SludgeConsistency = 'liquid' | 'slurry' | 'viscous' | 'thick_crust';

export interface SiteConditions {
  terrain_type: TerrainType;
  slope_degrees: number;
  access_width_m: number;
  distance_to_facility_m: number;
  route_length_m: number;
  road_surface: RoadSurface;
  elevation_m: number;
  climate_zone: ClimateZone;
  temperature_c: number;
  rainfall_mm_h: number;
  containment_volume_liters: number;
  sludge_consistency: SludgeConsistency;
  solids_concentration_pct: number;
  pumping_distance_m: number;
  vertical_suction_lift_m: number;
  water_available_l: number;
  power_available: boolean;
  budget_usd: number;
  desired_duration_h: number;
}

export type EquipmentType = 
  | 'compact_motorized'
  | 'portable_pump_hose'
  | 'modular_trailer'
  | 'small_vacuum_tanker'
  | 'remote_tracked_unit'
  | 'modular_site_assembled';

export interface EquipmentProfile {
  id: string;
  name: string;
  equipment_type: EquipmentType;
  description: string;
  rated_flow_m3_h: number;
  effective_flow_m3_h: number;
  max_vertical_lift_m: number;
  max_pumping_distance_m: number;
  hose_inner_dia_mm: number;
  pump_efficiency: number;
  weight_kg: number;
  width_m: number;
  max_slope_degrees: number;
  min_access_width_m: number;
  allowed_surfaces: string[];
  min_crew_size: number;
  max_solids_pct: number;
  max_viscosity_cp: number;
  requires_water_priming: boolean;
  power_source: string;
  power_kw: number;
  fuel_consumption_l_h: number;
  cold_limit_c: number;
  hot_limit_c: number;
  rain_tolerant: boolean;
  capital_cost_usd: number;
  hourly_labor_rate_usd: number;
  fuel_cost_per_liter_usd: number;
  setup_time_min: number;
  breakdown_time_min: number;
  maintenance_cost_per_job_usd: number;
  sludge_disposal_fee_per_m3_usd: number;
  confined_space_prevention_score: number;
  hose_burst_safety_factor: number;
  spill_containment_integrated: boolean;
  confidence_level: string;
  data_source: string;
}

export interface HydraulicsResult {
  velocity_m_s: number;
  reynolds: number;
  friction_head_m: number;
  minor_losses_m: number;
  static_head_m: number;
  total_dynamic_head_m: number;
}

export interface CostBreakdown {
  fuel_cost_usd: number;
  labor_cost_usd: number;
  transit_cost_usd: number;
  maintenance_cost_usd: number;
  disposal_fee_usd: number;
  total_cost_usd: number;
  cost_per_m3_usd: number;
}

export interface CalculationResult {
  equipment_id: string;
  equipment_name: string;
  sludge_volume_m3: number;
  sludge_density_kg_m3: number;
  sludge_viscosity_cp: number;
  rated_flow_m3_h: number;
  effective_flow_m3_h: number;
  hydraulics: HydraulicsResult;
  hydraulic_power_kw: number;
  rated_power_kw: number;
  power_margin_pct: number;
  ideal_pumping_time_h: number;
  actual_pumping_time_h: number;
  total_on_site_job_time_h: number;
  transit_time_h: number;
  total_cycle_time_h: number;
  jobs_per_shift: number;
  costs: CostBreakdown;
  accessibility: {
    score: number;
    rationale: string;
  };
  climate: {
    score: number;
    rationale: string;
  };
  slosh_stability?: SloshStabilityAnalysis;
}

export interface SloshStabilityAnalysis {
  critical_rollover_angle_deg: number;
  safe_operating_threshold_deg: number;
  payload_liters: number;
  design_features: string;
  com_height_laden_m: number;
  com_surge_displacement_cm: number;
  unbaffled_com_surge_displacement_cm: number;
  unbaffled_critical_angle_deg: number;
  free_surface_reduction_pct: number;
  safety_margin_at_slope_deg: number;
  is_safe_at_current_slope: boolean;
  pitch_back_prevention_status: string;
}

export interface EquipmentRecommendation {
  equipment: EquipmentProfile;
  is_feasible: boolean;
  rank: number;


  composite_score: number;
  rejection_reasons: string[];
  warning_flags: string[];
  strengths: string[];
  limitations: string[];
  practical_improvements: string[];
  calculations: CalculationResult;
}

export interface SafetyAssessmentResult {
  confined_space_mandate: string;
  overall_risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  gas_hazard: {
    risk_level: string;
    primary_toxicants: string[];
    recommended_monitoring: string;
    operational_protocol: string;
  };
  pathogen_hazard: {
    risk_level: string;
    biological_agents: string[];
    transmission_vectors: string[];
    mitigation: string;
  };
  slope_stability_hazard: {
    risk_level: string;
    slope_degrees: number;
    critical_tip_angle_deg: number;
    safety_factor: number;
    mitigation: string;
  };
  slosh_stability?: SloshStabilityAnalysis;
  pressure_hazard: {

    risk_level: string;
    burst_safety_factor: number;
    whip_arrestor_required: boolean;
    mitigation: string;
  };
  electrical_hazard: {
    risk_level: string;
    ground_fault_protection: string;
    mitigation: string;
  };
  spill_control_plan: {
    berm_kit_required: boolean;
    absorbent_capacity_liters: number;
    disinfection_agent: string;
    containment_method: string;
  };
  required_ppe: Array<{ item: string; standard: string }>;
  emergency_protocols: string[];
  compliance_warnings: string[];
}

export interface AiNarrative {
  executive_summary: string;
  governing_constraints: string[];
  top_choice_rationale: string;
  tradeoff_analysis: string;
  missing_data_advisory: string[];
  engineering_action_items: string[];
}

export interface FullRecommendationResponse {
  site: SiteConditions;
  recommendations: EquipmentRecommendation[];
  safety_assessment: SafetyAssessmentResult;
  ai_narrative: AiNarrative;
}

export interface EvaluationWeights {
  cost_weight: number;
  time_weight: number;
  accessibility_weight: number;
  climate_weight: number;
  safety_weight: number;
  portability_weight: number;
}

export interface ScenarioItem {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  site_conditions: SiteConditions;
  selected_equipment_id?: string;
  results_snapshot?: any;
  is_preset: boolean;
}
