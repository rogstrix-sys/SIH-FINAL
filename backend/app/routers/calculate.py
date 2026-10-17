from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from ..models.site import SiteConditions
from ..models.equipment import EquipmentProfile
from ..services.calculations import perform_engineering_calculations
from .equipment import EQUIPMENT_STORE

router = APIRouter(prefix="/api/calculate", tags=["calculate"])

class CalculationRequest(BaseModel):
    site: SiteConditions
    equipment_id: str

class BatchCalculationRequest(BaseModel):
    site: SiteConditions
    equipment_ids: Optional[List[str]] = None

@router.post("", response_model=Dict[str, Any])
def calculate_single(payload: CalculationRequest):
    """Executes engineering calculations for a specific equipment profile and site scenario."""
    matched_eq = next((eq for eq in EQUIPMENT_STORE if eq.id == payload.equipment_id), None)
    if not matched_eq:
        raise HTTPException(status_code=404, detail=f"Equipment {payload.equipment_id} not found")
    
    return perform_engineering_calculations(matched_eq, payload.site)

@router.post("/batch", response_model=List[Dict[str, Any]])
def calculate_batch(payload: BatchCalculationRequest):
    """Executes engineering calculations across multiple equipment configurations for comparison."""
    target_ids = payload.equipment_ids or [eq.id for eq in EQUIPMENT_STORE]
    results = []
    for eq in EQUIPMENT_STORE:
        if eq.id in target_ids:
            results.append(perform_engineering_calculations(eq, payload.site))
    return results
