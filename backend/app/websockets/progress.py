import asyncio
import json
import logging
from fastapi import WebSocket
from celery.result import AsyncResult
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


async def stream_job_progress(websocket: WebSocket, job_id: str, celery_task_id: str):
    """
    Poll Celery task state and push progress updates over WebSocket.
    Closes the connection when the task finishes or fails.
    """
    await websocket.accept()

    try:
        while True:
            result = AsyncResult(celery_task_id, app=celery_app)
            state = result.state

            if state == "PENDING":
                msg = {"job_id": job_id, "progress": 0, "current_model": None, "status": "QUEUED"}

            elif state == "STARTED":
                msg = {"job_id": job_id, "progress": 5, "current_model": None, "status": "PROCESSING"}

            elif state == "PROGRESS":
                meta = result.info or {}
                msg = {
                    "job_id": job_id,
                    "progress": meta.get("progress", 0),
                    "current_model": meta.get("current_model"),
                    "status": "PROCESSING",
                }

            elif state == "SUCCESS":
                msg = {"job_id": job_id, "progress": 100, "current_model": None, "status": "COMPLETED"}
                await websocket.send_text(json.dumps(msg))
                break

            elif state == "FAILURE":
                msg = {
                    "job_id": job_id,
                    "progress": 0,
                    "current_model": None,
                    "status": "FAILED",
                    "error": str(result.info),
                }
                await websocket.send_text(json.dumps(msg))
                break

            else:
                msg = {"job_id": job_id, "progress": 0, "current_model": None, "status": state}

            await websocket.send_text(json.dumps(msg))
            await asyncio.sleep(1.5)

    except Exception as e:
        logger.warning(f"WebSocket closed for job {job_id}: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
