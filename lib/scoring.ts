import { SCENARIO_ORDER } from '@/lib/constants';
import { mean } from '@/lib/utils';
import type {
  County,
  JudgeWeights,
  MapMetric,
  ScenarioEvaluation,
  ScenarioId,
  ScenarioOutcome,
  SpatialIntelligence,
} from '@/types';

/** Turn raw 0-100 slider values into shares that sum to 1 (equal shares if all are zero). */
export function normalizeWeights(w: JudgeWeights): { water: number; soil: number; profit: number } {
  const total = w.water + w.soil + w.profit;
  if (total <= 0) return { water: 1 / 3, soil: 1 / 3, profit: 1 / 3 };
  return { water: w.water / total, soil: w.soil / total, profit: w.profit / total };
}

export function compositeScore(si: SpatialIntelligence, w: JudgeWeights): number {
  const n = normalizeWeights(w);
  return si.water * n.water + si.soil * n.soil + si.profit * n.profit;
}

export function passesGuardrail(outcome: ScenarioOutcome, w: JudgeWeights): boolean {
  return outcome.profitDeltaPct >= -w.profitFloorPct;
}

export function evaluateScenarios(
  county: County,
  w: JudgeWeights,
): Record<ScenarioId, ScenarioEvaluation> {
  const result = {} as Record<ScenarioId, ScenarioEvaluation>;
  for (const id of SCENARIO_ORDER) {
    const outcome = county.outcomes[id];
    result[id] = {
      outcome,
      composite: compositeScore(outcome.si, w),
      passesGuardrail: passesGuardrail(outcome, w),
    };
  }
  return result;
}

/** Highest-scoring scenario that respects the profit guardrail. R0 is always the fallback. */
export function recommendScenario(evals: Record<ScenarioId, ScenarioEvaluation>): ScenarioId {
  let best: ScenarioId = 'R0';
  for (const id of SCENARIO_ORDER) {
    if (evals[id].passesGuardrail && evals[id].composite > evals[best].composite) best = id;
  }
  return best;
}

export function metricValue(
  county: County,
  metric: MapMetric,
  scenarioId: ScenarioId,
  w: JudgeWeights,
): number {
  const outcome = county.outcomes[scenarioId];
  switch (metric) {
    case 'cornYield': {
      // Scale the county's observed 10-year mean by the scenario's yield ratio vs R0.
      const ratio = outcome.yieldBuAc / county.outcomes.R0.yieldBuAc;
      return mean(county.history.map((h) => h.cornYieldBuAc)) * ratio;
    }
    case 'composite':
      return compositeScore(outcome.si, w);
    case 'water':
      return outcome.si.water;
    case 'soil':
      return outcome.si.soil;
    case 'profit':
      return outcome.profitPerAcre;
  }
}
