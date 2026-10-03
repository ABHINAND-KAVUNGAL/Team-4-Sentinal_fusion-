import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const sizeMap = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const variantMap = {
    primary:
      'bg-blue-600 hover:bg-blue-500 text-white font-medium border border-blue-500/50 shadow-sm transition-colors',
    secondary:
      'bg-surface-elevated hover:bg-surface-hover text-slate-200 border border-border transition-colors',
    danger:
      'bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 transition-colors',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent transition-colors',
    outline:
      'bg-transparent hover:bg-slate-800/40 text-slate-300 border border-slate-700 transition-colors',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-sans transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeMap[size]} ${variantMap[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : icon}
      {children}
    </button>
  );
}
