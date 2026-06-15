'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatDateShort } from '@/lib/utils'
import type { TimeSeriesPoint } from '@/types'

interface Props {
  data: TimeSeriesPoint[]
}

const SERIES = [
  { key: 'fire', label: 'Fire', color: '#f97316' },
  { key: 'accident', label: 'Accident', color: '#eab308' },
  { key: 'violence', label: 'Violence', color: '#ef4444' },
]

export function IncidentsChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    date: formatDateShort(d.date),
  }))

  return (
    <div className="p-5 rounded-xl border border-surface-border bg-surface-raised">
      <h2
        className="text-xs font-semibold uppercase tracking-widest text-surface-muted mb-5"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Incidents Over Time
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="hsl(220 8% 18%)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'hsl(220 6% 35%)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(220 6% 35%)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(220 12% 9%)',
              border: '1px solid hsl(220 8% 18%)',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
            labelStyle={{ color: 'hsl(220 10% 88%)', marginBottom: 4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', paddingTop: 12 }}
          />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
