 # 🚨 AI Smart Surveillance System

<p align="center">
  <b>AI-powered real-time surveillance system for detecting fire, smoke, accidents, and violence using Computer Vision and intelligent automation.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-blue">
  <img src="https://img.shields.io/badge/FastAPI-Backend-green">
  <img src="https://img.shields.io/badge/Next.js-Frontend-black">
  <img src="https://img.shields.io/badge/YOLOv8-Computer Vision-red">
  <img src="https://img.shields.io/badge/Celery-Async Tasks-orange">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue">
  <img src="https://img.shields.io/badge/MinIO-Object Storage-yellow">
  <img src="https://img.shields.io/badge/n8n-Alert Automation-purple">
</p>

---

## 📌 Overview

AI Smart Surveillance System is an intelligent video analytics platform designed to automatically detect critical incidents from surveillance footage.

The system analyzes uploaded videos using multiple specialized AI models and identifies dangerous events such as:

- 🔥 Fire & Smoke
- 🚗 Traffic Accidents
- 🥊 Violence & Fighting

Once an incident is detected, the system automatically:

- Generates incident records
- Saves detection evidence (frames/screenshots)
- Creates detailed reports
- Updates the dashboard in real time using WebSockets
- Triggers automated emergency alerts through n8n workflows

The platform follows a scalable asynchronous architecture where heavy AI processing runs in the background using Celery workers, while the FastAPI backend provides APIs and real-time communication with the frontend.

---

# ✨ Main Features

## 🧠 AI-Powered Incident Detection

- Multiple YOLO-based detection models
- Independent models for each incident type
- Confidence-based detection filtering
- Timestamp extraction for detected events
- Automatic frame capture as evidence


## ⚡ Real-Time Processing Pipeline

- Video upload and processing management
- Background AI inference using Celery
- Real-time progress updates via WebSockets
- Asynchronous task execution


## 📊 Interactive Dashboard

- View all detected incidents
- Inspect incident details
- Track confidence scores
- Review detection timestamps
- Access generated evidence and reports


## 🚨 Automated Emergency Alerting

- Automatic alert generation after incident detection
- Integration with n8n workflows
- Email notification automation
- Incident information and evidence attachment


## 💾 Storage & Data Management

- PostgreSQL for structured data
- MinIO for video, image, and report storage
- Database migrations using Alembic
- Organized incident history tracking

---
# 🏗️ System Architecture

The system follows a scalable asynchronous microservices-inspired architecture where AI processing is separated from user interactions.

                                    ┌─────────────────────┐
                                    │   Next.js Frontend  │
                                    │  Dashboard & Upload │
                                    └─────────┬───────────┘
                                    REST API / WebSocket
                                                │ 
                                                ▼
                                    ┌───────────────────┐
                                    │ FastAPI Backend   │
                                    │ API Gateway       │
                                    └─────────┬─────────┘
                                                │
                                    Creates AI Tasks
                                                ▼
                                    ┌───────────────────┐
                                    │ Celery Workers    │
                                    │ AI Processing     │
                                    └─────────┬─────────┘
                                                │
                                ┌───────────────┼────────────────┐
                            
                                ▼               ▼                ▼
                                ┌─────────┐ ┌─────────┐ ┌─────────┐
                                │ Fire AI │ │Accident │ │Violence │
                                │ Model   │ │ Model   │ │ Model   │
                                └─────────┘ └─────────┘ └─────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ PostgreSQL Database │
                                    │ Incident Metadata   │
                                    └─────────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ MinIO Object Storage│
                                    │ Videos & Frames     │
                                    └─────────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ n8n                 │
                                    │ Email Alert System  │
                                    └─────────────────────┘


---

# 🔄 End-to-End Workflow

1. User uploads a surveillance video through the web interface.

2. FastAPI receives the upload and stores the video in MinIO.

3. A Celery background task is created to process the video.

4. AI models analyze the video independently:
   - Fire & Smoke Detection
   - Traffic Accident Detection
   - Violence Detection

5. The system extracts:
   - Incident type
   - Confidence score
   - Detection timestamps
   - Evidence frames

6. Detection results are saved in PostgreSQL.

7. WebSocket channels update the frontend with real-time processing status.

8. If an incident is detected:
   - An alert payload is generated
   - n8n workflow is triggered
   - Emergency email notification is sent

---

# 📂 Project Structure

```text
AI-Smart-Surveillance-System/
│
├── backend/          # FastAPI backend services
│
├── frontend/         # Next.js dashboard and UI
│
├── ai-models/        # AI models and training notebooks
│
├── RUN_GUIDE.md      # Quick project execution guide
│
├── SETUP_GUIDE.md    # Full local environment setup
│
└── README.md
```

----

# 🚀 Installation & Local Setup

## 1. Clone the Repository

```bash
git clone https://github.com/AkramHatem/AI-Smart-Surveillance-System.git

cd AI-Smart-Surveillance-System
```

---

## 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv

# Windows
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure environment variables:

```bash
cp .env.example .env
```

Run database migrations:

```bash
alembic upgrade head
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

---

## 3. Celery Worker

Start Redis, then run:

```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

---

## 4. Frontend Setup

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.local.example .env.local
```

Start development server:

```bash
npm run dev
```

---

# 🔧 Environment Variables

The project requires environment configuration files:

Backend:

```text
backend/.env
```

Example variables:

```env
DATABASE_URL=
REDIS_URL=
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
N8N_WEBHOOK_URL=
```

Frontend:

```text
frontend/.env.local
```

Example variables:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
```

---

# 📡 API Overview

Main backend endpoints:

| Endpoint | Description |
|---|---|
| `/videos` | Upload surveillance videos |
| `/detections` | Start AI detection tasks |
| `/incidents` | Retrieve detected incidents |
| `/dashboard` | Get system statistics |
| `/alerts` | View alert history |

---

# 📸 System Screenshots

Screenshots will be added here.

Example:

```
assets/
├── dashboard.png
├── upload.png
├── results.png
├── incident-details.png
└── alert-email.png
```

---

# 🔮 Future Improvements

Planned improvements:

- Live CCTV stream processing
- Multi-camera management
- User authentication and role management
- Real-time push notifications
- Advanced analytics dashboard
- Cloud deployment using Docker and Kubernetes
- Model performance monitoring

---

# 👤 Author

**Akram Hatem**

AI Engineer | Machine Learning | Computer Vision | Backend Development

GitHub:
https://github.com/AkramHatem

---

# 👥 Team & Contributors

This project was developed in collaboration with an amazing team:

* **Hosam Eldosily** - AI / Computer Vision Engineer • * https://github.com/hosamelbosily
* **Farag Mouse** - AI / Computer Vision Engineer • https://github.com/Farag-Moussa
* **Zeyad Sayed** - AI / Computer Vision Engineer • https://github.com/ZeyadABOELAZM22

Thank you to everyone who contributed to bringing SurveillanceAI to life!

---

# ⭐ Contribution

Contributions, issues, and feature requests are welcome.

If you find this project useful, consider giving it a star ⭐ on GitHub.

---

# 📄 License

This project is licensed under the MIT License.
