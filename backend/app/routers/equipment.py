from fastapi import APIRouter, HTTPException
from typing import List
from ..models.equipment import EquipmentProfile, DEFAULT_EQUIPMENT_CATALOG

router = APIRouter(prefix="/api/equipment", tags=["equipment"])

# In-memory working catalog (initialized from default, editable by user)
EQUIPMENT_STORE: List[EquipmentProfile] = [eq.model_copy(deep=True) for eq in DEFAULT_EQUIPMENT_CATALOG]

@router.get("", response_model=List[EquipmentProfile])
def list_equipment():
    """Returns list of all registered desludging equipment profiles with engineering specs."""
    return EQUIPMENT_STORE

@router.get("/{equipment_id}", response_model=EquipmentProfile)
def get_equipment(equipment_id: str):
    """Fetches single equipment profile by ID."""
    for eq in EQUIPMENT_STORE:
        if eq.id == equipment_id:
            return eq
    raise HTTPException(status_code=404, detail=f"Equipment with ID {equipment_id} not found")

@router.put("/{equipment_id}", response_model=EquipmentProfile)
def update_equipment(equipment_id: str, updated_profile: EquipmentProfile):
    """Allows user to edit and calibrate equipment specifications and operational assumptions."""
    for idx, eq in enumerate(EQUIPMENT_STORE):
        if eq.id == equipment_id:
            EQUIPMENT_STORE[idx] = updated_profile
            return updated_profile
    raise HTTPException(status_code=404, detail=f"Equipment with ID {equipment_id} not found")

@router.post("/reset", response_model=List[EquipmentProfile])
def reset_equipment_catalog():
    """Resets equipment catalog back to verified baseline default specifications."""
    global EQUIPMENT_STORE
    EQUIPMENT_STORE = [eq.model_copy(deep=True) for eq in DEFAULT_EQUIPMENT_CATALOG]
    return EQUIPMENT_STORE
