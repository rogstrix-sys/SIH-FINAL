from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal

TerrainType = Literal["flat", "rolling", "hilly", "mountainous"]
RoadSurface = Literal["paved", "gravel", "mud", "rough_trail"]
ClimateZone = Literal["hot_arid", "tropical_humid", "monsoon_heavy", "cold_freezing", "temperate"]
SludgeConsistency = Literal["liquid", "slurry", "viscous", "thick_crust"]

class SiteConditions(BaseModel):
    # Geographic
    terrain_type: TerrainType = Field(default="hilly", description="General terrain category")
    slope_degrees: float = Field(default=18.0, ge=0.0, le=45.0, description="Average terrain slope in degrees")
    access_width_m: float = Field(default=1.4, ge=0.5, le=10.0, description="Narrowest access road width in metres")
    distance_to_facility_m: float = Field(default=45.0, ge=1.0, le=500.0, description="Hose/carry distance from vehicle stop to pit")
    route_length_m: float = Field(default=1200.0, ge=10.0, le=50000.0, description="Total transit route length from depot/disposal site")
    road_surface: RoadSurface = Field(default="gravel", description="Access road surface condition")
    elevation_m: float = Field(default=1850.0, ge=0.0, le=5000.0, description="Site altitude above sea level in metres")

    # Climate
    climate_zone: ClimateZone = Field(default="cold_freezing", description="Prevailing climatic zone")
    temperature_c: float = Field(default=2.0, ge=-30.0, le=55.0, description="Ambient temperature in degrees Celsius")
    rainfall_mm_h: float = Field(default=0.0, ge=0.0, le=150.0, description="Precipitation intensity in mm per hour")

    # Desludging & Containment
    containment_volume_liters: float = Field(default=3000.0, ge=200.0, le=25000.0, description="Total pit/tank containment volume in litres")
    sludge_consistency: SludgeConsistency = Field(default="viscous", description="Qualitative sludge physical state")
    solids_concentration_pct: float = Field(default=14.0, ge=1.0, le=35.0, description="Total solids percentage (w/w)")
    pumping_distance_m: float = Field(default=45.0, ge=2.0, le=300.0, description="Discharge hose line length in metres")
    vertical_suction_lift_m: float = Field(default=3.5, ge=0.5, le=12.0, description="Suction depth from fluid surface to pump intake")
    
    # Utilities & Logistics
    water_available_l: float = Field(default=150.0, ge=0.0, le=2000.0, description="Available water on-site for priming/slurrying in litres")
    power_available: bool = Field(default=False, description="Is single/3-phase grid electricity available on site")
    budget_usd: float = Field(default=300.0, ge=20.0, le=5000.0, description="Allocated budget for single desludging service in USD")
    desired_duration_h: float = Field(default=4.0, ge=0.5, le=16.0, description="Target operational window in hours")

    @field_validator("vertical_suction_lift_m")
    @classmethod
    def validate_suction_lift(cls, v: float) -> float:
        if v > 10.33:
            raise ValueError("Vertical suction lift exceeds physical atmospheric pressure barometric limit (10.33 m at sea level)")
        return v

    @field_validator("slope_degrees")
    @classmethod
    def validate_slope(cls, v: float) -> float:
        if v > 45.0:
            raise ValueError("Slopes steeper than 45° are unstable cliff terrain and cannot be traversed safely")
        return v
