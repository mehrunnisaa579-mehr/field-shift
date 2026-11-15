'use client';

import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
  /** Optional accent colour dot. */
  color?: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({ label, options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-1 rounded-md bg-loam p-1', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-furrow text-parchment shadow-sm' : 'text-fog hover:text-parchment',
            )}
          >
            {o.color && <span className="size-2 rounded-full" style={{ background: o.color }} aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
