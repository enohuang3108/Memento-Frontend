import { Link } from '@tanstack/react-router'

import { Home, Menu, QrCode, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="p-4 flex items-center bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-sm">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-text-main hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-4 text-xl font-heading font-bold text-text-main tracking-tight">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-primary hover:text-primary-hover transition-colors">
              Memento
            </span>
          </Link>
        </h1>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white text-text-main shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-heading font-bold text-primary">
            Navigation
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-text-muted"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-all duration-200 font-body font-medium text-base group text-slate-600"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-primary/5 text-primary transition-all duration-200 font-body font-semibold text-base',
            }}
          >
            <Home
              size={20}
              className="group-hover:text-primary transition-colors"
            />
            <span>Home</span>
          </Link>

          <div className="mt-8 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2 text-text-main">
              <QrCode size={20} className="text-primary" />
              <span className="font-heading font-semibold text-base">快速加入</span>
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
