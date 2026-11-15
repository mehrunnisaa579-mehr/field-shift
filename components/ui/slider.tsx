'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Text shown on the right, e.g. "40% share". */
  display: string;
  onChange: (value: number) => void;
  className?: string;
}

export function Slider({ label, hint, value, min = 0, max = 100, step = 1, display, onChange, className }: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm text-parchment">{label}</label>
        <span className="num text-sm font-medium text-wheat">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range"
        style={{ ['--fill' as string]: `${pct}%` }}
      />
      {hint && <p className="text-xs text-fog">{hint}</p>}
    </div>
  );
}
