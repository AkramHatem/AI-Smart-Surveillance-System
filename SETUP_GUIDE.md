# SurveillanceAI — Complete Windows Setup Guide
## Step-by-step from zero to running system

---

## What You Are Installing

| Service | Purpose | Port |
|---|---|---|
| PostgreSQL 16 | Database | 5432 |
| Redis (Memurai) | Task queue broker | 6379 |
| MinIO | Video file storage | 9000 / 9001 |
| n8n | Alert automation | 5678 |
| Python backend | FastAPI + Celery | 8000 |
| Next.js frontend | Web portal + dashboard | 3000 |

---

## PART 1 — Install Prerequisites

### 1.1 — Python 3.11

> ⚠️ Use Python 3.11 specifically. PyTorch has best Windows support on 3.11.

1. Go to: https://www.python.org/downloads/release/python-3119/
2. Download: **Windows installer (64-bit)**
3. Run installer — **check "Add Python to PATH"** before clicking Install
4. Verify in a new Command Prompt:
   ```
   python --version
   ```
   Should print: `Python 3.11.x`

---

### 1.2 — Node.js 20 LTS

1. Go to: https://nodejs.org/en/download
2. Download: **Windows Installer (.msi) — LTS version**
3. Run installer with all defaults
4. Verify:
   ```
   node --version
   npm --version
   ```

---

### 1.3 — Git

1. Go to: https://git-scm.com/download/win
2. Download and run the installer with all defaults
3. Verify:
   ```
   git --version
   ```

---

### 1.4 — PostgreSQL 16

