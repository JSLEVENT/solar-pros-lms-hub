import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressRingProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  strokeWidth?: number
  showValue?: boolean
  animated?: boolean
  gradient?: boolean
}

const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  ({ 
    className, 
    value = 0, 
    size = 'md', 
    strokeWidth, 
    showValue = true, 
    animated = true,
    gradient = true,
    ...props 
  }, ref) => {
    const sizes = {
      sm: { radius: 36, stroke: strokeWidth || 6, text: 'text-xs' },
      md: { radius: 54, stroke: strokeWidth || 8, text: 'text-sm' },
      lg: { radius: 72, stroke: strokeWidth || 10, text: 'text-base' },
      xl: { radius: 90, stroke: strokeWidth || 12, text: 'text-lg' }
    }

    const { radius, stroke, text } = sizes[size]
    const normalizedRadius = radius - stroke * 2
    const circumference = normalizedRadius * 2 * Math.PI
    const strokeDasharray = `${circumference} ${circumference}`
    const strokeDashoffset = circumference - (value / 100) * circumference

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        {...props}
      >
        <svg
          height={radius * 2}
          width={radius * 2}
          className={cn(
            "transform -rotate-90",
            animated && "transition-all duration-1000 ease-out"
          )}
        >
          {/* Background circle */}
          <circle
            stroke="hsl(var(--muted))"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            opacity={0.2}
          />
          
          {/* Progress circle */}
          <circle
            stroke={gradient ? "url(#progressGradient)" : "hsl(var(--primary))"}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={cn(
              "transition-all duration-1000 ease-out",
              "drop-shadow-sm"
            )}
          />
          
          {gradient && (
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--solar-red))" />
                <stop offset="50%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--solar-glow))" />
              </linearGradient>
            </defs>
          )}
        </svg>
        
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("font-semibold text-foreground", text)}>
              {Math.round(value)}%
            </span>
          </div>
        )}
      </div>
    )
  }
)

ProgressRing.displayName = "ProgressRing"

export { ProgressRing }