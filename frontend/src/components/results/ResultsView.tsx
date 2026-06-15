'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDetectionStore } from '@/store/useDetectionStore'
import { useJobSocket } from '@/lib/websocket'
import { getDetectionResults } from '@/lib/api'
import { JobProgressPanel } from './JobProgressPanel'
import { ResultsGrid } from './ResultsGrid'
import type { JobProgress } from '@/types'

interface Props {
  jobId: string
}

export function ResultsView({ jobId }: Props) {
  const setJobProgress = useDetectionStore((s) => s.setJobProgress)
  const [jobDone, setJobDone] = useState(false)

  // WebSocket progress updates
  const handleProgress = useCallback(
    (progress: JobProgress) => {
      setJobProgress(progress)
      if (progress.status === 'COMPLETED' || progress.status === 'FAILED') {
        setJobDone(true)
      }
    },
    [setJobProgress]
  )

  useJobSocket(jobDone ? null : jobId, handleProgress)

  // Poll results once job is done
  const { data: results, isLoading } = useQuery({
    queryKey: ['results', jobId],
    queryFn: () => getDetectionResults(jobId),
    enabled: jobDone,
    staleTime: Infinity,
  })

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
          Analysis
        </p>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Detection Results
        </h1>
        <p className="text-sm text-surface-muted mt-1 font-mono">
          Job: {jobId}
        </p>
      </div>

      {!jobDone && <JobProgressPanel jobId={jobId} />}

      {jobDone && isLoading && (
        <div className="flex items-center gap-3 text-sm text-surface-muted">
          <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          Loading results…
        </div>
      )}

      {results && <ResultsGrid results={results} />}
    </div>
  )
}
