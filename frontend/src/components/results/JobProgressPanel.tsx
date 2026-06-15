'use client'

import { useDetectionStore } from '@/store/useDetectionStore'
import { MODEL_LABELS } from '@/types'
import { cn } from '@/lib/utils'
import { Flame, Car, Swords } from 'lucide-react'

const MODEL_ICONS = { fire_smoke: Flame, accident: Car, violence: Swords }

export function JobProgressPanel({ jobId: _ }: { jobId: string }) {
  const jobProgress = useDetectionStore((s) => s.jobProgress)
  const progress = jobProgress?.progress ?? 0
  const currentModel = jobProgress?.current_model ?? null
  const status = jobProgress?.status ?? 'QUEUED'

  const statusLabel =
    status === 'QUEUED'
      ? 'Waiting in queue…'
      : status === 'PROCESSING'
      ? `Analyzing with ${currentModel ? MODEL_LABELS[currentModel] : 'model'}…`
      : status === 'COMPLETED'
      ? 'Analysis complete'
      : 'Analysis failed'

  return (
    <div className="border border-surface-border rounded-xl p-6 bg-surface-raised space-y-5">
      {/* Status */}
      <div className="flex items-center gap-3">
        {status !== 'FAILED' && status !== 'COMPLETED' && (
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
        )}
        <p className="text-sm text-white">{statusLabel}</p>
        <span
          className="ml-auto text-xs font-mono text-accent"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Model indicators */}
      <div className="flex gap-3">
        {(['fire_smoke', 'accident', 'violence'] as const).map((model) => {
          const Icon = MODEL_ICONS[model]
          const active = currentModel === model
          return (
            <div
              key={model}
              className={cn(
                'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors',
                active
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-surface-border text-surface-muted'
              )}
            >
              <Icon className="w-3 h-3" />
              {MODEL_LABELS[model]}
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
