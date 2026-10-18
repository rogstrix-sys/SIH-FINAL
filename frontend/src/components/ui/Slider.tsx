import React from 'react';

export interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
  description?: string;
  dangerThreshold?: number;
}

export const Slider: React.FC<SliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
  description,
  dangerThreshold
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isDanger = dangerThreshold !== undefined && value >= dangerThreshold;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="font-medium text-slate-300 flex items-center gap-1.5">
          {label}
        </label>
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onChange(Math.min(max, Math.max(min, val)));
              }
            }}
            aria-label={`${label} numeric input`}
            style={{
              backgroundColor: isDanger ? '#4c0519' : '#0b0f17',
              color: isDanger ? '#fda4af' : '#fb923c',
              borderColor: isDanger ? '#be123c' : '#334155'
            }}
            className={`w-16 px-1.5 py-0.5 rounded border text-right font-mono text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-safety-500 disabled:opacity-40 disabled:cursor-not-allowed appearance-none ${
              isDanger
                ? 'bg-rose-950/80 text-rose-300 border-rose-700/60 font-semibold'
                : 'bg-graphite-950 text-safety-400 border-slate-700 hover:border-slate-600'
            }`}
          />
          {unit && <span className="text-slate-400 text-[11px] font-mono">{unit}</span>}
        </div>
      </div>

      {description && <p className="text-[11px] text-slate-500 leading-tight">{description}</p>}

      <div className="relative flex items-center">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
          className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-safety-500 disabled:opacity-40 disabled:cursor-not-allowed ${
            isDanger ? 'bg-rose-950' : 'bg-graphite-950 border border-slate-800'
          }`}
          style={{
            background: `linear-gradient(to right, ${
              isDanger ? '#e11d48' : '#f97316'
            } 0%, ${isDanger ? '#e11d48' : '#f97316'} ${percentage}%, #1e293b ${percentage}%, #1e293b 100%)`
          }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
};
