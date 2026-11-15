'use client';

import { useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { County } from '@/types';

interface CountyRankingProps {
  counties: County[];
  values: Record<string, number>;
  domain: [number, number];
  formatValue: (v: number) => string;
  selectedFips: string | null;
  onSelect: (fips: string) => void;
}

export function CountyRanking({ counties, values, domain, formatValue, selectedFips, onSelect }: CountyRankingProps) {
  const [query, setQuery] = useState('');
  const [descending, setDescending] = useState(true);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return counties
      .filter((c) => c.name.toLowerCase().includes(q))
      .map((c) => ({ county: c, value: values[c.fips] ?? 0 }))
      .sort((a, b) => (descending ? b.value - a.value : a.value - b.value));
  }, [counties, values, query, descending]);

  const span = domain[1] - domain[0] || 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search counties</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fog" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 99 counties"
            className="w-full rounded-md border border-line bg-loam py-1.5 pl-8 pr-2 text-sm text-parchment placeholder:text-fog"
          />
        </label>
        <button
          type="button"
          onClick={() => setDescending((d) => !d)}
          aria-label={descending ? 'Sorted highest first. Sort lowest first' : 'Sorted lowest first. Sort highest first'}
          className="rounded-md border border-line bg-loam p-2 text-fog hover:text-parchment"
        >
          {descending ? <ArrowDownWideNarrow className="size-4" /> : <ArrowUpNarrowWide className="size-4" />}
        </button>
      </div>

      <ul className="mt-2 min-h-0 flex-1 space-y-px overflow-y-auto pr-1 max-lg:max-h-80">
        {rows.map(({ county, value }, i) => {
          const active = county.fips === selectedFips;
          return (
            <li key={county.fips}>
              <button
                type="button"
                onClick={() => onSelect(county.fips)}
                aria-current={active}
                className={cn(
                  'relative grid w-full grid-cols-[1.75rem_1fr_auto] items-center gap-2 overflow-hidden rounded px-2 py-1.5 text-left text-sm',
                  active ? 'bg-furrow text-parchment' : 'text-parchment/85 hover:bg-furrow/60',
                )}
              >
                <span className="num relative text-xs text-fog">{i + 1}</span>
                <span className="relative truncate">{county.name}</span>
                <span className="num relative text-xs text-wheat">{formatValue(value)}</span>
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 -z-0 bg-wheat/10"
                  style={{ width: `${((value - domain[0]) / span) * 100}%` }}
                />
              </button>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-fog">
            {counties.length === 0 ? 'Loading counties...' : `No county matches "${query}".`}
          </li>
        )}
      </ul>
    </div>
  );
}
