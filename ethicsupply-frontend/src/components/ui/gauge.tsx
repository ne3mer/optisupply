import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

// Types for the Gauge component
export interface GaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: "sm" | "md" | "lg";
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
}

// Types for the GaugeNeedle component
interface GaugeNeedleProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  color?: string;
  baseRadius?: number;
}

// Types for the GaugeValue component
interface GaugeValueProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  showPercent?: boolean;
}

// Gauge component
export const Gauge = forwardRef<HTMLDivElement, GaugeProps>(
  (
    {
      value,
      children,
      size = "md",
      gaugePrimaryColor = "#6366F1", // Default: Indigo
      gaugeSecondaryColor = "rgba(100, 116, 139, 0.2)", // Default: Slate 400 with opacity
      className,
      ...props
    },
    ref
  ) => {
    // Calculate size based on prop
    const gaugeSize = {
      sm: "w-24 h-24",
      md: "w-32 h-32",
      lg: "w-48 h-48",
    }[size];

    // Normalize value between 0 and 100
    const normalizedValue = Math.max(0, Math.min(100, value));

    // Calculate rotation angle for the colored arc (180 degrees = half circle)
    const arcAngle = (normalizedValue / 100) * 180;

    // Automatically pass 'value' prop to GaugeNeedle and GaugeValue children
    const childrenWithProps = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === GaugeNeedle || child.type === GaugeValue) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value: normalizedValue,
          });
        }
      }
      return child;
    });

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center",
          gaugeSize,
          className
        )}
        {...props}
      >
        {/* Background track (gray) */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `conic-gradient(
              ${gaugeSecondaryColor} 0deg,
              ${gaugeSecondaryColor} 180deg,
              transparent 180deg,
              transparent 360deg
            )`,
            borderRadius: "50%",
            transform: "rotate(-90deg)",
          }}
        />

        {/* Value track (colored) */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: `conic-gradient(
              ${gaugePrimaryColor} 0deg,
              ${gaugePrimaryColor} ${arcAngle}deg,
              transparent ${arcAngle}deg,
              transparent 360deg
            )`,
            borderRadius: "50%",
            transform: "rotate(-90deg)",
          }}
        />

        {/* Inner white circle */}
        <div
          className="absolute z-20 bg-white dark:bg-gray-900 rounded-full"
          style={{
            width: "70%",
            height: "70%",
          }}
        />

        {/* Content container (for needle and value) */}
        <div className="relative z-30 flex flex-col items-center justify-center">
          {/* Render children with the injected value prop */}
          {childrenWithProps}
        </div>
      </div>
    );
  }
);

Gauge.displayName = "Gauge";

// Gauge Circle component (just a circle with a border)
export const GaugeCircle = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "w-4 h-4 rounded-full border-2 border-slate-400 dark:border-slate-500 bg-white dark:bg-gray-800",
        className
      )}
      {...props}
    />
  );
});

GaugeCircle.displayName = "GaugeCircle";

// Gauge Needle component
export const GaugeNeedle = forwardRef<HTMLDivElement, GaugeNeedleProps>(
  ({ className, value, color = "#EF4444", baseRadius = 4, ...props }, ref) => {
    const normalizedValue = Math.max(0, Math.min(100, value ?? 0));
    return (
      <div
        className="absolute flex items-center justify-center w-full h-full"
        ref={ref}
        {...props}
      >
        <div
          className={cn("absolute transform -translate-y-1/2", className)}
          style={{
            height: "40%",
            width: "2px",
            backgroundColor: color,
            transformOrigin: "bottom center",
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            // Value / 100 * 180 degrees (half circle) then adjust -90 degrees to start from bottom
            transform: `rotate(${(normalizedValue / 100) * 180 - 90}deg)`,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: `${baseRadius * 2}px`,
            height: `${baseRadius * 2}px`,
            backgroundColor: color,
          }}
        />
      </div>
    );
  }
);

GaugeNeedle.displayName = "GaugeNeedle";

// Gauge Value component
export const GaugeValue = forwardRef<HTMLDivElement, GaugeValueProps>(
  ({ className, value, showPercent = false, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("text-center pt-4", className)} {...props}>
        {showPercent ? `${Math.round(value)}%` : Math.round(value)}
      </div>
    );
  }
);

GaugeValue.displayName = "GaugeValue";
