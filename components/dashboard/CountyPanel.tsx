'use client';

import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { HistoricalCharts } from '@/components/dashboard/HistoricalCharts';
import { ScenarioComparison } from '@/components/dashboard/ScenarioComparison';
import { SpatialIntelligenceRadar } from '@/components/dashboard/SpatialIntelligenceRadar';
import { useNasaClimate } from '@/hooks/useNasaClimate';
import { SCENARIOS } from '@/lib/constants';
import { evaluateScenarios, recommendScenario } from '@/lib/scoring';
import type { County, HistoricalYear, JudgeWeights, ScenarioId } from '@/types';

interface CountyPanelProps {
  county: County;
  weights: JudgeWeights;
  scenarioId: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  onClose: () => void;
}

export function CountyPanel({ county, weights, scenarioId, onScenarioChange, onClose }: CountyPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const evaluations = useMemo(() => evaluateScenarios(county, weights), [county, weights]);

  // Bring the detail into view when a county is picked (the panel sits below the judge sliders).
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rootRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, []);
  const recommended = recommendScenario(evaluations);

  // Overlay live NASA POWER climate onto the bundled history when it is available.
  const nasa = useNasaClimate(county.fips);
  const history: HistoricalYear[] = useMemo(() => {
    if (nasa.status !== 'live') return county.history;
    const byYear = new Map(nasa.years.map((y) => [y.year, y]));
    return county.history.map((h) => ({ ...h, ...(byYear.get(h.year) ?? {}) }));
  }, [county.history, nasa]);

  return (
    <div ref={rootRef} className="scroll-mt-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl leading-none text-parchment">{county.name} County</h2>
          <p className="mt-1.5 text-xs text-fog">
            FIPS {county.fips}, {county.areaSqMi.toLocaleString()} sq mi
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Clear county selection"
          className="rounded-md border border-line p-1.5 text-fog hover:text-parchment"
        >
          <X className="size-4" />
        </button>
      </div>

      <dl className="num grid grid-cols-3 gap-2">
        <Stat label="Corn yield" value={`${county.baseline.cornYieldBuAc.toFixed(0)}`} unit="bu/ac" />
        <Stat label="Baseline return" value={`$${county.baseline.profitPerAcre.toFixed(0)}`} unit="/ac" />
        <Stat label="Best fit" value={recommended} unit={SCENARIOS[recommended].name} accent />
      </dl>

      <Card>
        <CardHeader
          title="Ten-year history"
          subtitle="2016 to 2025"
          action={
            nasa.status === 'live' ? (
              <Badge tone="info">NASA POWER live</Badge>
            ) : nasa.status === 'loading' ? (
              <Badge>Checking NASA POWER</Badge>
            ) : (
              <Badge tone="warn">Demo climate data</Badge>
            )
          }
        />
        <CardBody>
          <HistoricalCharts history={history} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Rotation scenarios" subtitle="Select one to recolor the map." />
        <CardBody>
          <ScenarioComparison
            evaluations={evaluations}
            selected={scenarioId}
            recommended={recommended}
            onSelect={onScenarioChange}
          />
          <p className="mt-3 text-xs text-fog">{SCENARIOS[scenarioId].description}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Spatial Intelligence sub-scores" subtitle={`${scenarioId} compared with the R0 baseline`} />
        <CardBody>
          <SpatialIntelligenceRadar baseline={county.outcomes.R0} selected={county.outcomes[scenarioId]} />
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-canopy/70 px-3 py-2">
      <dt className="text-xs text-fog">{label}</dt>
      <dd className={`text-lg font-semibold ${accent ? 'text-wheat' : 'text-parchment'}`}>{value}</dd>
      <dd className="truncate text-xs text-fog">{unit}</dd>
    </div>
  );
}
