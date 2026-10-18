import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-graphite-950 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-3.5 py-2 gap-2',
    lg: 'text-sm px-4 py-2.5 gap-2.5'
  }[size];

  const variantStyles = {
    primary:
      'bg-safety-500 hover:bg-safety-600 active:bg-safety-700 text-white shadow-md shadow-safety-glow border border-safety-400/40 focus:ring-safety-500 font-semibold',
    secondary:
      'bg-graphite-850 hover:bg-graphite-800 text-slate-200 border border-slate-700/70 hover:border-slate-600 focus:ring-slate-500 shadow-sm',
    danger:
      'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 focus:ring-rose-500',
    ghost:
      'bg-transparent hover:bg-graphite-800 text-slate-300 hover:text-white border border-transparent focus:ring-slate-500',
    outline:
      'bg-transparent hover:bg-graphite-850 text-slate-300 border border-slate-700 hover:border-slate-500 focus:ring-slate-500'
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
