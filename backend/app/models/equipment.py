from pydantic import BaseModel, Field
from typing import List, Literal

EquipmentType = Literal[
    "compact_motorized",
    "portable_pump_hose",
    "modular_trailer",
    "small_vacuum_tanker",
    "remote_tracked_unit",
    "modular_site_assembled"
]

class EquipmentProfile(BaseModel):
    id: str
    name: str
    equipment_type: EquipmentType
    description: str
    
    # Capacity & Hydraulics
    rated_flow_m3_h: float = Field(..., description="Nominal fluid pumping flow rate m³/h")
    effective_flow_m3_h: float = Field(..., description="Estimated baseline operational flow m³/h")
    max_vertical_lift_m: float = Field(..., description="Maximum allowable suction lift in metres")
    max_pumping_distance_m: float = Field(..., description="Maximum discharge hose length in metres")
    hose_inner_dia_mm: float = Field(default=75.0, description="Hose internal diameter in mm (typically 50-100mm)")
    pump_efficiency: float = Field(default=0.65, description="Mechanical/hydraulic pump efficiency (0.4 - 0.8)")
    
    # Portability & Dimensions
    weight_kg: float = Field(..., description="Total unit dry weight in kilograms")
    width_m: float = Field(..., description="Overall equipment operating width in metres")
    max_slope_degrees: float = Field(..., description="Safe static/dynamic climbing slope limit in degrees")
    min_access_width_m: float = Field(..., description="Minimum road/alley clearance needed in metres")
    allowed_surfaces: List[str] = Field(..., description="Supported road surfaces (paved, gravel, mud, rough_trail)")
    min_crew_size: int = Field(default=2, description="Required operator crew count")
    
    # Sludge Rheology Tolerance
    max_solids_pct: float = Field(..., description="Maximum solids concentration handled without severe clogging (%)")
    max_viscosity_cp: float = Field(..., description="Maximum dynamic viscosity handled in centipoise (cP)")
    requires_water_priming: bool = Field(default=True, description="Needs water supply for priming or fluidization")
    
    # Power & Energy
    power_source: Literal["petrol_engine", "diesel_engine", "electric_grid", "battery_hybrid", "manual_assisted"]
    power_kw: float = Field(..., description="Engine or motor power rating in kW")
    fuel_consumption_l_h: float = Field(default=1.2, description="Fuel consumption in L/h or kWh/h if electric")
    
    # Climate Resilience
    cold_limit_c: float = Field(default=-10.0, description="Minimum operating temperature without freeze protection")
    hot_limit_c: float = Field(default=48.0, description="Maximum continuous ambient operating temperature")
    rain_tolerant: bool = Field(default=True, description="IP rating or weatherproofing for heavy rainfall")
    
    # Economics & Operations
    capital_cost_usd: float = Field(..., description="Acquisition cost in USD")
    hourly_labor_rate_usd: float = Field(default=15.0, description="Hourly labor cost per operator")
    fuel_cost_per_liter_usd: float = Field(default=1.35, description="Fuel or energy unit cost")
    setup_time_min: float = Field(..., description="Average on-site deployment & hose connection time in minutes")
    breakdown_time_min: float = Field(..., description="Washdown, decontamination and pack-up time in minutes")
    maintenance_cost_per_job_usd: float = Field(default=12.0, description="Wear-and-tear / maintenance reserve per job")
    sludge_disposal_fee_per_m3_usd: float = Field(default=8.0, description="Authorized treatment plant tipping fee per m³")
    
    # Safety & Reliability Indicators
    confined_space_prevention_score: float = Field(default=95.0, description="Safety rating for zero-entry operation (0-100)")
    hose_burst_safety_factor: float = Field(default=3.0, description="Working pressure burst safety margin")
    spill_containment_integrated: bool = Field(default=True, description="Contains built-in drip tray and isolation ball valve")
    
    # Evidence & Assumptions
    confidence_level: Literal["High (Verified Standards)", "Medium (Prototype Tested)", "Assumption (Conceptual Design)"]
    data_source: str = Field(..., description="Source citation, standard or engineering baseline")


