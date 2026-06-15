import type { Metadata } from 'next'
import { IncidentDetailView } from '@/components/dashboard/IncidentDetailView'

export const metadata: Metadata = { title: 'Incident Detail' }

export default function IncidentPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <IncidentDetailView id={params.id} />
    </div>
  )
}
