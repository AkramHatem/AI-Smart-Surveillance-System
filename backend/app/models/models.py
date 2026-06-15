import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    String, Float, Boolean, Integer, Text,
    DateTime, Enum as SAEnum, ARRAY, JSON, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
import enum


def utcnow():
    return datetime.now(timezone.utc)


# ── Enums ─────────────────────────────────────────────────────────────────────

class VideoStatus(str, enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    done = "done"
    failed = "failed"


class JobStatus(str, enum.Enum):
    queued = "QUEUED"
    processing = "PROCESSING"
    completed = "COMPLETED"
    failed = "FAILED"


class IncidentType(str, enum.Enum):
    FIRE = "FIRE"
    SMOKE = "SMOKE"
    ACCIDENT = "ACCIDENT"
    VIOLENCE = "VIOLENCE"
    NONE = "NONE"


class AlertStatus(str, enum.Enum):
    pending = "PENDING"
    sent = "SENT"
    failed = "FAILED"
    retrying = "RETRYING"
    skipped = "SKIPPED"


# ── Models ────────────────────────────────────────────────────────────────────

class Video(Base):
    __tablename__ = "videos"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    storage_url: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[VideoStatus] = mapped_column(
        SAEnum(VideoStatus), default=VideoStatus.uploaded
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    jobs: Mapped[list["ProcessingJob"]] = relationship(back_populates="video")


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    video_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("videos.id"), nullable=False
    )
    models_requested: Mapped[list] = mapped_column(ARRAY(String), nullable=False)
    confidence_threshold: Mapped[float] = mapped_column(Float, default=0.75)
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus), default=JobStatus.queued
    )
    celery_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    video: Mapped["Video"] = relationship(back_populates="jobs")
    incidents: Mapped[list["Incident"]] = relationship(back_populates="job")


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    job_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("processing_jobs.id"), nullable=False
    )
    video_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("videos.id"), nullable=False
    )
    model_name: Mapped[str] = mapped_column(String(50), nullable=False)
    incident_type: Mapped[IncidentType] = mapped_column(
        SAEnum(IncidentType), default=IncidentType.NONE
    )
    detected: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    detection_timestamps: Mapped[list] = mapped_column(JSON, default=list)
    frame_screenshot_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    report_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    incident_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    alert_status: Mapped[AlertStatus] = mapped_column(
        SAEnum(AlertStatus), default=AlertStatus.skipped
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    job: Mapped["ProcessingJob"] = relationship(back_populates="incidents")
    alert_logs: Mapped[list["AlertLog"]] = relationship(back_populates="incident")

    # Joined field — populated via join with Video
    video_name: str = ""


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    incident_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("incidents.id"), nullable=False
    )
    incident_type: Mapped[str] = mapped_column(String(50), nullable=False)
    authorities_notified: Mapped[list] = mapped_column(ARRAY(String), default=list)
    n8n_execution_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[AlertStatus] = mapped_column(
        SAEnum(AlertStatus), default=AlertStatus.pending
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    incident: Mapped["Incident"] = relationship(back_populates="alert_logs")
