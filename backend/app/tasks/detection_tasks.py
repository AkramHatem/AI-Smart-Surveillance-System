import logging
import asyncio
import tempfile
import os
import uuid
from datetime import datetime, timezone
from celery import shared_task
from sqlalchemy import create_engine, update
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.models.models import ProcessingJob, Incident, AlertLog, Video, JobStatus, AlertStatus, IncidentType
from app.services.storage_service import get_video_bytes, upload_frame
from app.services.alert_service import send_alert_to_n8n, build_alert_payload
from app.tasks.celery_app import celery_app

settings = get_settings()
logger = logging.getLogger(__name__)

# Sync engine for use inside Celery tasks (Celery doesn't support asyncpg)
sync_engine = create_engine(settings.sync_database_url, pool_pre_ping=True)
SyncSession = sessionmaker(bind=sync_engine)

MODEL_TYPE_MAP = {
    "fire_smoke": ["FIRE", "SMOKE"],
    "accident":   ["ACCIDENT"],
    "violence":   ["VIOLENCE"],
}


def _load_model(model_key: str):
    """Load a YOLO model from the configured path. Returns the model object."""
    from ultralytics import YOLO

    path_map = {
        "fire_smoke": settings.fire_smoke_model_path,
        "accident":   settings.accident_model_path,
        "violence":   settings.violence_model_path,
    }
    path = path_map[model_key]
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model weights not found at: {path}")

    logger.info(f"Loading model: {model_key} from {path}")
    return YOLO(path)

ALLOWED_CLASSES = {
    "fire_smoke": ["fire", "smoke"],
    "accident": ["accident"],           # تجاهل non-accident
    "violence": ["Theft", "violence"],  # تجاهل face و non_violence
}

