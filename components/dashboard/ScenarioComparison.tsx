import { Check, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SCENARIOS, SCENARIO_COLORS, SCENARIO_ORDER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ScenarioEvaluation, ScenarioId } from '@/types';

interface ScenarioComparisonProps {
  evaluations: Record<ScenarioId, ScenarioEvaluation>;
  selected: ScenarioId;
  recommended: ScenarioId;
  onSelect: (id: ScenarioId) => void;
}

export function ScenarioComparison({ evaluations, selected, recommended, onSelect }: ScenarioComparisonProps) {
  return (
    <div role="radiogroup" aria-label="Rotation scenario" className="space-y-2">
      {SCENARIO_ORDER.map((id) => {
        const ev = evaluations[id];
        const scenario = SCENARIOS[id];
        const active = id === selected;
        const delta = ev.outcome.profitDeltaPct;

        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(id)}
            className={cn(
              'block w-full rounded-md border px-3 py-2.5 text-left transition-colors',
              active ? 'border-wheat/60 bg-furrow' : 'border-line bg-loam/40 hover:bg-furrow/60',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: SCENARIO_COLORS[id] }} aria-hidden />
                <span className="truncate text-sm font-medium text-parchment">
                  {id} {scenario.name}
                </span>
              </span>
              <span className="flex shrink-0 gap-1">
                {id === recommended && (
                  <Badge tone="good"><Check className="size-3" aria-hidden /> Best fit</Badge>
                )}
                {!ev.passesGuardrail && (
                  <Badge tone="bad"><ShieldAlert className="size-3" aria-hidden /> Over profit limit</Badge>
                )}
              </span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-loam" aria-hidden>
              <div
                className="h-full rounded-full"
                style={{ width: `${ev.composite}%`, background: SCENARIO_COLORS[id], opacity: ev.passesGuardrail ? 1 : 0.4 }}
              />
            </div>

            <dl className="num mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-fog">Score</dt>
                <dd className="font-medium text-parchment">{ev.composite.toFixed(1)}</dd>
              </div>
              <div>
                <dt className="text-fog">Yield</dt>
                <dd className="font-medium text-parchment">{ev.outcome.yieldBuAc.toFixed(0)} bu/ac</dd>
              </div>
              <div>
                <dt className="text-fog">Return vs R0</dt>
                <dd className={cn('font-medium', id === 'R0' ? 'text-parchment' : delta < 0 ? 'text-clay' : 'text-sprout')}>
                  {id === 'R0' ? '$' + ev.outcome.profitPerAcre.toFixed(0) + '/ac' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}
                </dd>
              </div>
            </dl>
          </button>
        );
      })}
    </div>
  );
}