DEFAULT_EQUIPMENT_CATALOG: List[EquipmentProfile] = [
    EquipmentProfile(
        id="EQ-01",
        name="Compact Motorized Vacuum Unit (VacuTug Mk-II)",
        equipment_type="compact_motorized",
        description="Self-propelled narrow-gauge three-wheel vacuum unit with 500L steel tank, geared Honda petrol engine, and rotary vane vacuum pump for tight alleyways.",
        rated_flow_m3_h=9.0,
        effective_flow_m3_h=5.5,
        max_vertical_lift_m=5.5,
        max_pumping_distance_m=60.0,
        hose_inner_dia_mm=75.0,
        pump_efficiency=0.60,
        weight_kg=480.0,
        width_m=0.88,
        max_slope_degrees=15.0,
        min_access_width_m=1.05,
        allowed_surfaces=["paved", "gravel", "mud"],
        min_crew_size=2,
        max_solids_pct=16.0,
        max_viscosity_cp=3500.0,
        requires_water_priming=False,
        power_source="petrol_engine",
        power_kw=4.1,
        fuel_consumption_l_h=1.4,
        cold_limit_c=-2.0,
        hot_limit_c=45.0,
        rain_tolerant=True,
        capital_cost_usd=6200.0,
        setup_time_min=18.0,
        breakdown_time_min=22.0,
        maintenance_cost_per_job_usd=14.0,
        confined_space_prevention_score=90.0,
        confidence_level="High (Verified Standards)",
        data_source="UN-Habitat VacuTug Technology Assessment / Eawag Sandec Field Specs"
    ),
    EquipmentProfile(
        id="EQ-02",
        name="Portable High-Lift Diaphragm & Trash Pump System",
        equipment_type="portable_pump_hose",
        description="Two-man carry skid-mounted positive displacement diaphragm pump with lightweight collapsible layflat hoses, designed for extreme slopes and steep stairs.",
        rated_flow_m3_h=6.5,
        effective_flow_m3_h=4.0,
        max_vertical_lift_m=6.8,
        max_pumping_distance_m=120.0,
        hose_inner_dia_mm=65.0,
        pump_efficiency=0.62,
        weight_kg=68.0,
        width_m=0.62,
        max_slope_degrees=32.0,
        min_access_width_m=0.75,
        allowed_surfaces=["paved", "gravel", "mud", "rough_trail"],
        min_crew_size=2,
        max_solids_pct=22.0,
        max_viscosity_cp=6000.0,
        requires_water_priming=True,
        power_source="petrol_engine",
        power_kw=3.2,
        fuel_consumption_l_h=1.0,
        cold_limit_c=-10.0,
        hot_limit_c=48.0,
        rain_tolerant=True,
        capital_cost_usd=3800.0,
        setup_time_min=25.0,
        breakdown_time_min=30.0,
        maintenance_cost_per_job_usd=18.0,
        confined_space_prevention_score=95.0,
        confidence_level="High (Verified Standards)",
        data_source="WFP / Oxfam Emergency Sanitation Pump Manual & Field Testing"
    ),
    EquipmentProfile(
        id="EQ-03",
        name="Modular ATV / Micro-Tractor Trailer Vacuum Unit",
        equipment_type="modular_trailer",
        description="Articulated all-terrain 4x4 trailer with 1000L cylindrical pressure vessel, liquid ring vacuum pump, and high-traction flotation tyres for rolling and gravel routes.",
        rated_flow_m3_h=14.0,
        effective_flow_m3_h=8.5,
        max_vertical_lift_m=6.0,
        max_pumping_distance_m=80.0,
        hose_inner_dia_mm=80.0,
        pump_efficiency=0.68,
        weight_kg=850.0,
        width_m=1.25,
        max_slope_degrees=18.0,
        min_access_width_m=1.45,
        allowed_surfaces=["paved", "gravel", "mud"],
        min_crew_size=2,
        max_solids_pct=18.0,
        max_viscosity_cp=4000.0,
        requires_water_priming=False,
        power_source="diesel_engine",
        power_kw=7.5,
        fuel_consumption_l_h=2.2,
        cold_limit_c=-5.0,
        hot_limit_c=46.0,
        rain_tolerant=True,
        capital_cost_usd=11500.0,
        setup_time_min=15.0,
        breakdown_time_min=20.0,
        maintenance_cost_per_job_usd=16.0,
        confined_space_prevention_score=92.0,
        confidence_level="Medium (Prototype Tested)",
        data_source="Appropriate Technology Technical Monograph on Micro-Vacuum Tankers"
    ),
    EquipmentProfile(
        id="EQ-04",
        name="4x4 Narrow-Chassis Vacuum Tanker (2000L)",
        equipment_type="small_vacuum_tanker",
        description="Compact all-wheel-drive light commercial truck with PTO-driven rotary vane vacuum/blower pump, hydraulic tipping tank, and high-pressure jetting reel.",
        rated_flow_m3_h=28.0,
        effective_flow_m3_h=18.0,
        max_vertical_lift_m=6.2,
        max_pumping_distance_m=90.0,
        hose_inner_dia_mm=100.0,
        pump_efficiency=0.72,
        weight_kg=3400.0,
        width_m=1.92,
        max_slope_degrees=14.0,
        min_access_width_m=2.20,
        allowed_surfaces=["paved", "gravel"],
        min_crew_size=2,
        max_solids_pct=20.0,
        max_viscosity_cp=4500.0,
        requires_water_priming=False,
        power_source="diesel_engine",
        power_kw=28.0,
        fuel_consumption_l_h=4.8,
        cold_limit_c=-8.0,
        hot_limit_c=50.0,
        rain_tolerant=True,
        capital_cost_usd=42000.0,
        setup_time_min=10.0,
        breakdown_time_min=15.0,
        maintenance_cost_per_job_usd=25.0,
        confined_space_prevention_score=94.0,
        confidence_level="High (Verified Standards)",
        data_source="Municipal Sanitation Vehicle Standards (DIN 30705 / Euro 6 Compact Specifications)"
    ),
    EquipmentProfile(
        id="EQ-05",
        name="Remote-Operated Tracked Crawler Sludge Unit",
        equipment_type="remote_tracked_unit",
        description="Tethered rubber-track robotic crawler with onboard submersible masticating vortex pump, fluidizing water jet nozzle, and slope winch anchor system for steep slopes and stairs.",
        rated_flow_m3_h=11.0,
        effective_flow_m3_h=7.0,
        max_vertical_lift_m=9.5,
        max_pumping_distance_m=150.0,
        hose_inner_dia_mm=75.0,
        pump_efficiency=0.64,
        weight_kg=290.0,
        width_m=0.72,
        max_slope_degrees=36.0,
        min_access_width_m=0.85,
        allowed_surfaces=["paved", "gravel", "mud", "rough_trail"],
        min_crew_size=2,
        max_solids_pct=26.0,
        max_viscosity_cp=8500.0,
        requires_water_priming=True,
        power_source="battery_hybrid",
        power_kw=5.5,
        fuel_consumption_l_h=1.8,
        cold_limit_c=-15.0,
        hot_limit_c=48.0,
        rain_tolerant=True,
        capital_cost_usd=16800.0,
        setup_time_min=20.0,
        breakdown_time_min=25.0,
        maintenance_cost_per_job_usd=28.0,
        confined_space_prevention_score=99.0,
        confidence_level="Medium (Prototype Tested)",
        data_source="Robotic Confined Non-Entry Desludging Trials (IIT Madras / Bandicoot & Scavenger Platform)"
    ),
    EquipmentProfile(
        id="EQ-06",
        name="Modular Site-Assembled Progressive Cavity System",
        equipment_type="modular_site_assembled",
        description="Breakdown system comprising 4 modular backpacks (<25kg each): electric/petrol hydraulic power pack, helical rotor progressive cavity pump, manifold, and collapsible 1000L TPU containment bladder.",
        rated_flow_m3_h=7.5,
        effective_flow_m3_h=5.0,
        max_vertical_lift_m=7.5,
        max_pumping_distance_m=200.0,
        hose_inner_dia_mm=65.0,
        pump_efficiency=0.66,
        weight_kg=95.0,
        width_m=0.55,
        max_slope_degrees=40.0,
        min_access_width_m=0.65,
        allowed_surfaces=["paved", "gravel", "mud", "rough_trail"],
        min_crew_size=3,
        max_solids_pct=28.0,
        max_viscosity_cp=10000.0,
        requires_water_priming=True,
        power_source="petrol_engine",
        power_kw=4.0,
        fuel_consumption_l_h=1.2,
        cold_limit_c=-12.0,
        hot_limit_c=50.0,
        rain_tolerant=True,
        capital_cost_usd=7400.0,
        setup_time_min=35.0,
        breakdown_time_min=40.0,
        maintenance_cost_per_job_usd=20.0,
        confined_space_prevention_score=96.0,
        confidence_level="Assumption (Conceptual Design)",
        data_source="Modular Mountain Sanitation Concept (Swiss Federal Institute of Aquatic Science - Sandec)"
    )
]
