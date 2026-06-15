import type { Metadata } from 'next'
import { ResultsView } from '@/components/results/ResultsView'

export const metadata: Metadata = { title: 'Detection Results' }

export default function ResultsPage({ params }: { params: { jobId: string } }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <ResultsView jobId={params.jobId} />
    </div>
  )
}
