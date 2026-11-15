'use client';

import { useEffect, useState } from 'react';
import type { ClimateResponse, ClimateYear } from '@/types';

export type NasaClimateState =
  | { status: 'idle' | 'loading' | 'unavailable' }
  | { status: 'live'; years: ClimateYear[] };

/** Fetches live NASA POWER annual climate for a county; callers fall back to bundled data if unavailable. */
export function useNasaClimate(fips: string | null): NasaClimateState {
  const [state, setState] = useState<{ fips: string; value: NasaClimateState } | null>(null);

  useEffect(() => {
    if (!fips) return;
    const controller = new AbortController();
    fetch(`/api/climate/${fips}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('unavailable');
        return res.json() as Promise<ClimateResponse>;
      })
      .then((body) => {
        if (body.years.length === 0) throw new Error('empty');
        setState({ fips, value: { status: 'live', years: body.years } });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ fips, value: { status: 'unavailable' } });
      });
    return () => controller.abort();
  }, [fips]);

  if (!fips) return { status: 'idle' };
  if (state?.fips !== fips) return { status: 'loading' };
  return state.value;
}
