from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from datetime import datetime, timezone, timedelta

from app.db.session import get_db
from app.models.models import Incident, AlertLog, Video, IncidentType, AlertStatus
from app.schemas.schemas import DashboardStatsResponse, TimeSeriesPoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Total videos processed
    video_count = await db.execute(select(func.count()).select_from(Video))
    total_videos = video_count.scalar() or 0

    # Incidents by type
    type_counts = await db.execute(
        select(Incident.incident_type, func.count())
        .where(Incident.detected == True)
        .group_by(Incident.incident_type)
    )
    counts = {row[0]: row[1] for row in type_counts.all()}

    fire_count = counts.get(IncidentType.FIRE, 0) + counts.get(IncidentType.SMOKE, 0)
    accident_count = counts.get(IncidentType.ACCIDENT, 0)
    violence_count = counts.get(IncidentType.VIOLENCE, 0)

    # Alerts sent
    alert_count = await db.execute(
        select(func.count()).select_from(AlertLog).where(AlertLog.status == AlertStatus.sent)
    )
    total_alerts = alert_count.scalar() or 0

    # Time series — last 14 days
    since = datetime.now(timezone.utc) - timedelta(days=14)
    ts_result = await db.execute(
        select(
            func.date(Incident.created_at).label("date"),
            Incident.incident_type,
            func.count().label("count"),
        )
        .where(Incident.detected == True, Incident.created_at >= since)
        .group_by(func.date(Incident.created_at), Incident.incident_type)
        .order_by(func.date(Incident.created_at))
    )
    ts_rows = ts_result.all()

    # Build date-keyed dict
    date_map: dict[str, dict] = {}
    for row in ts_rows:
        d = str(row.date)
        if d not in date_map:
            date_map[d] = {"date": d, "fire": 0, "accident": 0, "violence": 0}
        if row.incident_type in (IncidentType.FIRE, IncidentType.SMOKE):
            date_map[d]["fire"] += row.count
        elif row.incident_type == IncidentType.ACCIDENT:
            date_map[d]["accident"] += row.count
        elif row.incident_type == IncidentType.VIOLENCE:
            date_map[d]["violence"] += row.count

    time_series = [TimeSeriesPoint(**v) for v in sorted(date_map.values(), key=lambda x: x["date"])]

    return DashboardStatsResponse(
        total_videos_processed=total_videos,
        total_fire_incidents=fire_count,
        total_accidents=accident_count,
        total_violence_incidents=violence_count,
        total_alerts_sent=total_alerts,
        incidents_over_time=time_series,
    )
