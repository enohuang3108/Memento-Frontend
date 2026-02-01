/**
 * SquiggleDivider Component
 * SVG wavy line divider for section separation
 */

interface SquiggleDividerProps {
  /** Color of the squiggle line */
  color?: string
  /** Width of the line */
  strokeWidth?: number
  /** Height of the SVG */
  height?: number
  /** Additional CSS classes */
  className?: string
  /** Vertical or horizontal orientation */
  orientation?: 'horizontal' | 'vertical'
}

export function SquiggleDivider({
  color = '#F472B6',
  strokeWidth = 3,
  height = 20,
  className = '',
  orientation = 'horizontal',
}: SquiggleDividerProps) {
  if (orientation === 'vertical') {
    return (
      <svg
        viewBox="0 0 20 100"
        fill="none"
        className={`h-full w-5 ${className}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M10 0 Q0 12.5, 10 25 Q20 37.5, 10 50 Q0 62.5, 10 75 Q20 87.5, 10 100"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 200 20"
      fill="none"
      className={`w-full ${className}`}
      style={{ height }}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 10 Q25 0, 50 10 Q75 20, 100 10 Q125 0, 150 10 Q175 20, 200 10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/**
 * Underline squiggle for text decoration
 */
interface SquiggleUnderlineProps {
  /** Color of the squiggle */
  color?: string
  /** Additional CSS classes */
  className?: string
}

export function SquiggleUnderline({
  color = '#FBBF24',
  className = '',
}: SquiggleUnderlineProps) {
  return (
    <svg
      viewBox="0 0 120 8"
      fill="none"
      className={`w-full h-2 ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 4 Q15 0, 30 4 Q45 8, 60 4 Q75 0, 90 4 Q105 8, 120 4"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/**
 * Decorative section divider with playful wave
 */
export function WaveDivider({
  color = '#8B5CF6',
  className = '',
}: SquiggleUnderlineProps) {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1200 40"
        fill="none"
        className="w-full h-10"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 20 Q100 0, 200 20 Q300 40, 400 20 Q500 0, 600 20 Q700 40, 800 20 Q900 0, 1000 20 Q1100 40, 1200 20"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          opacity={0.3}
        />
      </svg>
    </div>
  )
}
