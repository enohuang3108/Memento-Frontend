/**
 * DotPattern Component
 * Decorative dot grid background pattern
 */

interface DotPatternProps {
  /** Color of the dots (CSS color value) */
  color?: string
  /** Size of each dot in pixels */
  dotSize?: number
  /** Spacing between dots in pixels */
  spacing?: number
  /** Opacity of the pattern (0-1) */
  opacity?: number
  /** Additional CSS classes */
  className?: string
}

export function DotPattern({
  color = '#8B5CF6',
  dotSize = 2,
  spacing = 24,
  opacity = 0.15,
  className = '',
}: DotPatternProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(${color} ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${spacing}px ${spacing}px`,
        opacity,
      }}
      aria-hidden="true"
    />
  )
}

/**
 * Preset: Yellow dots (warm, playful)
 */
export function DotPatternYellow(props: Omit<DotPatternProps, 'color'>) {
  return <DotPattern color="#FBBF24" {...props} />
}

/**
 * Preset: Pink dots (fun, energetic)
 */
export function DotPatternPink(props: Omit<DotPatternProps, 'color'>) {
  return <DotPattern color="#F472B6" {...props} />
}

/**
 * Preset: Violet dots (primary brand color)
 */
export function DotPatternViolet(props: Omit<DotPatternProps, 'color'>) {
  return <DotPattern color="#8B5CF6" {...props} />
}

/**
 * Preset: Subtle gray dots (for content areas)
 */
export function DotPatternSubtle(props: Omit<DotPatternProps, 'color'>) {
  const { opacity = 0.08, ...rest } = props
  return <DotPattern color="#94A3B8" opacity={opacity} {...rest} />
}
