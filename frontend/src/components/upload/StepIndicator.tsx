'use client'

import { cn } from '@/lib/utils'
import { Upload, Settings, Scan } from 'lucide-react'

const STEPS = [
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'configure', label: 'Configure', icon: Settings },
  { key: 'running', label: 'Analyzing', icon: Scan },
]

interface Props {
  current: 'upload' | 'configure' | 'running'
}

export function StepIndicator({ current }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.key === current)

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const done = i < currentIndex
        const active = i === currentIndex

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs border transition-colors',
                  done
                    ? 'bg-accent border-accent text-white'
                    : active
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'bg-surface-border/30 border-surface-border text-surface-muted'
                )}
              >
                {done ? (
                  <svg viewBox="0 0 10 8" className="w-3 h-3">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs',
                  active ? 'text-white font-medium' : 'text-surface-muted'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-8 h-px mx-1 transition-colors',
                  i < currentIndex ? 'bg-accent/40' : 'bg-surface-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
