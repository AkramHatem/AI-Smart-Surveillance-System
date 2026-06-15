'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Shield, UploadCloud, LayoutDashboard } from 'lucide-react'

const NAV = [
  { href: '/upload', label: 'Analyze Video', icon: UploadCloud },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/upload"
          className="flex items-center gap-2.5 group"
        >
          <div className="relative w-7 h-7 rounded flex items-center justify-center bg-accent/10 border border-accent/30 group-hover:border-accent/60 transition-colors">
            <Shield className="w-4 h-4 text-accent" />
            <span className="absolute inset-0 rounded bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span
            className="text-sm font-semibold tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Surveillance<span className="text-accent">AI</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors',
                  active
                    ? 'text-accent bg-accent/10'
                    : 'text-surface-muted hover:text-white hover:bg-surface-raised'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
