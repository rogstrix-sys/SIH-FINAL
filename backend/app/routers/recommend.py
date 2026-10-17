from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..models.site import SiteConditions
from ..services.recommendation import evaluate_and_rank_catalog, EquipmentRecommendation, EvaluationWeights
from ..services.safety import evaluate_safety_and_environment, SafetyAssessmentResult
from ..services.ai_advisor import generate_ai_engineering_narrative
from .equipment import EQUIPMENT_STORE

router = APIRouter(prefix="/api/recommend", tags=["recommend"])

class RecommendationRequest(BaseModel):
    site: SiteConditions
    weights: Optional[EvaluationWeights] = None

class FullRecommendationResponse(BaseModel):
    site: SiteConditions
    recommendations: List[EquipmentRecommendation]
    safety_assessment: SafetyAssessmentResult
    ai_narrative: Dict[str, Any]

@router.post("", response_model=FullRecommendationResponse)
def get_recommendations(payload: RecommendationRequest):
    """
    Evaluates site conditions, applies hard feasibility gate constraints,
    scores feasible models with multi-criteria weights, evaluates safety & gas hazards,
    and returns deterministic AI decision support recommendations.
    """
    recs = evaluate_and_rank_catalog(
        site=payload.site,
        catalog=EQUIPMENT_STORE,
        weights=payload.weights
    )

    # Use top feasible equipment (or first catalog item) for safety assessment baseline
    top_equipment = recs[0].equipment if recs else EQUIPMENT_STORE[0]
    safety = evaluate_safety_and_environment(payload.site, top_equipment)
    narrative = generate_ai_engineering_narrative(payload.site, recs)

    return FullRecommendationResponse(
        site=payload.site,
        recommendations=recs,
        safety_assessment=safety,
        ai_narrative=narrative
    )
