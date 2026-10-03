import React from 'react';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'outline' | 'demo';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', className = '', size = 'sm' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantMap: Record<Variant, string> = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700/60',
    primary: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    outline: 'bg-transparent text-slate-400 border border-slate-800',
    demo: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-mono ${sizeClasses} ${variantMap[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
