'use client'

import { useDetectionStore } from '@/store/useDetectionStore'
import { cn } from '@/lib/utils'
import { Flame, Car, Swords, Layers } from 'lucide-react'
import type { ModelKey } from '@/types'

const MODELS: {
  key: ModelKey
  label: string
  sub: string
  icon: React.ElementType
  color: string
  activeClasses: string
}[] = [
  {
    key: 'fire_smoke',
    label: 'Fire & Smoke',
    sub: 'Notifies Fire Dept + EMS',
    icon: Flame,
    color: 'text-fire',
    activeClasses: 'border-fire/40 bg-fire/8',
  },
  {
    key: 'accident',
    label: 'Accident',
    sub: 'Notifies Traffic Auth + Response Team',
    icon: Car,
    color: 'text-accident',
    activeClasses: 'border-accident/40 bg-accident/8',
  },
  {
    key: 'violence',
    label: 'Violence',
    sub: 'Notifies Law Enforcement + Security',
    icon: Swords,
    color: 'text-violence',
    activeClasses: 'border-violence/40 bg-violence/8',
  },
]

export function ModelSelector() {
  const { selectedModels, confidenceThreshold, toggleModel, setConfidenceThreshold } =
    useDetectionStore()

  const allSelected = selectedModels.length === MODELS.length

  function toggleAll() {
    if (allSelected) {
      MODELS.forEach((m) => {
        if (selectedModels.includes(m.key)) toggleModel(m.key)
      })
    } else {
      MODELS.forEach((m) => {
        if (!selectedModels.includes(m.key)) toggleModel(m.key)
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-sm font-semibold text-white uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Detection Models
          </h2>
          <p className="text-xs text-surface-muted mt-0.5">
            Select which incidents to detect
          </p>
        </div>
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-xs text-surface-muted hover:text-accent transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MODELS.map((model) => {
          const active = selectedModels.includes(model.key)
          const Icon = model.icon
          return (
            <button
              key={model.key}
              onClick={() => toggleModel(model.key)}
              className={cn(
                'text-left p-4 rounded-xl border transition-all duration-150 glow-card',
                active
                  ? model.activeClasses
                  : 'border-surface-border bg-surface-raised hover:border-surface-muted'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center border',
                    active
                      ? `${model.color} border-current/30 bg-current/10`
                      : 'text-surface-muted border-surface-border bg-surface-border/30'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {/* Checkbox */}
                <div
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                    active
                      ? 'bg-accent border-accent'
                      : 'border-surface-border bg-transparent'
                  )}
                >
                  {active && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-white">{model.label}</p>
              <p className="text-xs text-surface-muted mt-0.5 leading-snug">{model.sub}</p>
            </button>
          )
        })}
      </div>

      {/* Confidence threshold */}
      <div className="p-4 rounded-xl border border-surface-border bg-surface-raised space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Confidence Threshold</p>
            <p className="text-xs text-surface-muted">
              Alerts are sent only above this score
            </p>
          </div>
          <span className="text-lg font-bold text-accent" style={{ fontFamily: 'var(--font-mono)' }}>
            {Math.round(confidenceThreshold * 100)}%
          </span>
        </div>

        <input
          type="range"
          min={0.5}
          max={0.99}
          step={0.01}
          value={confidenceThreshold}
          onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
          className="w-full accent-accent"
          aria-label="Confidence threshold"
        />

        <div className="flex justify-between text-xs text-surface-muted font-mono">
          <span>50% — more alerts</span>
          <span>99% — fewer alerts</span>
        </div>
      </div>
    </div>
  )
}
