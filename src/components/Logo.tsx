import { Link } from '@tanstack/react-router'

export function Logo() {
  return (
    <div className="fixed top-6 left-6 z-50">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img src="/favicon.webp" alt="Logo" className="w-6 h-6" />
        <h1 className="hidden md:block text-2xl font-heading font-bold text-text-main tracking-tight">
          Memento
        </h1>
      </Link>
    </div>
  )
}
