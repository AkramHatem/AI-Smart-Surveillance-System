'use client'

import Link from 'next/link'
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, formatDate, formatConfidence } from '@/lib/utils'
import { ALERT_STATUS_COLORS } from '@/types'
import type { Incident, IncidentType, AlertStatus, IncidentFilters } from '@/types'

interface Props {
  incidents: Incident[]
  total: number
  loading: boolean
  filters: IncidentFilters
  onTypeChange: (t: IncidentType | undefined) => void
  onAlertStatusChange: (s: AlertStatus | undefined) => void
  onPageChange: (p: number) => void
}

const TYPE_OPTIONS: { value: IncidentType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'FIRE', label: '🔥 Fire' },
  { value: 'SMOKE', label: '💨 Smoke' },
  { value: 'ACCIDENT', label: '🚗 Accident' },
  { value: 'VIOLENCE', label: '⚠️ Violence' },
]

const STATUS_OPTIONS: { value: AlertStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'SENT', label: 'Sent' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SKIPPED', label: 'Skipped' },
]

const TYPE_BADGES: Record<IncidentType, string> = {
  FIRE: 'text-fire bg-fire/10',
  SMOKE: 'text-orange-400 bg-orange-400/10',
  ACCIDENT: 'text-accident bg-accident/10',
  VIOLENCE: 'text-violence bg-violence/10',
  NONE: 'text-surface-muted bg-surface-border/30',
}

export function IncidentsTable({
  incidents,
  total,
  loading,
  filters,
  onTypeChange,
  onAlertStatusChange,
  onPageChange,
}: Props) {
  const pageCount = Math.ceil(total / filters.limit)
  const { page } = filters

  return (
    <div className="space-y-4">
      {/* Header + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <h2
          className="text-xs font-semibold uppercase tracking-widest text-surface-muted mr-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Incident History
        </h2>
        <span className="text-xs text-surface-muted font-mono">
          {total.toLocaleString()} total
        </span>

        <div className="ml-auto flex gap-2">
          <select
            value={filters.type ?? ''}
            onChange={(e) =>
              onTypeChange((e.target.value as IncidentType) || undefined)
            }
            className="text-xs rounded border border-surface-border bg-surface-raised text-surface-muted px-2 py-1.5 focus:outline-none focus:border-accent/40"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={filters.alert_status ?? ''}
            onChange={(e) =>
              onAlertStatusChange((e.target.value as AlertStatus) || undefined)
            }
            className="text-xs rounded border border-surface-border bg-surface-raised text-surface-muted px-2 py-1.5 focus:outline-none focus:border-accent/40"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-raised border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-muted uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-muted uppercase tracking-wide">
                  Incident
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-muted uppercase tracking-wide">
                  Video
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-surface-muted uppercase tracking-wide">
                  Confidence
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-muted uppercase tracking-wide">
                  Alert
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-surface-border/50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-surface-border animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : incidents.map((incident) => (
                    <IncidentRow key={incident.id} incident={incident} />
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && incidents.length === 0 && (
          <div className="py-16 text-center text-surface-muted text-sm">
            No incidents found
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-surface-muted">
          <span>
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded border border-surface-border hover:border-surface-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(pageCount, 7) }).map((_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'w-7 h-7 rounded border text-xs transition-colors',
                    p === page
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-surface-border hover:border-surface-muted text-surface-muted'
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pageCount}
              className="p-1.5 rounded border border-surface-border hover:border-surface-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function IncidentRow({ incident }: { incident: Incident }) {
  return (
    <tr className="border-b border-surface-border/50 hover:bg-surface-raised/50 transition-colors">
      <td className="px-4 py-3 text-xs text-surface-muted font-mono whitespace-nowrap">
        {formatDate(incident.created_at)}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex text-xs px-2 py-0.5 rounded-full font-medium',
            TYPE_BADGES[incident.incident_type]
          )}
        >
          {incident.incident_type}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-surface-muted max-w-[180px] truncate">
        {incident.video_name}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-xs font-mono text-white">
          {formatConfidence(incident.confidence)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex text-xs px-2 py-0.5 rounded-full font-medium',
            ALERT_STATUS_COLORS[incident.alert_status]
          )}
        >
          {incident.alert_status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/dashboard/incidents/${incident.id}`}
          className="inline-flex items-center gap-1 text-xs text-surface-muted hover:text-accent transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  )
}
