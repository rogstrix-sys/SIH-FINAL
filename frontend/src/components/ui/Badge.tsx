import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'safety' | 'success' | 'warning' | 'danger' | 'slate' | 'cyan';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = ''
}) => {
  const variantStyles = {
    safety: 'bg-safety-500/15 text-safety-400 border-safety-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
  }[variant];

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider',
    md: 'text-xs px-2.5 py-1 tracking-wider'
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold uppercase rounded border ${variantStyles} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};
