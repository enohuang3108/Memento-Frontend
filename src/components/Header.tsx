/**
 * Header Component
 * Navigation header with side menu
 * Playful Geometric Design System
 */

import { Link } from '@tanstack/react-router'
import { Home, Menu, QrCode, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header
        className="p-4 flex items-center bg-background/90 backdrop-blur-sm sticky top-0 z-40 border-b-2 border-foreground"
        style={{ boxShadow: '0 4px 0 0 #1E293B' }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-text-main hover:bg-muted rounded-xl transition-colors border-2 border-transparent hover:border-border"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-4 text-xl font-heading font-bold text-text-main tracking-tight">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-accent hover:text-primary-hover transition-colors">
              Memento
            </span>
          </Link>
        </h1>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-background text-text-main z-50 transform transition-transform duration-300 ease-out flex flex-col border-r-2 border-foreground ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ boxShadow: isOpen ? '4px 0 0 0 #1E293B' : 'none' }}
      >
        <div className="flex items-center justify-between p-6 border-b-2 border-border">
          <h2 className="text-xl font-heading font-bold text-accent">
            Navigation
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-muted rounded-xl transition-colors text-text-muted border-2 border-transparent hover:border-border"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all duration-200 font-body font-bold text-base group text-text-muted border-2 border-transparent hover:border-border"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-xl bg-accent/10 text-accent transition-all duration-200 font-body font-bold text-base border-2 border-accent/30',
            }}
          >
            <Home
              size={20}
              className="group-hover:text-accent transition-colors"
            />
            <span>Home</span>
          </Link>

          <div className="mt-8 p-5 bg-tertiary/10 rounded-xl border-2 border-tertiary/30">
            <div className="flex items-center gap-3 mb-2 text-text-main">
              <QrCode size={20} className="text-tertiary" />
              <span className="font-heading font-bold text-base">快速加入</span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              掃描 QR Code 或輸入活動代碼加入活動
            </p>
          </div>
        </nav>
      </aside>
    </>
  )
}
