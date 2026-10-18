import React from 'react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    neutral?: boolean;
  };
  progress?: {
    current: number;
    max: number;
    dangerThreshold?: number;
  };
  status?: 'nominal' | 'warning' | 'alert' | 'neutral';
  tooltip?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  icon,
  trend,
  progress,
  status = 'neutral',
  tooltip,
  className = ''
}) => {
  const statusBorder = {
    nominal: 'border-slate-800 hover:border-emerald-500/40',
    warning: 'border-amber-600/50 bg-amber-950/10',
    alert: 'border-rose-600/60 bg-rose-950/20 shadow-rose-900/10',
    neutral: 'border-slate-800 hover:border-slate-700'
  }[status];

  const valueColor = {
    nominal: 'text-emerald-400',
    warning: 'text-amber-400',
    alert: 'text-rose-400',
    neutral: 'text-slate-100'
  }[status];

  return (
    <div
      title={tooltip}
      className={`bg-graphite-900 border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 shadow-md ${statusBorder} ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="font-medium tracking-wide uppercase text-[11px] truncate">{label}</span>
        {icon && <span className="text-slate-400 shrink-0 ml-1.5">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5 my-0.5">
        <span className={`text-2xl font-bold font-mono tracking-tight ${valueColor}`}>
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>

      {progress && (
        <div className="w-full mt-2.5">
          <div className="h-1.5 w-full bg-graphite-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                status === 'alert'
                  ? 'bg-rose-500'
                  : status === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-safety-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, (progress.current / progress.max) * 100))}%`
              }}
            />
          </div>
        </div>
      )}

      {trend && (
        <div className="flex items-center gap-1 mt-2 text-[10px] font-mono">
          <span
            className={`${
              trend.neutral
                ? 'text-slate-400'
                : trend.isPositive
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-500">vs nominal</span>
        </div>
      )}
    </div>
  );
};
