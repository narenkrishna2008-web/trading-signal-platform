import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatusDotProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'live' | 'connecting' | 'stale' | 'offline' | 'bullish' | 'bearish' | 'neutral' | 'demo';
  pulse?: boolean;
}

export function StatusDot({ status, pulse = false, className, ...props }: StatusDotProps) {
  const colorMap = {
    live: 'bg-emerald-500',
    bullish: 'bg-emerald-500',
    connecting: 'bg-amber-500',
    stale: 'bg-amber-500',
    demo: 'bg-amber-400',
    offline: 'bg-red-500',
    bearish: 'bg-red-500',
    neutral: 'bg-slate-400',
  };

  return (
    <div className={cn('relative flex h-2.5 w-2.5', className)} {...props}>
      {pulse && (
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', colorMap[status])} />
      )}
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', colorMap[status])} />
    </div>
  );
}
