'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, Film, X, CheckCircle } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import type { Video } from '@/types'

interface Props {
  onFileDrop: (file: File) => void
  uploadProgress: number
  uploadedVideo: Video | null
  disabled?: boolean
  onReset: () => void
}

const ACCEPTED = {
  'video/mp4': ['.mp4'],
  'video/x-msvideo': ['.avi'],
  'video/quicktime': ['.mov'],
  'video/x-matroska': ['.mkv'],
}

export function DropZone({
  onFileDrop,
  uploadProgress,
  uploadedVideo,
  disabled,
  onReset,
}: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFileDrop(accepted[0])
    },
    [onFileDrop]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024 * 1024, // 2 GB
    disabled: disabled || !!uploadedVideo,
  })

  // ── Uploaded state ────────────────────────────────────────────────────────
  if (uploadedVideo) {
    return (
      <div className="relative border border-surface-border rounded-xl p-6 bg-surface-raised flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
          <Film className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {uploadedVideo.original_name}
          </p>
          <p className="text-xs text-surface-muted mt-0.5">
            {formatBytes(uploadedVideo.size_bytes)} · Upload complete
          </p>
        </div>
        <CheckCircle className="w-5 h-5 text-safe flex-shrink-0" />
        {!disabled && (
          <button
            onClick={onReset}
            className="absolute top-3 right-3 p-1 rounded hover:bg-surface-border text-surface-muted hover:text-white transition-colors"
            aria-label="Remove video"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  // ── Uploading state ───────────────────────────────────────────────────────
  if (uploadProgress > 0 && uploadProgress < 100) {
    return (
      <div className="border border-surface-border rounded-xl p-8 bg-surface-raised">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-sm text-white">Uploading… {uploadProgress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    )
  }

  // ── Empty / drag state ────────────────────────────────────────────────────
  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer',
        'transition-all duration-200 outline-none',
        'scan-overlay overflow-hidden',
        isDragActive
          ? 'border-accent bg-accent/5 scale-[1.01]'
          : 'border-surface-border bg-surface-raised hover:border-surface-muted hover:bg-surface-overlay'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center border transition-colors',
            isDragActive
              ? 'bg-accent/20 border-accent/40'
              : 'bg-surface-border/50 border-surface-border'
          )}
        >
          <UploadCloud
            className={cn(
              'w-7 h-7 transition-colors',
              isDragActive ? 'text-accent' : 'text-surface-muted'
            )}
          />
        </div>

        <div>
          <p className="text-base font-medium text-white mb-1">
            {isDragActive ? 'Drop to upload' : 'Drop your video here'}
          </p>
          <p className="text-sm text-surface-muted">
            or{' '}
            <span className="text-accent underline underline-offset-2">
              browse files
            </span>
          </p>
        </div>

        <p className="text-xs text-surface-muted font-mono">
          MP4, AVI, MOV, MKV · max 2 GB
        </p>
      </div>
    </div>
  )
}