1. Go to: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Download PostgreSQL 16 for Windows x86-64
3. Run the installer:
   - Installation Directory: leave as default
   - Components: check PostgreSQL Server, pgAdmin 4, Command Line Tools
   - Data Directory: leave as default
   - **Password: set to `password`** (or anything — you'll put it in .env)
   - Port: 5432
   - Locale: leave as default
4. Finish — PostgreSQL is now a Windows Service, starts automatically

5. Open **pgAdmin 4** (installed with PostgreSQL)
6. Connect to your server (password you just set)
7. Right-click **Databases → Create → Database**
   - Name: `surveillance`
   - Owner: `postgres`
   - Save

   **OR** use SQL Shell (psql):
   ```sql
   CREATE DATABASE surveillance;
   ```

---

### 1.5 — Redis (Memurai)

> Memurai is a native Windows Redis-compatible server.

1. Go to: https://www.memurai.com/get-memurai
2. Download the free Developer Edition
3. Run the installer with all defaults
4. Memurai installs as a Windows Service and starts automatically
5. Verify:
   ```
   redis-cli ping
   ```
   Should print: `PONG`

---

### 1.6 — MinIO

1. Go to: https://min.io/download#/windows
2. Download **minio.exe** for Windows
3. Move it to `C:\minio\minio.exe`
4. Create storage folder: `C:\minio-data`
5. Open PowerShell and run:
   ```powershell
   $env:MINIO_ROOT_USER="minioadmin"
   $env:MINIO_ROOT_PASSWORD="minioadmin"
   C:\minio\minio.exe server C:\minio-data --console-address ":9001"
   ```
6. Keep this PowerShell window open — MinIO is now running
7. Open browser: http://localhost:9001 — login with minioadmin / minioadmin

> **To make MinIO start automatically:** Create a batch file `C:\minio\start-minio.bat`:
> ```bat
> @echo off
> set MINIO_ROOT_USER=minioadmin
> set MINIO_ROOT_PASSWORD=minioadmin
> C:\minio\minio.exe server C:\minio-data --console-address ":9001"
> ```
> Then add a shortcut to it in your Windows Startup folder
> (Win+R → `shell:startup` → paste the shortcut there)

---

### 1.7 — n8n

Open a new Command Prompt or PowerShell:
```
npm install -g n8n
```

Then run n8n:
```
n8n start
```

Open browser: http://localhost:5678
Complete the setup wizard — create your account.

> **To keep n8n running**, leave this terminal open while working.
> For permanent service, use: `npm install -g pm2` then `pm2 start n8n --name n8n`

---

## PART 2 — Set Up the Project Files

### 2.1 — Create the project folder

```
mkdir C:\surveillance-system
cd C:\surveillance-system
```

### 2.2 — Copy the downloaded files


```
C:\surveillance-system\
    frontend\        ← the entire frontend folder
    backend\         ← the entire backend folder
    ai-models\       ← the ai-models folder
```

### 2.3 — Place your model weights

Copy your trained `.pt` files to:
```
C:\surveillance-system\ai-models\fire-smoke\model\fire_smoke.pt
C:\surveillance-system\ai-models\accident\model\accident.pt
C:\surveillance-system\ai-models\violence\model\violence.pt
```

---

## PART 3 — Configure the Backend

### 3.1 — Edit the .env file

From the project root directory, open:

backend/.env

using your preferred text editor (VS Code, Notepad, etc.).

Change these values:

```env
# Replace 'password' with your actual PostgreSQL password
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/surveillance
SYNC_DATABASE_URL=postgresql://postgres:password@localhost:5432/surveillance

# Replace with your actual model file paths (use forward slashes)
FIRE_SMOKE_MODEL_PATH=C:/surveillance-system/ai-models/fire-smoke/model/fire_smoke.pt
ACCIDENT_MODEL_PATH=C:/surveillance-system/ai-models/accident/model/accident.pt
VIOLENCE_MODEL_PATH=C:/surveillance-system/ai-models/violence/model/violence.pt

# Generate a secret key — open Python and run:
# import secrets; print(secrets.token_hex(32))
SECRET_KEY=paste-your-generated-key-here

# If you want email alerts, set this to your n8n webhook URL (already correct)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/incident-alert
```

### 3.2 — Edit alembic.ini

Open `\project root directory\backend\alembic.ini`

Find this line:
```
sqlalchemy.url = postgresql://postgres:password@localhost:5432/surveillance
```
Replace `password` with your actual PostgreSQL password.

---

## PART 4 — Install Python Packages

Open Command Prompt as Administrator, then:

```cmd

cd \project root directory\backend

python -m venv venv
venv\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt
```

> ⚠️ This step downloads PyTorch (~800 MB) and takes 5–15 minutes.
> Your internet connection needs to stay on.

If you have an **NVIDIA GPU**, install the CUDA version of PyTorch instead for faster inference:
```cmd
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

If you have **no GPU** (CPU only), the default in requirements.txt works fine — just slower.

---

## PART 5 — Run Database Migrations

With your virtual environment still active:

```cmd
cd \project root directory\backend
venv\Scripts\activate

alembic upgrade head
```

You should see output like:
```
INFO  [alembic.runtime.migration] Running upgrade  -> abc123, create tables
```

If you see any error about "database does not exist", make sure you created the `surveillance` database in Step 1.4.

---

## PART 6 — Install Frontend Packages

Open a new Command Prompt (keep the backend one open):

```cmd
cd \project root directory\frontend
npm install
```

Create the environment file:
```cmd
copy .env.local.example .env.local
```

The `.env.local` file already points to `http://localhost:8000` — no changes needed.

---

## PART 7 — Start Everything

You need **4 terminals** running simultaneously.
Open 4 Command Prompt windows.

### Terminal 1 — FastAPI Backend

```cmd
cd \project root directory\backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify: open http://localhost:8000/docs — you should see the Swagger API docs.

---

### Terminal 2 — Celery Worker

```cmd
cd \project root directory\backend
venv\Scripts\activate
celery -A app.tasks.celery_app worker --loglevel=info -Q detection --pool=solo
```

> ⚠️ The `--pool=solo` flag is REQUIRED on Windows. Without it, Celery crashes.

---

### Terminal 3 — MinIO (if not already running)

```powershell
$env:MINIO_ROOT_USER="minioadmin"
$env:MINIO_ROOT_PASSWORD="minioadmin"
C:\minio\minio.exe server C:\minio-data --console-address ":9001"
```

---

### Terminal 4 — Next.js Frontend

```cmd
cd \project root directory\frontend
npm run dev
```

Verify: open http://localhost:3000

---

## PART 8 — Verify Everything Works

Open each URL and confirm:

| URL | What you should see |
|---|---|
| http://localhost:3000 | Upload portal — dark themed, drag & drop zone |
| http://localhost:8000/docs | Swagger API documentation |
| http://localhost:9001 | MinIO console (login: minioadmin / minioadmin) |
| http://localhost:5678 | n8n dashboard |
| http://localhost:6379 | Redis (no browser UI — verify via `redis-cli ping`) |

---

## PART 9 — Configure n8n Alert Workflow

1. Open http://localhost:5678
2. Click **New Workflow**
3. Add a **Webhook** node:
   - HTTP Method: POST
   - Path: `incident-alert`
   - Click "Copy Webhook URL" — it will look like: `http://localhost:5678/webhook/incident-alert`
4. Add a **Switch** node connected to the Webhook:
   - Rule 1: `{{ $json.body.incident_type }}` equals `FIRE`
   - Rule 2: `{{ $json.body.incident_type }}` equals `ACCIDENT`
   - Rule 3: `{{ $json.body.incident_type }}` equals `VIOLENCE`
5. For each route, add an **Email** node (or any notification you want):
   - Configure your SMTP settings (Gmail, Outlook, etc.)
   - Subject: `🚨 {{ $json.body.incident_type }} ALERT — {{ $json.body.video_name }}`
   - Body fields: confidence_pct, detection_timestamp, incident_summary, frame_url
6. Add a final **HTTP Request** node at the end:
   - Method: POST
   - URL: `http://localhost:8000/v1/alerts/{{ $json.body.alert_id }}/status`
   - Body: `{ "status": "sent", "n8n_execution_id": "{{ $execution.id }}" }`
7. Click **Save** then **Activate** (toggle top-right)

---

## PART 10 — Test the Full Flow

1. Open http://localhost:3000
2. Drag and drop a test video (any .mp4 file)
3. Select one or more models
4. Click **Run Detection**
5. Watch the live progress bar
6. View the results — detection confidence, timestamps, frame screenshot
7. If confidence is above threshold, check n8n for the triggered workflow execution
8. Open http://localhost:3000/dashboard to see the incident logged

---

## Troubleshooting

### "Module not found" errors in Python
Make sure your virtual environment is activated: `venv\Scripts\activate`

### "Connection refused" on port 5432 (PostgreSQL)
Open Services (Win+R → `services.msc`) and confirm PostgreSQL is running.

### "Connection refused" on port 6379 (Redis)
Open Services and confirm Memurai is running.

### Celery crashes immediately on Windows
Make sure you have `--pool=solo` in the Celery command.

### Model file not found
Check the FIRE_SMOKE_MODEL_PATH, ACCIDENT_MODEL_PATH, VIOLENCE_MODEL_PATH in .env
Use forward slashes: `C:/path/to/model.pt` not `C:\path\to\model.pt`

### Frontend shows API errors
Make sure the backend is running on port 8000 and .env.local has `NEXT_PUBLIC_API_URL=http://localhost:8000`

### MinIO bucket error on first upload
The backend creates the bucket automatically on startup. If it fails, open
http://localhost:9001, log in, and manually create a bucket named `surveillance-videos`.

---

## File Paths That Need Your Attention

These are the only values you MUST change from the defaults:

| File | Variable | What to set |
|---|---|---|
| backend/.env | DATABASE_URL | Your PostgreSQL password |
| backend/.env | SYNC_DATABASE_URL | Your PostgreSQL password |
| backend/.env | SECRET_KEY | Random 64-char hex string |
| backend/.env | FIRE_SMOKE_MODEL_PATH | Full path to your .pt file |
| backend/.env | ACCIDENT_MODEL_PATH | Full path to your .pt file |
| backend/.env | VIOLENCE_MODEL_PATH | Full path to your .pt file |
| backend/alembic.ini | sqlalchemy.url | Your PostgreSQL password |

Everything else works with the defaults as-is.
