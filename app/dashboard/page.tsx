'use client';

import { useMemo, useState } from 'react';
import { InteractiveMap } from '@/components/InteractiveMap';
import { MapLegend } from '@/components/MapLegend';
import { CountyPanel } from '@/components/dashboard/CountyPanel';
import { CountyRanking } from '@/components/dashboard/CountyRanking';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { JudgeWeights } from '@/components/dashboard/JudgeWeights';
import { StatewideSummary } from '@/components/dashboard/StatewideSummary';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useCounties } from '@/hooks/useCounties';
import { useJudgeWeights } from '@/hooks/useJudgeWeights';
import { METRICS, METRIC_ORDER, SCENARIOS, SCENARIO_COLORS, SCENARIO_ORDER } from '@/lib/constants';
import { metricValue } from '@/lib/scoring';
import type { County, MapMetric, ScenarioId } from '@/types';

const NO_COUNTIES: County[] = [];

export default function DashboardPage() {
  const state = useCounties();
  const { weights, setWeight, reset, isDefault } = useJudgeWeights();

  const [metric, setMetric] = useState<MapMetric>('composite');
  const [scenarioId, setScenarioId] = useState<ScenarioId>('R2');
  const [selectedFips, setSelectedFips] = useState<string | null>(null);

  const counties = state.status === 'ready' ? state.data.counties : NO_COUNTIES;
  const metricConfig = METRICS[metric];

  const values = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of counties) out[c.fips] = metricValue(c, metric, scenarioId, weights);
    return out;
  }, [counties, metric, scenarioId, weights]);

  // One colour scale across all four scenarios so switching scenario visibly changes the map.
  const domain = useMemo<[number, number]>(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const c of counties) {
      for (const id of SCENARIO_ORDER) {
        const v = metricValue(c, metric, id, weights);
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    return Number.isFinite(min) ? [Math.floor(min), Math.ceil(max)] : [0, 100];
  }, [counties, metric, weights]);

  const selectedCounty = useMemo(
    () => counties.find((c) => c.fips === selectedFips) ?? null,
    [counties, selectedFips],
  );

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <DashboardHeader dataSource={state.status === 'ready' ? state.data.dataSource : undefined} />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)_27rem]">
        {/* Left: map controls and county ranking */}
        <aside className="flex min-h-0 flex-col gap-4 border-line p-4 lg:border-r">
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-sm font-medium text-parchment">Color the map by</p>
              <SegmentedControl
                label="Map metric"
                value={metric}
                onChange={setMetric}
                options={METRIC_ORDER.map((m) => ({ value: m, label: METRICS[m].label }))}
              />
              <p className="mt-1.5 text-xs text-fog">{metricConfig.description}</p>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-parchment">Scenario</p>
              <SegmentedControl
                label="Rotation scenario"
                value={scenarioId}
                onChange={setScenarioId}
                options={SCENARIO_ORDER.map((id) => ({ value: id, label: id, color: SCENARIO_COLORS[id] }))}
              />
              <p className="mt-1.5 text-xs text-fog">{SCENARIOS[scenarioId].name}</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <p className="mb-1.5 text-sm font-medium text-parchment">Counties ranked by {metricConfig.label.toLowerCase()}</p>
            <CountyRanking
              counties={counties}
              values={values}
              domain={domain}
              formatValue={metricConfig.format}
              selectedFips={selectedFips}
              onSelect={setSelectedFips}
            />
          </div>
        </aside>

        {/* Centre: map */}
        <main className="relative order-first h-[60dvh] min-h-0 lg:order-none lg:h-auto">
          {state.status === 'error' ? (
            <div role="alert" className="grid h-full place-items-center px-6 text-center text-sm text-clay">
              {state.message}. Reload the page to try again.
            </div>
          ) : (
            <>
              <InteractiveMap
                className="absolute inset-0"
                geojsonUrl="/data/iowa-counties.geojson"
                values={values}
                domain={domain}
                palette={metricConfig.palette}
                metricLabel={`${metricConfig.label} (${scenarioId})`}
                formatValue={metricConfig.format}
                selectedFips={selectedFips}
                onSelect={setSelectedFips}
              />
              <div className="pointer-events-none absolute right-3 top-3">
                <MapLegend
                  label={`${metricConfig.label}, ${scenarioId} ${SCENARIOS[scenarioId].name}`}
                  domain={domain}
                  palette={metricConfig.palette}
                  formatValue={metricConfig.format}
                />
              </div>
              {state.status === 'loading' && (
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-canopy/90 px-3 py-1.5 text-xs text-fog">
                  Loading county data...
                </p>
              )}
            </>
          )}
        </main>

        {/* Right: judge controls + county detail */}
        <aside className="min-h-0 space-y-4 border-line p-4 lg:overflow-y-auto lg:border-l">
          <JudgeWeights weights={weights} isDefault={isDefault} onChange={setWeight} onReset={reset} />
          {selectedCounty ? (
            <CountyPanel
              key={selectedCounty.fips}
              county={selectedCounty}
              weights={weights}
              scenarioId={scenarioId}
              onScenarioChange={setScenarioId}
              onClose={() => setSelectedFips(null)}
            />
          ) : (
            counties.length > 0 && <StatewideSummary counties={counties} weights={weights} />
          )}
        </aside>
      </div>
    </div>
  );
}
