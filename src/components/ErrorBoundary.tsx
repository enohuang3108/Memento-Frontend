/**
 * Error Boundary Component
 * Catches and displays React errors gracefully
 * Playful Geometric Design System
 */

import type React from 'react'
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center card-sticker p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-heading font-bold text-text-main mb-2">發生錯誤</h1>
            <p className="text-text-muted mb-6">
              抱歉,應用程式遇到了一個錯誤。請重新整理頁面後再試一次。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-candy"
            >
              重新整理頁面
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-accent hover:text-primary-hover font-bold">
                  技術細節
                </summary>
                <pre className="mt-2 text-xs text-text-muted bg-muted p-4 rounded-xl overflow-auto border-2 border-border">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
