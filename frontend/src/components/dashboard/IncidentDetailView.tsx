'use client'

import { useQuery } from '@tanstack/react-query'
import { getIncidentById } from '@/lib/api'
import { cn, formatDate, formatConfidence } from '@/lib/utils'
import { ALERT_STATUS_COLORS, MODEL_LABELS } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Flame, Car, Swords, Bell,
  FileText, Clock, AlertTriangle, CheckCircle
} from 'lucide-react'
import type { ModelKey } from '@/types'

const MODEL_ICONS: Record<ModelKey, React.ElementType> = {
  fire_smoke: Flame,
  accident: Car,
  violence: Swords,
}

export function IncidentDetailView({ id }: { id: string }) {
  const { data: incident, isLoading, error } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => getIncidentById(id),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-32 rounded bg-surface-border" />
        <div className="h-40 rounded-xl bg-surface-raised border border-surface-border" />
        <div className="h-64 rounded-xl bg-surface-raised border border-surface-border" />
      </div>
    )
  }

  if (error || !incident) {
    return (
      <div className="text-center py-20 text-surface-muted">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
        <p>Incident not found.</p>
        <Link href="/dashboard" className="text-accent text-sm mt-2 inline-block hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  console.log("INCIDENT DETAILS", {
  id: incident.id,
  model: incident.model_name,
  image: incident.frame_screenshot_url,
})

  const Icon = MODEL_ICONS[incident.model_name] ?? Flame

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-surface-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
          Incident Report
        </p>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {incident.incident_type} Detected
        </h1>
        <p className="text-sm text-surface-muted mt-1">
          {formatDate(incident.created_at)}
        </p>
      </div>

      {/* Main info card */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-surface-border bg-surface-raised space-y-4">
          <h2
            className="text-xs font-semibold uppercase tracking-widest text-surface-muted"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Detection Info
          </h2>

          <Row label="Incident Type">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-accent" />
              <span className="text-white font-medium">{incident.incident_type}</span>
            </div>
          </Row>

          <Row label="Model Used">
            <span className="text-white">{MODEL_LABELS[incident.model_name]}</span>
          </Row>

          <Row label="Confidence">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 h-1.5 rounded-full bg-surface-border overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${Math.round(incident.confidence * 100)}%` }}
                />
              </div>
              <span className="text-white font-mono text-sm font-medium">
                {formatConfidence(incident.confidence)}
              </span>
            </div>
          </Row>

          <Row label="Video">
            <span className="text-white truncate">{incident.video_name}</span>
          </Row>

          <Row label="Detected At">
            <div className="flex flex-wrap gap-1.5">
              {incident.detection_timestamps.length > 0
                ? incident.detection_timestamps.map((ts) => (
                    <span
                      key={ts}
                      className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-surface-border text-surface-muted"
                    >
                      <Clock className="w-3 h-3" />
                      {ts}
                    </span>
                  ))
                : <span className="text-surface-muted text-sm">—</span>
              }
            </div>
          </Row>
        </div>

        <div className="p-5 rounded-xl border border-surface-border bg-surface-raised space-y-4">
          <h2
            className="text-xs font-semibold uppercase tracking-widest text-surface-muted"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Alert Status
          </h2>

          <Row label="Alert">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-medium',
                ALERT_STATUS_COLORS[incident.alert_status]
              )}
            >
              {incident.alert_status === 'SENT'
                ? <CheckCircle className="w-3.5 h-3.5" />
                : <Bell className="w-3.5 h-3.5" />
              }
              {incident.alert_status}
            </span>
          </Row>

          <Row label="Detected">
            <span className={incident.detected ? 'text-red-400' : 'text-safe'}>
              {incident.detected ? 'Yes — incident found' : 'No incident'}
            </span>
          </Row>

          {incident.incident_summary && (
            <div className="pt-2">
              <p className="text-xs text-surface-muted mb-2 uppercase tracking-wide">Summary</p>
              <p className="text-sm text-white leading-relaxed">
                {incident.incident_summary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Frame screenshot */}
      {incident.frame_screenshot_url && (
        <div className="p-5 rounded-xl border border-surface-border bg-surface-raised">
          <h2
            className="text-xs font-semibold uppercase tracking-widest text-surface-muted mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Detection Frame
          </h2>
          <div className="relative rounded-lg overflow-hidden border border-surface-border max-w-xl">
            <Image
              src={incident.frame_screenshot_url}
              alt="Detection frame screenshot"
              width={800}
              height={450}
              className="w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {incident.report_url && (
          <a
            href={incident.report_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-accent/30 text-sm text-accent hover:bg-accent/10 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Download Report
          </a>
        )}
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg border border-surface-border text-sm text-surface-muted hover:text-white hover:border-surface-muted transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-surface-muted w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
