import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SCENARIOS, SCENARIO_COLORS, SCENARIO_ORDER } from '@/lib/constants';
import { evaluateScenarios, recommendScenario } from '@/lib/scoring';
import { mean } from '@/lib/utils';
import type { County, JudgeWeights, ScenarioId } from '@/types';

export function StatewideSummary({ counties, weights }: { counties: County[]; weights: JudgeWeights }) {
  const tally: Record<ScenarioId, number> = { R0: 0, R1: 0, R2: 0, R3: 0 };
  for (const c of counties) tally[recommendScenario(evaluateScenarios(c, weights))]++;
  const avgCorn = mean(counties.map((c) => c.baseline.cornYieldBuAc));
  const avgReturn = mean(counties.map((c) => c.baseline.profitPerAcre));

  return (
    <Card>
      <CardHeader
        title="Statewide view"
        subtitle="Select a county on the map or in the list to see its history and scenarios."
      />
      <CardBody className="space-y-4">
        <dl className="num grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-fog">Average corn yield</dt>
            <dd className="text-xl font-semibold text-parchment">{avgCorn.toFixed(0)} <span className="text-xs font-normal text-fog">bu/ac</span></dd>
          </div>
          <div>
            <dt className="text-xs text-fog">Average baseline return</dt>
            <dd className="text-xl font-semibold text-parchment">${avgReturn.toFixed(0)} <span className="text-xs font-normal text-fog">/ac</span></dd>
          </div>
        </dl>

        <div>
          <p className="mb-2 text-sm text-parchment">Best-fit scenario across {counties.length} counties</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-loam" role="img"
            aria-label={SCENARIO_ORDER.map((id) => `${id}: ${tally[id]} counties`).join(', ')}>
            {SCENARIO_ORDER.map((id) => (
              <div key={id} style={{ width: `${(tally[id] / counties.length) * 100}%`, background: SCENARIO_COLORS[id] }} />
            ))}
          </div>
          <ul className="num mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {SCENARIO_ORDER.map((id) => (
              <li key={id} className="flex items-center gap-1.5 text-fog">
                <span className="size-2 rounded-full" style={{ background: SCENARIO_COLORS[id] }} aria-hidden />
                <span className="truncate">{id} {SCENARIOS[id].name}</span>
                <span className="ml-auto font-medium text-parchment">{tally[id]}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}
