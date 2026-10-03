import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className = '', hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-5 shadow-sm ${
        hoverable ? 'hover:border-border-active hover:bg-surface-elevated/70 transition-all cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 pb-4 mb-4 border-b border-border/60 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-foreground-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
