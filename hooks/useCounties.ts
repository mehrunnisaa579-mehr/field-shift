'use client';

import { useEffect, useState } from 'react';
import type { CountiesResponse } from '@/types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: CountiesResponse };

export function useCounties(): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/counties', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Counties request failed (${res.status})`);
        return res.json() as Promise<CountiesResponse>;
      })
      .then((data) => setState({ status: 'ready', data }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not load counties' });
      });
    return () => controller.abort();
  }, []);

  return state;
}
