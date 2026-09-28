import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
        bullish: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20',
        bearish: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
        warning: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
        info: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
        neutral: 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20',
        outline: 'text-slate-100 border border-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
