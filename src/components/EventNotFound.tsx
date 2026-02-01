/**
 * EventNotFound Component
 * Displayed when an event is not found or has ended
 * Playful Geometric Design System
 */

import { Link } from '@tanstack/react-router'
import { AlertCircle, Home } from 'lucide-react'
import { Circle, Square } from './decorations'

export function EventNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <Circle
        className="absolute w-64 h-64 bg-secondary/15 animate-float"
        style={{ top: '-5%', right: '-5%' }}
      />
      <Circle
        className="absolute w-48 h-48 bg-tertiary/15 animate-float"
        style={{ bottom: '10%', left: '-8%', animationDelay: '1s' }}
      />
      <Square
        className="absolute w-16 h-16 bg-accent/10 rotate-12"
        style={{ top: '20%', left: '10%' }}
      />

      <div className="max-w-md w-full text-center card-sticker p-8 animate-pop-in relative z-10">
        <div
          className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-secondary"
          style={{ boxShadow: '3px 3px 0px 0px #F472B6' }}
        >
          <AlertCircle className="w-8 h-8 text-secondary" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text-main mb-2">
          找不到活動
        </h1>
        <p className="text-text-muted mb-6">此活動代碼無效或活動已結束</p>
        <Link
          to="/"
          className="btn-candy inline-flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          <span>返回首頁</span>
        </Link>
      </div>
    </div>
  )
}
