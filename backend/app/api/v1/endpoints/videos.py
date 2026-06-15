import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.models import Video, VideoStatus
from app.services.storage_service import upload_video
from app.schemas.schemas import VideoUploadResponse

router = APIRouter(prefix="/videos", tags=["videos"])

ALLOWED_TYPES = {"video/mp4", "video/x-msvideo", "video/quicktime", "video/x-matroska"}
MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024  # 2 GB


@router.post("/upload", response_model=VideoUploadResponse, status_code=202)
async def upload_video_endpoint(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: mp4, avi, mov, mkv",
        )

    # Read file into memory
    file_bytes = await file.read()

    if len(file_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 2 GB limit")

    # Upload to MinIO
    try:
        _, storage_url = upload_video(file_bytes, file.filename or "video.mp4")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    # Save to DB
    video = Video(
        id=str(uuid.uuid4()),
        filename=f"{uuid.uuid4()}.mp4",
        original_name=file.filename or "video.mp4",
        size_bytes=len(file_bytes),
        storage_url=storage_url,
        status=VideoStatus.uploaded,
        uploaded_at=datetime.now(timezone.utc),
    )
    db.add(video)
    await db.flush()

    return VideoUploadResponse(
        video_id=video.id,
        filename=video.filename,
        size_bytes=video.size_bytes,
        upload_url=storage_url,
        status="uploaded",
        created_at=video.uploaded_at.isoformat(),
    )
