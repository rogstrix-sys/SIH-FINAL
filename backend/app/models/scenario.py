from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from .site import SiteConditions

class ScenarioCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(default="")
    site_conditions: SiteConditions
    selected_equipment_id: Optional[str] = None
    results_snapshot: Optional[Dict[str, Any]] = None

class ScenarioResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str
    updated_at: str
    site_conditions: SiteConditions
    selected_equipment_id: Optional[str]
    results_snapshot: Optional[Dict[str, Any]]
    is_preset: bool
