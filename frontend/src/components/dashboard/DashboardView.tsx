'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getIncidents } from '@/lib/api'
import { StatsRow } from './StatsRow'
import { IncidentsChart } from './IncidentsChart'
import { IncidentsTable } from './IncidentsTable'
import type { IncidentFilters, IncidentType, AlertStatus } from '@/types'
import { RefreshCw } from 'lucide-react'

const LIMIT = 20

export function DashboardView() {
  const [filters, setFilters] = useState<IncidentFilters>({
    page: 1,
    limit: LIMIT,
  })

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
    isFetching: statsFetching,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 60_000,
  })

  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => getIncidents(filters),
    placeholderData: (prev) => prev,
  })

  function setType(type: IncidentType | undefined) {
    setFilters((f) => ({ ...f, type, page: 1 }))
  }

  function setAlertStatus(alert_status: AlertStatus | undefined) {
    setFilters((f) => ({ ...f, alert_status, page: 1 }))
  }

  function setPage(page: number) {
    setFilters((f) => ({ ...f, page }))
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
            Overview
          </p>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Incident Dashboard
          </h1>
        </div>
        <button
          onClick={() => refetchStats()}
          disabled={statsFetching}
          className="flex items-center gap-1.5 text-xs text-surface-muted hover:text-white transition-colors px-3 py-1.5 rounded border border-surface-border hover:border-surface-muted"
        >
          <RefreshCw className={`w-3 h-3 ${statsFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <StatsRow stats={stats} loading={statsLoading} />

      {/* Chart */}
      {stats?.incidents_over_time && (
        <IncidentsChart data={stats.incidents_over_time} />
      )}

      {/* Table */}
      <IncidentsTable
        incidents={incidents?.incidents ?? []}
        total={incidents?.total ?? 0}
        loading={incidentsLoading}
        filters={filters}
        onTypeChange={setType}
        onAlertStatusChange={setAlertStatus}
        onPageChange={setPage}
      />
    </div>
  )
}
