'use client';

import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  className?: string;
}

export function RiskBadge({ severity, className }: RiskBadgeProps) {
  const styles = {
    HIGH: 'bg-red-100 text-red-800 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
    LOW: 'bg-blue-100 text-blue-800 border-blue-200',
    INFO: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles[severity],
        className
      )}
    >
      {severity}
    </span>
  );
}