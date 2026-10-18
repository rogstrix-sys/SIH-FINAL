import React from 'react';
import { getStatusColor } from '../../utils/units';

export interface StatusIndicatorProps {
  status: string;
  label?: string;
  showDot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showDot = true,
  pulse = true,
  size = 'md',
  className = ''
}) => {
  const colors = getStatusColor(status);
  const isRunning = status.toLowerCase() === 'running';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2'
  }[size];

  return (
    <div
      role="status"
      aria-label={`Status: ${label || status}`}
      className={`inline-flex items-center font-mono font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {pulse && isRunning && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`} />
        </span>
      )}
      <span className="uppercase tracking-wider">{label || status}</span>
    </div>
  );
};
