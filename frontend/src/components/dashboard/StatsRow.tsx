'use client'

import { Video, Flame, Car, Swords, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/types'

interface Props {
  stats?: DashboardStats
  loading: boolean
}

const CARDS = [
  {
    key: 'total_videos_processed' as const,
    label: 'Videos Processed',
    icon: Video,
    color: 'text-white',
    iconBg: 'bg-surface-border/50',
  },
  {
    key: 'total_fire_incidents' as const,
    label: 'Fire Incidents',
    icon: Flame,
    color: 'text-fire',
    iconBg: 'bg-fire/10',
  },
  {
    key: 'total_accidents' as const,
    label: 'Accidents',
    icon: Car,
    color: 'text-accident',
    iconBg: 'bg-accident/10',
  },
  {
    key: 'total_violence_incidents' as const,
    label: 'Violence',
    icon: Swords,
    color: 'text-violence',
    iconBg: 'bg-violence/10',
  },
  {
    key: 'total_alerts_sent' as const,
    label: 'Alerts Sent',
    icon: Bell,
    color: 'text-accent',
    iconBg: 'bg-accent/10',
  },
]

export function StatsRow({ stats, loading }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {CARDS.map(({ key, label, icon: Icon, color, iconBg }) => (
        <div
          key={key}
          className="p-4 rounded-xl border border-surface-border bg-surface-raised glow-card"
        >
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', iconBg)}>
            <Icon className={cn('w-4 h-4', color)} />
          </div>
          {loading ? (
            <div className="h-7 w-12 rounded bg-surface-border animate-pulse mb-1" />
          ) : (
            <p
              className={cn('text-2xl font-bold', color)}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {(stats?.[key] ?? 0).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-surface-muted mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}
