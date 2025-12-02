import { Link } from '@tanstack/react-router'
import { AlertCircle, Home } from 'lucide-react'

export function EventNotFound() {
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center card-cute p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text-main mb-2">
          找不到活動
        </h1>
        <p className="text-text-muted mb-6">此活動代碼無效或活動已結束</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-heading font-bold hover:bg-primary-hover transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          <Home className="w-5 h-5" />
          <span>返回首頁</span>
        </Link>
      </div>
    </div>
  )
}
