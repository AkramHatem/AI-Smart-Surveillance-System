'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDetectionStore } from '@/store/useDetectionStore'
import { uploadVideo, triggerDetection } from '@/lib/api'
import { DropZone } from './DropZone'
import { ModelSelector } from './ModelSelector'
import { StepIndicator } from './StepIndicator'
import { cn } from '@/lib/utils'
import { Loader2, Play } from 'lucide-react'

type Step = 'upload' | 'configure' | 'running'

export function UploadFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    uploadedVideo,
    selectedModels,
    confidenceThreshold,
    setUploadedVideo,
    setUploadProgress,
    setJobId,
    uploadProgress,
  } = useDetectionStore()

  // ── Step 1: handle file drop ──────────────────────────────────────────────
  async function handleFileDrop(file: File) {
    setError(null)
    setUploadProgress(0)

    try {
      const video = await uploadVideo(file, (pct) => setUploadProgress(pct))
      setUploadedVideo({
        id: video.video_id,
        filename: video.filename,
        original_name: file.name,
        size_bytes: video.size_bytes,
        duration_seconds: null,
        storage_url: video.upload_url,
        uploaded_at: video.created_at,
        status: 'uploaded',
      })
      setStep('configure')
    } catch {
      setError('Upload failed. Please check your connection and try again.')
    }
  }

  // ── Step 2: trigger detection ─────────────────────────────────────────────
  async function handleRunDetection() {
    if (!uploadedVideo || selectedModels.length === 0) return
    setIsSubmitting(true)
    setError(null)

    try {
      const job = await triggerDetection({
        video_id: uploadedVideo.id,
        models: selectedModels,
        confidence_threshold: confidenceThreshold,
      })
      setJobId(job.job_id)
      router.push(`/results/${job.job_id}`)
    } catch {
      setError('Failed to start detection. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
          Incident Detection
        </p>
        <h1
          className="text-4xl font-bold text-white mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Analyze Surveillance Video
        </h1>
        <p className="text-surface-muted max-w-xl">
          Upload a video clip and select which AI models to run. The system
          will detect incidents and automatically alert the relevant
          authorities when confidence exceeds your threshold.
        </p>
      </div>

      <StepIndicator current={step} />

      <div className="mt-8 space-y-8">
        {/* Step 1 — Drop zone */}
        <DropZone
          onFileDrop={handleFileDrop}
          uploadProgress={uploadProgress}
          uploadedVideo={uploadedVideo}
          disabled={step !== 'upload'}
          onReset={() => {
            setUploadedVideo(null)
            setUploadProgress(0)
            setStep('upload')
          }}
        />

        {/* Step 2 — Configure */}
        <div
          className={cn(
            'transition-all duration-300',
            step === 'upload'
              ? 'opacity-30 pointer-events-none'
              : 'opacity-100'
          )}
        >
          <ModelSelector />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-4 py-3">
            {error}
          </p>
        )}

        {/* CTA */}
        <div
          className={cn(
            'transition-all duration-300',
            step !== 'configure'
              ? 'opacity-30 pointer-events-none'
              : 'opacity-100'
          )}
        >
          <button
            onClick={handleRunDetection}
            disabled={isSubmitting || selectedModels.length === 0}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 py-4 rounded-lg text-sm font-semibold tracking-wide uppercase',
              'bg-accent hover:bg-accent-glow text-white transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'border border-accent/50'
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting analysis…
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Run Detection
                {selectedModels.length > 0 && (
                  <span className="ml-1 text-white/60 font-normal normal-case" style={{ fontFamily: 'var(--font-body)' }}>
                    ({selectedModels.length} model{selectedModels.length > 1 ? 's' : ''})
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
