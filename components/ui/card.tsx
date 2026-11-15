import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn('rounded-lg border border-line bg-canopy/70', className)}>{children}</section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex items-start justify-between gap-3 px-4 pt-3.5', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-parchment">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-fog">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-4 pb-4 pt-3', className)}>{children}</div>;
}
