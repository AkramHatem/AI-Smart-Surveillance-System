import uuid
from datetime import datetime, timezone
# from backend.app import db
from fastapi import APIRouter, HTTPException, Depends, WebSocket, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload


from app.db.session import get_db
from app.models.models import ProcessingJob, Incident, Video, JobStatus
from app.schemas.schemas import DetectionRequest, DetectionJobResponse, DetectionResultsResponse, ModelResult
from app.tasks.detection_tasks import run_detection
from app.websockets.progress import stream_job_progress

router = APIRouter(prefix="/detections", tags=["detections"])


@router.post("/run", response_model=DetectionJobResponse, status_code=202)
async def trigger_detection(
    payload: DetectionRequest,
    db: AsyncSession = Depends(get_db),
):
    # Verify video exists
    video = await db.get(Video, payload.video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    valid_models = {"fire_smoke", "accident", "violence"}
    models = [m for m in payload.models if m in valid_models]
    if not models:
        raise HTTPException(status_code=400, detail="No valid models specified")

    # Create job record
    job = ProcessingJob(
        id=str(uuid.uuid4()),
        video_id=payload.video_id,
        models_requested=models,
        confidence_threshold=payload.confidence_threshold,
        status=JobStatus.queued,
        created_at=datetime.now(timezone.utc),
    )
    db.add(job)
    await db.flush()

# ---------------------------
    await db.commit()
    await db.refresh(job)
# ---------------------------

    # Queue Celery task
    task = run_detection.apply_async(args=[job.id], queue="detection")
    job.celery_task_id = task.id
    await db.commit()
    await db.refresh(job)

    estimated = len(models) * 30  # rough 30s per model

    return DetectionJobResponse(
        job_id=job.id,
        video_id=payload.video_id,
        models_requested=models,
        status="queued",
        estimated_duration_seconds=estimated,
    )


@router.get("/{job_id}/results", response_model=DetectionResultsResponse)
async def get_results(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(ProcessingJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status not in (JobStatus.completed, JobStatus.failed):
        raise HTTPException(status_code=202, detail="Job not finished yet")

    video = await db.get(Video, job.video_id)

    # Load incidents
    result = await db.execute(
        select(Incident)
        .options(selectinload(Incident.alert_logs))
        .where(Incident.job_id == job_id)
    )
    incidents = result.scalars().all()

    processing_time = 0.0
    if job.started_at and job.completed_at:
        processing_time = (job.completed_at - job.started_at).total_seconds()

    model_results = []
    for inc in incidents:
        # Find alert log if any
        alert_log = inc.alert_logs[0] if inc.alert_logs else None
        model_results.append(
            ModelResult(
                incident_id=str(inc.id),
                model=inc.model_name,
                incident_type=inc.incident_type.value,
                detected=inc.detected,
                confidence=inc.confidence,
                detection_timestamps=inc.detection_timestamps or [],
                frame_screenshot_url=inc.frame_screenshot_url,
                alert_sent=inc.alert_status.value == "SENT",
                alert_id=alert_log.id if alert_log else None,
            )
        )

    return DetectionResultsResponse(
        job_id=job_id,
        video_id=job.video_id,
        video_name=video.original_name if video else "Unknown",
        processing_time_seconds=processing_time,
        results=model_results,
    )


@router.websocket("/ws/jobs/{job_id}")
async def websocket_progress(
    websocket: WebSocket,
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    job = await db.get(ProcessingJob, job_id)
    if not job or not job.celery_task_id:
        await websocket.close(code=1008)
        return

    await stream_job_progress(websocket, job_id, job.celery_task_id)