def _run_inference(model, video_path: str, confidence_threshold: float, model_key: str) -> dict:
    """
    Run YOLO inference on a video file.
    Returns a dict with: detected, confidence, timestamps, best_frame_bytes
    """
    import cv2
    import numpy as np

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    frame_count = 0
    detections = []
    best_frame = None
    best_conf = 0.0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Analyse every 5th frame to save time
        if frame_count % 5 == 0:
            results = model(frame, verbose=False)
            for r in results:
                if len(r.boxes) > 0:
                    for box in r.boxes:

                        cls_id = int(box.cls[0])
                        cls_name = model.names[cls_id]

                        # تجاهل الكلاسات غير المطلوبة
                        if cls_name not in ALLOWED_CLASSES[model_key]:
                            continue

                        conf = float(box.conf[0])

                        if conf < confidence_threshold:
                            continue

                        timestamp_sec = frame_count / fps
                        minutes = int(timestamp_sec // 60)
                        seconds = int(timestamp_sec % 60)
                        ts = f"{minutes:02d}:{seconds:02d}"

                        detections.append((ts, conf, frame))

                        if conf > best_conf:
                            best_conf = conf
                            best_frame = frame

        frame_count += 1

    cap.release()

    # Encode best frame to JPEG bytes
    best_frame_bytes = None
    if best_frame is not None:
        _, buf = cv2.imencode(".jpg", best_frame)
        best_frame_bytes = buf.tobytes()

    timestamps = [d[0] for d in detections]

    return {
        "detected": len(detections) > 0,
        "confidence": best_conf,
        "timestamps": list(dict.fromkeys(timestamps)),  # deduplicate, preserve order
        "best_frame_bytes": best_frame_bytes,
    }


@celery_app.task(bind=True, name="app.tasks.detection_tasks.run_detection")
def run_detection(self, job_id: str):
    """
    Main detection task:
    1. Load job from DB
    2. Download video from MinIO
    3. Run each requested model
    4. Save results to DB
    5. Send alert to n8n for each detected incident
    """
    logger.info(f"Starting detection job: {job_id}")

    with SyncSession() as db:
        # ── Load job ──────────────────────────────────────────────────────────
        job = db.query(ProcessingJob).filter_by(id=job_id).first()
        if not job:
            logger.error(f"Job not found: {job_id}")
            return

        video = db.query(Video).filter_by(id=job.video_id).first()
        if not video:
            logger.error(f"Video not found: {job.video_id}")
            return

        # Mark started
        job.status = JobStatus.processing
        job.started_at = datetime.now(timezone.utc)
        job.celery_task_id = self.request.id
        db.commit()

        # ── Download video to temp file ───────────────────────────────────────
        try:
            video_bytes = get_video_bytes(video.storage_url)
        except Exception as e:
            job.status = JobStatus.failed
            job.error_message = f"Failed to download video: {e}"
            db.commit()
            raise

        # Write to a temp file (OpenCV needs a file path, not bytes)
        suffix = os.path.splitext(video.filename)[1] or ".mp4"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        # ── Run each model ────────────────────────────────────────────────────
        results = []
        try:
            for i, model_key in enumerate(job.models_requested):
                logger.info(f"Running model [{i+1}/{len(job.models_requested)}]: {model_key}")

                # Update Celery task state for WebSocket progress
                progress = int((i / len(job.models_requested)) * 90)
                self.update_state(
                    state="PROGRESS",
                    meta={"progress": progress, "current_model": model_key, "status": "PROCESSING"},
                )

                try:
                    model = _load_model(model_key)
                    inference = _run_inference(model, tmp_path, job.confidence_threshold, model_key)

                    # Upload detection frame if detected
                    frame_url = None
                    if inference["detected"] and inference["best_frame_bytes"]:
                        frame_url = upload_frame(
                            inference["best_frame_bytes"], job_id, model_key
                        )

                    # Determine incident type
                    if inference["detected"]:
                        incident_type_str = MODEL_TYPE_MAP[model_key][0]
                    else:
                        incident_type_str = "NONE"

                    # Save incident to DB
                    incident = Incident(
                        id=str(uuid.uuid4()),
                        job_id=job_id,
                        video_id=job.video_id,
                        model_name=model_key,
                        incident_type=IncidentType(incident_type_str),
                        detected=inference["detected"],
                        confidence=inference["confidence"],
                        detection_timestamps=inference["timestamps"],
                        frame_screenshot_url=frame_url,
                        alert_status=AlertStatus.skipped,
                    )
                    db.add(incident)
                    db.flush()  # get incident.id before commit

                    # ── Send alert if detected above threshold ────────────────
                    alert_sent = False
                    alert_log_id = None
                    if inference["detected"] and inference["confidence"] >= job.confidence_threshold:
                        alert_log_id = str(uuid.uuid4())
                        payload = build_alert_payload(
                            alert_id=alert_log_id,
                            incident_type=incident_type_str,
                            confidence=inference["confidence"],
                            video_name=video.original_name,
                            frame_url=frame_url,
                            report_url=None,
                            detection_timestamps=inference["timestamps"],
                        )

                        alert_log = AlertLog(
                            id=alert_log_id,
                            incident_id=incident.id,
                            incident_type=incident_type_str,
                            payload_json=payload,
                            status=AlertStatus.pending,
                        )
                        db.add(alert_log)
                        db.commit()
                        
                        # Send to n8n (sync wrapper around async)
                        success, error = asyncio.run(send_alert_to_n8n(payload))

                        if success:
                            alert_log.status = AlertStatus.sent
                            alert_log.sent_at = datetime.now(timezone.utc)
                            incident.alert_status = AlertStatus.sent
                            alert_sent = True
                        else:
                            alert_log.status = AlertStatus.failed
                            alert_log.last_error = error
                            incident.alert_status = AlertStatus.failed

                        db.commit()

                    results.append({
                        "model": model_key,
                        "incident_type": incident_type_str,
                        "detected": inference["detected"],
                        "confidence": inference["confidence"],
                        "detection_timestamps": inference["timestamps"],
                        "frame_screenshot_url": frame_url,
                        "alert_sent": alert_sent,
                        "alert_id": alert_log_id,
                    })

                    # Free model from memory immediately
                    del model

                except Exception as model_error:
                    logger.error(f"Model {model_key} failed: {model_error}", exc_info=True)
                    results.append({
                        "model": model_key,
                        "incident_type": "NONE",
                        "detected": False,
                        "confidence": 0.0,
                        "detection_timestamps": [],
                        "frame_screenshot_url": None,
                        "alert_sent": False,
                        "alert_id": None,
                    })

        finally:
            os.unlink(tmp_path)  # always clean up temp file

        # ── Mark job complete ─────────────────────────────────────────────────
        job.status = JobStatus.completed
        job.completed_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(f"Job {job_id} completed. {len(results)} models ran.")
        return {"job_id": job_id, "results": results}
