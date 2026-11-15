'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_WEIGHTS } from '@/lib/constants';
import type { JudgeWeights } from '@/types';

export function useJudgeWeights() {
  const [weights, setWeights] = useState<JudgeWeights>(DEFAULT_WEIGHTS);

  const setWeight = useCallback(<K extends keyof JudgeWeights>(key: K, value: JudgeWeights[K]) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setWeights(DEFAULT_WEIGHTS), []);
  const isDefault = (Object.keys(DEFAULT_WEIGHTS) as (keyof JudgeWeights)[]).every(
    (k) => weights[k] === DEFAULT_WEIGHTS[k],
  );

  return { weights, setWeight, reset, isDefault };
}
