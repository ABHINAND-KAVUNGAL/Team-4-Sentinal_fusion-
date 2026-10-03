import React from 'react';

interface StatusDotProps {
  status: 'online' | 'busy' | 'offline' | 'warning' | string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function StatusDot({ status, size = 'sm', pulse = false }: StatusDotProps) {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  
  let colorClass = 'bg-slate-500';
  if (status === 'online' || status === 'OPERATIONAL' || status === 'AVAILABLE' || status === 'COMPLETE' || status === 'CONFIRMED') {
    colorClass = 'bg-emerald-500';
  } else if (status === 'warning' || status === 'PROCESSING' || status === 'REVIEW' || status === 'MODERATE') {
    colorClass = 'bg-amber-500';
  } else if (status === 'offline' || status === 'FAILED' || status === 'ERROR' || status === 'CRITICAL') {
    colorClass = 'bg-rose-500';
  } else if (status === 'DEMO_MODE' || status === 'NEW') {
    colorClass = 'bg-blue-500';
  }

  return (
    <span className="relative flex shrink-0">
      {pulse && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClass}`}
        />
      )}
      <span className={`relative inline-flex rounded-full ${sizeClass} ${colorClass}`} />
    </span>
  );
}
