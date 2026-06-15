import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: {
    template: '%s — SurveillanceAI',
    default: 'SurveillanceAI — Intelligent Incident Detection',
  },
  description:
    'AI-powered surveillance system for automated fire, accident, and violence detection with instant authority notifications.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="grain">
      <body className="min-h-screen bg-surface flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
