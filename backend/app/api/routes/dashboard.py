from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_admin_user
from app.services.dashboard_service import get_dashboard_stats as load_dashboard_stats

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard/stats")
def get_dashboard_stats(current_user=Depends(get_current_admin_user)):
    return load_dashboard_stats()
