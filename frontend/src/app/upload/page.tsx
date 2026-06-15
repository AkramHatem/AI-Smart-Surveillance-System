import type { Metadata } from 'next'
import { UploadFlow } from '@/components/upload/UploadFlow'

export const metadata: Metadata = {
  title: 'Analyze Video',
}

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <UploadFlow />
    </div>
  )
}
