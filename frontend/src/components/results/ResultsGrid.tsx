'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Flame, Car, Swords, CheckCircle, XCircle, Bell, FileText, Clock } from 'lucide-react'
import { cn, formatConfidence } from '@/lib/utils'
import type { DetectionResults, ModelResult, ModelKey } from '@/types'
import { MODEL_LABELS } from '@/types'

const MODEL_ICONS: Record<ModelKey, React.ElementType> = {
  fire_smoke: Flame,
  accident: Car,
  violence: Swords,
}

const MODEL_COLORS: Record<ModelKey, { text: string; bg: string; border: string }> = {
  fire_smoke: { text: 'text-fire', bg: 'bg-fire/10', border: 'border-fire/30' },
  accident: { text: 'text-accident', bg: 'bg-accident/10', border: 'border-accident/30' },
  violence: { text: 'text-violence', bg: 'bg-violence/10', border: 'border-violence/30' },
}

interface Props {
  results: DetectionResults
}

export function ResultsGrid({ results }: Props) {
  console.log("RESULTS:", results)
  const detected = results.results.filter((r) => r.detected)
  const clear = results.results.filter((r) => !r.detected)

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Summary bar */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-surface-border bg-surface-raised">
        <div className="flex-1">
          <p className="text-xs text-surface-muted mb-1">Video analyzed</p>
          <p className="text-sm font-medium text-white">{results.video_name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-surface-muted mb-1">Processing time</p>
          <p className="text-sm font-mono text-white">{results.processing_time_seconds}s</p>
        </div>
        {detected.length > 0 ? (
          <div className="px-3 py-1.5 rounded-full bg-red-400/10 border border-red-400/20 text-xs text-red-400 font-medium">
            {detected.length} incident{detected.length > 1 ? 's' : ''} detected
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-full bg-safe/10 border border-safe/20 text-xs text-safe font-medium">
            No incidents
          </div>
        )}
      </div>

      {/* Detected incidents first */}
      {detected.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Incidents Detected
          </h2>
          <div className="grid gap-4">
            {detected.map((r) => (
              <ResultCard key={r.model} result={r} />
            ))}
          </div>
        </section>
      )}

      {/* Clear models */}
      {clear.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-widest text-surface-muted mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            No Incident
          </h2>
          <div className="grid gap-3">
            {clear.map((r) => (
              <ResultCard key={r.model} result={r} />
            ))}
          </div>
        </section>
      )}

      {/* Footer actions */}
      <div className="flex gap-3 pt-2">
        <Link
          href="/upload"
          className="px-4 py-2 rounded-lg border border-surface-border text-sm text-surface-muted hover:text-white hover:border-surface-muted transition-colors"
        >
          Analyze another video
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg border border-accent/30 text-sm text-accent hover:bg-accent/10 transition-colors"
        >
          View dashboard
        </Link>
      </div>
    </div>
  )
}

function ResultCard({ result }: { result: ModelResult }) {
  const Icon = MODEL_ICONS[result.model]
  const colors = MODEL_COLORS[result.model]
  const confPct = Math.round(result.confidence * 100)

  return (
    <div
      className={cn(
        'rounded-xl border p-5 transition-colors',
        result.detected
          ? `${colors.bg} ${colors.border}`
          : 'bg-surface-raised border-surface-border'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border',
            result.detected
              ? `${colors.text} ${colors.bg} ${colors.border}`
              : 'text-surface-muted bg-surface-border/30 border-surface-border'
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {MODEL_LABELS[result.model]}
              </h3>
              <p className="text-xs text-surface-muted">
                {result.detected
                  ? `${result.incident_type} detected`
                  : 'No incident found'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {result.detected ? (
                <XCircle className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-safe" />
              )}
            </div>
          </div>

          {/* Confidence bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-muted">Confidence</span>
              <span
                className={cn(
                  'font-mono font-medium',
                  result.detected ? colors.text : 'text-surface-muted'
                )}
              >
                {formatConfidence(result.confidence)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  confPct >= 80 ? 'conf-high' : confPct >= 60 ? 'conf-mid' : 'conf-low'
                )}
                style={{ width: `${confPct}%` }}
              />
            </div>
          </div>

          {/* Timestamps & details (only when detected) */}
          {result.detected && result.detection_timestamps.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.detection_timestamps.map((ts) => (
                <span
                  key={ts}
                  className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-surface-border/50 text-surface-muted"
                >
                  <Clock className="w-3 h-3" />
                  {ts}
                </span>
              ))}
            </div>
          )}

          {/* Screenshot + actions row */}
          {result.detected && (
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              {result.frame_screenshot_url && (
                <div className="relative w-24 h-14 rounded overflow-hidden border border-surface-border flex-shrink-0">
                  <Image
                    src={result.frame_screenshot_url}
                    alt="Detection frame"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex gap-2">
                {result.alert_sent && (
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-safe/10 border border-safe/20 text-safe">
                    <Bell className="w-3 h-3" />
                    Alert sent
                  </span>
                )}
                {result.incident_id && (
                  <Link
                    href={`/dashboard/incidents/${result.incident_id}`}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-surface-border/50 border border-surface-border text-surface-muted hover:text-white transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    View report
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
