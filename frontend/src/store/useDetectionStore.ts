import { create } from 'zustand'
import type { ModelKey, JobProgress, DetectionResults, Video } from '@/types'

interface DetectionStore {
  // Upload state
  uploadedVideo: Video | null
  uploadProgress: number
  setUploadedVideo: (v: Video | null) => void
  setUploadProgress: (p: number) => void

  // Model selection
  selectedModels: ModelKey[]
  confidenceThreshold: number
  toggleModel: (m: ModelKey) => void
  setConfidenceThreshold: (t: number) => void

  // Job state
  jobId: string | null
  jobProgress: JobProgress | null
  setJobId: (id: string | null) => void
  setJobProgress: (p: JobProgress) => void

  // Results
  results: DetectionResults | null
  setResults: (r: DetectionResults | null) => void

  // Reset
  reset: () => void
}

const initialState = {
  uploadedVideo: null,
  uploadProgress: 0,
  selectedModels: ['fire_smoke', 'accident', 'violence'] as ModelKey[],
  confidenceThreshold: 0.75,
  jobId: null,
  jobProgress: null,
  results: null,
}

export const useDetectionStore = create<DetectionStore>((set) => ({
  ...initialState,

  setUploadedVideo: (v) => set({ uploadedVideo: v }),
  setUploadProgress: (p) => set({ uploadProgress: p }),

  toggleModel: (m) =>
    set((state) => ({
      selectedModels: state.selectedModels.includes(m)
        ? state.selectedModels.filter((x) => x !== m)
        : [...state.selectedModels, m],
    })),

  setConfidenceThreshold: (t) => set({ confidenceThreshold: t }),

  setJobId: (id) => set({ jobId: id }),
  setJobProgress: (p) => set({ jobProgress: p }),

  setResults: (r) => set({ results: r }),

  reset: () => set(initialState),
}))
