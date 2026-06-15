import type { Metadata } from 'next'
import { DashboardView } from '@/components/dashboard/DashboardView'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <DashboardView />
    </div>
  )
}
