import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  icon,
  headerAction,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = ''
}) => {
  return (
    <section
      className={`bg-graphite-900 border border-slate-800/80 rounded-xl shadow-lg shadow-black/20 overflow-hidden flex flex-col ${className}`}
    >
      {(title || headerAction) && (
        <div
          className={`px-4 py-3 border-b border-slate-800/70 bg-graphite-950/40 flex items-center justify-between gap-3 ${headerClassName}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <span className="text-safety-500 shrink-0">{icon}</span>}
            <div className="min-w-0">
              {title && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 truncate">
                  {title}
                </h3>
              )}
              {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={`p-4 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
};
