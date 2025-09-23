import React from "react";

type MetricCardProps = {
  title: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  minHeight?: number; // in px
  empty?: boolean;
  emptyContent?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  description,
  icon: Icon,
  actions,
  children,
  minHeight = 320,
  empty = false,
  emptyContent,
  className = "",
  style,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border backdrop-blur-md p-5 ${className}`}
      style={style}
    >
      <div className="relative z-10 h-full flex flex-col" style={{ minHeight }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            {Icon && (
              <div className="p-2 rounded-lg mr-3 opacity-90" style={{ background: "rgba(0,0,0,0.2)" }}>
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {description && (
                <p className="text-xs mt-0.5 opacity-70">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="ml-4 flex-shrink-0">{actions}</div>}
        </div>
        <div className="flex-grow h-full">
          {empty ? (
            <div className="w-full h-full flex items-center justify-center text-center">
              <div className="max-w-sm">
                {emptyContent || (
                  <p className="text-sm opacity-70">No data available.</p>
                )}
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
