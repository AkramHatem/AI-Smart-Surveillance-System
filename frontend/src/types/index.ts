// ─── Enums ────────────────────────────────────────────────────────────────────

export type IncidentType = 'FIRE' | 'SMOKE' | 'ACCIDENT' | 'VIOLENCE' | 'NONE'
export type AlertStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING' | 'SKIPPED'
export type ProcessingStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type ModelKey = 'fire_smoke' | 'accident' | 'violence'

// ─── Video ────────────────────────────────────────────────────────────────────

export interface Video {
  id: string
  filename: string
  original_name: string
  size_bytes: number
  duration_seconds: number | null
  storage_url: string
  uploaded_at: string
  status: 'uploaded' | 'processing' | 'done' | 'failed'
}

export interface UploadVideoResponse {
  video_id: string
  filename: string
  size_bytes: number
  upload_url: string
  status: string
  created_at: string
}

// ─── Detection ────────────────────────────────────────────────────────────────

export interface DetectionRequest {
  video_id: string
  models: ModelKey[]
  confidence_threshold: number
}

export interface DetectionJobResponse {
  job_id: string
  video_id: string
  models_requested: ModelKey[]
  status: ProcessingStatus
  estimated_duration_seconds: number
}

export interface ModelResult {
  incident_id: string | null

  model: ModelKey
  incident_type: IncidentType
  detected: boolean
  confidence: number
  detection_timestamps: string[]
  frame_screenshot_url: string | null
  alert_sent: boolean
  alert_id: string | null
}

export interface DetectionResults {
  job_id: string
  video_id: string
  video_name: string
  processing_time_seconds: number
  results: ModelResult[]
}

// ─── WebSocket progress ───────────────────────────────────────────────────────

export interface JobProgress {
  job_id: string
  progress: number
  current_model: ModelKey | null
  status: ProcessingStatus
  error?: string
}

// ─── Incidents ────────────────────────────────────────────────────────────────

export interface Incident {
  id: string
  job_id: string
  video_id: string
  model_name: ModelKey
  incident_type: IncidentType
  detected: boolean
  confidence: number
  detection_timestamps: string[]
  frame_screenshot_url: string | null
  report_url: string | null
  incident_summary: string | null
  alert_status: AlertStatus
  video_name: string
  created_at: string
}

export interface IncidentListResponse {
  total: number
  page: number
  limit: number
  incidents: Incident[]
}

export interface IncidentFilters {
  page: number
  limit: number
  type?: IncidentType
  alert_status?: AlertStatus
  date_from?: string
  date_to?: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_videos_processed: number
  total_fire_incidents: number
  total_accidents: number
  total_violence_incidents: number
  total_alerts_sent: number
  incidents_over_time: TimeSeriesPoint[]
}

export interface TimeSeriesPoint {
  date: string
  fire: number
  accident: number
  violence: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const MODEL_LABELS: Record<ModelKey, string> = {
  fire_smoke: 'Fire & Smoke',
  accident: 'Accident',
  violence: 'Violence',
}

export const INCIDENT_COLORS: Record<IncidentType, string> = {
  FIRE: '#f97316',
  SMOKE: '#fb923c',
  ACCIDENT: '#eab308',
  VIOLENCE: '#ef4444',
  NONE: '#6b7280',
}

export const ALERT_STATUS_COLORS: Record<AlertStatus, string> = {
  SENT: 'text-safe bg-safe/10',
  FAILED: 'text-red-400 bg-red-400/10',
  PENDING: 'text-yellow-400 bg-yellow-400/10',
  RETRYING: 'text-orange-400 bg-orange-400/10',
  SKIPPED: 'text-surface-muted bg-surface-border/30',
}
