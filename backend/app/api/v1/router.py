from fastapi import APIRouter
from app.api.v1.endpoints import videos, detections, incidents, dashboard, alerts

router = APIRouter(prefix="/v1")

router.include_router(videos.router)
router.include_router(detections.router)
router.include_router(incidents.router)
router.include_router(dashboard.router)
router.include_router(alerts.router)
