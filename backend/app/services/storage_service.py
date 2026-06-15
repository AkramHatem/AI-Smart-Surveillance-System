import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
import uuid
import os
from app.core.config import get_settings

settings = get_settings()

# Build the S3-compatible client pointing at MinIO
s3 = boto3.client(
    "s3",
    endpoint_url=f"{'https' if settings.minio_secure else 'http'}://{settings.minio_endpoint}",
    aws_access_key_id=settings.minio_access_key,
    aws_secret_access_key=settings.minio_secret_key,
    config=Config(signature_version="s3v4"),
    region_name="us-east-1",
)

BUCKET = settings.minio_bucket


def ensure_bucket():
    """Create the bucket if it doesn't exist. Call once on startup."""
    try:
        s3.head_bucket(Bucket=BUCKET)
    except ClientError:
        s3.create_bucket(Bucket=BUCKET)
        # Make bucket publicly readable for presigned URL access
        s3.put_bucket_policy(
            Bucket=BUCKET,
            Policy=f'{{"Version":"2012-10-17","Statement":[{{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::{BUCKET}/*"}}]}}',
        )


def upload_video(file_bytes: bytes, original_filename: str) -> tuple[str, str]:
    """
    Upload raw video bytes to MinIO.
    Returns (object_key, public_url).
    """
    ext = os.path.splitext(original_filename)[1] or ".mp4"
    key = f"videos/{uuid.uuid4()}{ext}"
    s3.put_object(Bucket=BUCKET, Key=key, Body=file_bytes, ContentType="video/mp4")
    url = f"{'https' if settings.minio_secure else 'http'}://{settings.minio_endpoint}/{BUCKET}/{key}"
    return key, url


def upload_frame(image_bytes: bytes, job_id: str, model: str) -> str:
    """Upload a detection screenshot frame. Returns public URL."""
    key = f"frames/{job_id}_{model}.jpg"
    s3.put_object(Bucket=BUCKET, Key=key, Body=image_bytes, ContentType="image/jpeg")
    return f"{'https' if settings.minio_secure else 'http'}://{settings.minio_endpoint}/{BUCKET}/{key}"


def get_video_bytes(storage_url: str) -> bytes:
    """Download a video from MinIO by its full URL. Returns raw bytes."""
    # Extract the key from the URL
    prefix = f"{'https' if settings.minio_secure else 'http'}://{settings.minio_endpoint}/{BUCKET}/"
    key = storage_url.replace(prefix, "")
    response = s3.get_object(Bucket=BUCKET, Key=key)
    return response["Body"].read()
