# Surveillance System - Run Guide

## Project Location

Backend:
\project root directory\backend

Frontend:
\project root directory\frontend

MinIO:
C:\minio\minio.exe

MinIO Storage:
C:\minio-data

---

# Required Services

1. PostgreSQL
2. Redis
3. MinIO
4. FastAPI Backend
5. Celery Worker
6. Next.js Frontend

Required Terminals: 5

---

# Terminal 1 - Redis

redis-server

Expected:

Ready to accept connections

Default Port:

6379

---

# Terminal 2 - MinIO

cd \path\to\minio

minio.exe server \path\to\minio-data --console-address ":9001"

URLs:

API:
http://localhost:9000

Console:
http://localhost:9001

MinIO Credentials:

MINIO_ROOT_USER=YOUR_USER
MINIO_ROOT_PASSWORD=YOUR_PASSWORD

---

# Terminal 3 - FastAPI Backend

cd \project root directory\backend

venv\Scripts\activate

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

API:

http://localhost:8000

Swagger:

http://localhost:8000/docs

---

# Terminal 4 - Celery Worker

cd \project root directory\backend

venv\Scripts\activate

celery -A app.tasks.celery_app worker -Q detection -l info -P solo

Responsible For:

* Fire & Smoke Detection
* Accident Detection
* Violence Detection

---

# Terminal 5 - Frontend

cd \project root directory\frontend

npm run dev

Frontend:

http://localhost:3000

---

# PostgreSQL

Database Host:
localhost

Port:
5432

Database Name:
YOUR_DB_NAME

Username:
YOUR_DB_USER

Password:
YOUR_DB_PASSWORD

---

# Redis

Host:
localhost

Port:
6379

---

# Important URLs

Frontend:
http://localhost:3000

Backend:
http://localhost:8000

Swagger:
http://localhost:8000/docs

MinIO API:
http://localhost:9000

MinIO Console:
http://localhost:9001

---

# Daily Startup Order

1. PostgreSQL
2. Redis
3. MinIO
4. Backend
5. Celery
6. Frontend

Then open:

http://localhost:3000

Ready to test.
