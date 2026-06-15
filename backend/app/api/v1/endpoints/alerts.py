from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.models import AlertLog, AlertStatus
from app.schemas.schemas import AlertStatusUpdate

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/{alert_id}/status")
async def update_alert_status(
    alert_id: str,
    payload: AlertStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Called by n8n at the end of its workflow to confirm delivery status.
    """
    alert = await db.get(AlertLog, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert log not found")

    try:
        alert.status = AlertStatus(payload.status.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    if payload.n8n_execution_id:
        alert.n8n_execution_id = payload.n8n_execution_id

    if payload.status.upper() == "SENT":
        alert.sent_at = datetime.now(timezone.utc)

    await db.flush()
    return {"ok": True, "alert_id": alert_id, "status": alert.status.value}
