from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Video ─────────────────────────────────────────────────────────────────────

class VideoUploadResponse(BaseModel):
    video_id: str
    filename: str
    size_bytes: int
    upload_url: str
    status: str
    created_at: str


# ── Detection ─────────────────────────────────────────────────────────────────

class DetectionRequest(BaseModel):
    video_id: str
    models: list[str] = Field(default=["fire_smoke", "accident", "violence"])
    confidence_threshold: float = Field(default=0.75, ge=0.1, le=1.0)


class DetectionJobResponse(BaseModel):
    job_id: str
    video_id: str
    models_requested: list[str]
    status: str
    estimated_duration_seconds: int


class ModelResult(BaseModel):
    model: str
    incident_type: str
    detected: bool
    confidence: float
    detection_timestamps: list[str]
    frame_screenshot_url: Optional[str] = None
    alert_sent: bool
    alert_id: Optional[str] = None
    incident_id: str | None = None


class DetectionResultsResponse(BaseModel):
    job_id: str
    video_id: str
    video_name: str
    processing_time_seconds: float
    results: list[ModelResult]


# ── Incidents ─────────────────────────────────────────────────────────────────

class IncidentOut(BaseModel):
    id: str
    job_id: str
    video_id: str
    model_name: str
    incident_type: str
    detected: bool
    confidence: float
    detection_timestamps: list[str]
    frame_screenshot_url: Optional[str] = None
    report_url: Optional[str] = None
    incident_summary: Optional[str] = None
    alert_status: str
    video_name: str
    created_at: str

    class Config:
        from_attributes = True


class IncidentListResponse(BaseModel):
    total: int
    page: int
    limit: int
    incidents: list[IncidentOut]


# ── Dashboard ─────────────────────────────────────────────────────────────────

class TimeSeriesPoint(BaseModel):
    date: str
    fire: int
    accident: int
    violence: int


class DashboardStatsResponse(BaseModel):
    total_videos_processed: int
    total_fire_incidents: int
    total_accidents: int
    total_violence_incidents: int
    total_alerts_sent: int
    incidents_over_time: list[TimeSeriesPoint]


# ── Alerts ────────────────────────────────────────────────────────────────────

class AlertPayload(BaseModel):
    alert_id: str
    incident_type: str
    confidence: float
    detection_timestamp: str
    video_name: str
    incident_summary: str
    report_url: Optional[str] = None
    frame_url: Optional[str] = None


class AlertStatusUpdate(BaseModel):
    status: str
    n8n_execution_id: Optional[str] = None
