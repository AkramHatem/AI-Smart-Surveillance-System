import axios, { AxiosError } from 'axios'
import type {
  UploadVideoResponse,
  DetectionJobResponse,
  DetectionRequest,
  DetectionResults,
  IncidentListResponse,
  IncidentFilters,
  Incident,
  DashboardStats,
} from '@/types'

// ─── Client setup ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Centralised error handling
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Videos ───────────────────────────────────────────────────────────────────

export async function uploadVideo(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadVideoResponse> {
  const form = new FormData()
  form.append('file', file)

  const { data } = await api.post<UploadVideoResponse>('/v1/videos/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
  return data
}

// ─── Detection ────────────────────────────────────────────────────────────────

export async function triggerDetection(
  payload: DetectionRequest
): Promise<DetectionJobResponse> {
  const { data } = await api.post<DetectionJobResponse>('/v1/detections/run', payload)
  return data
}

export async function getDetectionResults(jobId: string): Promise<DetectionResults> {
  const { data } = await api.get<DetectionResults>(`/v1/detections/${jobId}/results`)
  return data
}

// ─── Incidents ────────────────────────────────────────────────────────────────

export async function getIncidents(
  filters: IncidentFilters
): Promise<IncidentListResponse> {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  }
  if (filters.type) params.type = filters.type
  if (filters.alert_status) params.alert_status = filters.alert_status
  if (filters.date_from) params.date_from = filters.date_from
  if (filters.date_to) params.date_to = filters.date_to

  const { data } = await api.get<IncidentListResponse>('/v1/incidents', { params })
  return data
}

export async function getIncidentById(id: string): Promise<Incident> {
  const { data } = await api.get<Incident>(`/v1/incidents/${id}`)
  return data
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/v1/dashboard/stats')
  return data
}

export default api
