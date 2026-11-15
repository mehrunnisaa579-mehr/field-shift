import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'bg-furrow text-fog',
  good: 'bg-sprout/15 text-sprout',
  warn: 'bg-wheat/15 text-wheat',
  bad: 'bg-clay/20 text-clay',
  info: 'bg-sky/15 text-sky',
} as const;

export function Badge({ tone = 'neutral', children, className }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  );
}
