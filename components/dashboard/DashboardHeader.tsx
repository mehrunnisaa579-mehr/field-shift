import { Badge } from '@/components/ui/badge';

export function DashboardHeader({ dataSource }: { dataSource?: 'synthetic-demo' | 'pipeline' }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line bg-canopy px-4 py-2.5">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-xl text-parchment">Field Shift</h1>
        <p className="hidden text-sm text-fog sm:block">Adapting farms across Iowa's 99 counties</p>
      </div>
      <div className="flex items-center gap-2">
        {dataSource === 'synthetic-demo' && (
          <Badge tone="warn" className="whitespace-nowrap">Demo scores: replace with pipeline output</Badge>
        )}
        <Badge tone="info" className="hidden whitespace-nowrap md:inline-flex">NASA Space Apps 2026</Badge>
      </div>
    </header>
  );
}
