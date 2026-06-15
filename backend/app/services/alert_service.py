import httpx
import logging
from datetime import datetime, timezone
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

AUTHORITY_MAP = {
    "FIRE":     ["Fire Department", "Emergency Medical Services"],
    "SMOKE":    ["Fire Department", "Emergency Medical Services"],
    "ACCIDENT": ["Traffic Authority", "Emergency Response Team"],
    "VIOLENCE": ["Law Enforcement", "Security Authority"],
}


async def send_alert_to_n8n(payload: dict) -> tuple[bool, str]:
    """
    POST the detection payload to the n8n webhook.
    Returns (success: bool, error_message: str).
    Retries up to 3 times on failure.
    """
    headers = {
        "Content-Type": "application/json",
        # "X-Webhook-Secret": settings.n8n_webhook_secret,
    }

    for attempt in range(1, 4):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                logger.info(f"Sending alert to: {settings.n8n_webhook_url}")
                logger.info(f"Payload: {payload}")
                response = await client.post(
                    settings.n8n_webhook_url,
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                logger.info(
                    f"Alert sent to n8n — incident={payload.get('incident_type')} "
                    f"attempt={attempt} status={response.status_code}"
                )
                return True, ""

        except httpx.HTTPStatusError as e:
            error = f"HTTP {e.response.status_code}: {e.response.text}"
        except httpx.RequestError as e:
            error = f"Connection error: {str(e)}"

        logger.warning(f"Alert attempt {attempt} failed: {error}")

    logger.error(f"All 3 alert attempts failed for incident {payload.get('incident_type')}")
    return False, error


def build_alert_payload(
    alert_id: str,
    incident_type: str,
    confidence: float,
    video_name: str,
    frame_url: str | None,
    report_url: str | None,
    detection_timestamps: list[str],
    # camera_id: str,
    # camera_name: str,
) -> dict:

    incident_type = incident_type.upper()

    # camera_id = "1"
    # camera_name = "Camera 1"

    return {
        "alert_id": alert_id,
        "camera_id": "1",
        "camera_name": "Camera 1" ,
        "incident_type": incident_type,
        "confidence": round(confidence, 4),
        "confidence_pct": round(confidence * 100, 1),
        "detection_timestamp": datetime.now(timezone.utc).isoformat(),

        "video_name": video_name,

        "incident_summary": (
            f"{incident_type} detected in '{video_name}' "
            f"with {round(confidence * 100)}% confidence"
            + (
                f" at timestamps: {', '.join(detection_timestamps)}"
                if detection_timestamps
                else ""
            )
        ),

        "authorities": AUTHORITY_MAP.get(incident_type.upper(), []),

        "frame_url": frame_url,
        "report_url": report_url,
    }