import { useEffect, useRef, useCallback } from 'react'
import type { JobProgress } from '@/types'

type Handler = (progress: JobProgress) => void

export function useJobSocket(jobId: string | null, onMessage: Handler) {
  const wsRef = useRef<WebSocket | null>(null)
  const handlerRef = useRef(onMessage)

  // Keep handler ref fresh without re-connecting
  useEffect(() => {
    handlerRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    if (!jobId) return

    const base = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''
    const url = `${base}/v1/detections/ws/jobs/${jobId}?token=${token}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data: JobProgress = JSON.parse(event.data)
        handlerRef.current(data)
      } catch {
        console.error('[WS] Failed to parse message', event.data)
      }
    }

    ws.onerror = (e) => console.error('[WS] Error', e)

    ws.onclose = (e) => {
      // Reconnect on abnormal close unless job is done
      if (e.code !== 1000 && e.code !== 1001) {
        setTimeout(connect, 2000)
      }
    }
  }, [jobId])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close(1000, 'Component unmounted')
    }
  }, [connect])
}
