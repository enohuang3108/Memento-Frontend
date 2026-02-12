/**
 * GeometricShapes Component
 * Floating geometric shapes for background decoration
 */

import type React from "react";

interface ShapeProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Circle shape */
export function Circle({ className = "", style }: ShapeProps) {
  return (
    <div
      className={`rounded-full ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/** Triangle shape (using CSS borders) */
export function Triangle({ className = "", style }: ShapeProps) {
  return (
    <div
      className={className}
      style={{
        width: 0,
        height: 0,
        borderLeft: "25px solid transparent",
        borderRight: "25px solid transparent",
        borderBottom: "43px solid currentColor",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/** Square shape */
export function Square({ className = "", style }: ShapeProps) {
  return <div className={`${className}`} style={style} aria-hidden="true" />;
}

/** Diamond shape (rotated square) */
export function Diamond({ className = "", style }: ShapeProps) {
  return (
    <div className={`rotate-45 ${className}`} style={style} aria-hidden="true" />
  );
}

/** Star shape using SVG */
export function Star({ className = "", style }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

interface GeometricBackgroundProps {
  variant?: "default" | "minimal" | "dense";
  className?: string;
}

/**
 * Pre-configured background with floating geometric shapes
 * Use this for quick decoration on pages
 */
export function GeometricBackground({
  variant = "default",
  className = "",
}: GeometricBackgroundProps) {
  if (variant === "minimal") {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      >
        {/* Large yellow circle - top right */}
        <Circle
          className="absolute w-64 h-64 bg-tertiary/20 animate-float"
          style={{ top: "-5%", right: "-5%" }}
        />
        {/* Pink circle - bottom left */}
        <Circle
          className="absolute w-48 h-48 bg-secondary/15"
          style={{ bottom: "10%", left: "-10%", animationDelay: "1s" }}
        />
      </div>
    );
  }

  if (variant === "dense") {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      >
        {/* Yellow circle - top right */}
        <Circle
          className="absolute w-80 h-80 bg-tertiary/25 animate-float"
          style={{ top: "-10%", right: "-10%" }}
        />
        {/* Pink circle - bottom left */}
        <Circle
          className="absolute w-64 h-64 bg-secondary/20 animate-float"
          style={{ bottom: "-5%", left: "-5%", animationDelay: "1.5s" }}
        />
        {/* Mint circle - center left */}
        <Circle
          className="absolute w-32 h-32 bg-quaternary/20 animate-float"
          style={{ top: "40%", left: "5%", animationDelay: "0.5s" }}
        />
        {/* Violet square - top left */}
        <Square
          className="absolute w-16 h-16 bg-accent/15 rotate-12"
          style={{ top: "15%", left: "10%" }}
        />
        {/* Yellow diamond - bottom right */}
        <Diamond
          className="absolute w-20 h-20 bg-tertiary/20"
          style={{ bottom: "20%", right: "15%" }}
        />
        {/* Small pink circles scattered */}
        <Circle
          className="absolute w-8 h-8 bg-secondary/30"
          style={{ top: "25%", right: "25%" }}
        />
        <Circle
          className="absolute w-6 h-6 bg-accent/25"
          style={{ bottom: "35%", left: "30%" }}
        />
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {/* Large yellow circle - top right */}
      <Circle
        className="absolute w-72 h-72 bg-tertiary/20 animate-float"
        style={{ top: "-8%", right: "-8%" }}
      />
      {/* Pink circle - bottom left */}
      <Circle
        className="absolute w-56 h-56 bg-secondary/15 animate-float"
        style={{ bottom: "5%", left: "-8%", animationDelay: "1.5s" }}
      />
      {/* Mint circle - center right */}
      <Circle
        className="absolute w-24 h-24 bg-quaternary/20 animate-float"
        style={{ top: "50%", right: "10%", animationDelay: "0.8s" }}
      />
      {/* Small violet square */}
      <Square
        className="absolute w-12 h-12 bg-accent/15 rotate-12"
        style={{ top: "20%", left: "15%" }}
      />
    </div>
  );
}
