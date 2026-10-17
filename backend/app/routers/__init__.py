from .equipment import router as equipment_router
from .calculate import router as calculate_router
from .recommend import router as recommend_router
from .scenarios import router as scenarios_router

__all__ = ["equipment_router", "calculate_router", "recommend_router", "scenarios_router"]
