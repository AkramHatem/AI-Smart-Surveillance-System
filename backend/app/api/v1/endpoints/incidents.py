from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional

from app.db.session import get_db
from app.models.models import Incident, Video, IncidentType, AlertStatus
from app.schemas.schemas import IncidentOut, IncidentListResponse

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("", response_model=IncidentListResponse)
async def list_incidents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    alert_status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    filters = [Incident.detected == True]

    if type:
        try:
            filters.append(Incident.incident_type == IncidentType(type))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid incident type: {type}")

    if alert_status:
        try:
            filters.append(Incident.alert_status == AlertStatus(alert_status))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid alert status: {alert_status}")

    # Count
    count_result = await db.execute(
        select(func.count()).select_from(Incident).where(and_(*filters))
    )
    total = count_result.scalar() or 0

    # Fetch page
    result = await db.execute(
        select(Incident, Video.original_name)
        .join(Video, Incident.video_id == Video.id)
        .where(and_(*filters))
        .order_by(Incident.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    rows = result.all()

    incidents_out = []
    for incident, video_name in rows:
        incidents_out.append(
            IncidentOut(
                id=incident.id,
                job_id=incident.job_id,
                video_id=incident.video_id,
                model_name=incident.model_name,
                incident_type=incident.incident_type.value,
                detected=incident.detected,
                confidence=incident.confidence,
                detection_timestamps=incident.detection_timestamps or [],
                frame_screenshot_url=incident.frame_screenshot_url,
                report_url=incident.report_url,
                incident_summary=incident.incident_summary,
                alert_status=incident.alert_status.value,
                video_name=video_name,
                created_at=incident.created_at.isoformat(),
            )
        )

    return IncidentListResponse(total=total, page=page, limit=limit, incidents=incidents_out)


@router.get("/{incident_id}", response_model=IncidentOut)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Incident, Video.original_name)
        .join(Video, Incident.video_id == Video.id)
        .where(Incident.id == incident_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident, video_name = row
    return IncidentOut(
        id=incident.id,
        job_id=incident.job_id,
        video_id=incident.video_id,
        model_name=incident.model_name,
        incident_type=incident.incident_type.value,
        detected=incident.detected,
        confidence=incident.confidence,
        detection_timestamps=incident.detection_timestamps or [],
        frame_screenshot_url=incident.frame_screenshot_url,
        report_url=incident.report_url,
        incident_summary=incident.incident_summary,
        alert_status=incident.alert_status.value,
        video_name=video_name,
        created_at=incident.created_at.isoformat(),
    )
