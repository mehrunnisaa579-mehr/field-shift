'use client';

import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { SCENARIO_COLORS, SI_LABELS } from '@/lib/constants';
import type { ScenarioOutcome, SpatialIntelligenceKey } from '@/types';

const KEYS = Object.keys(SI_LABELS) as SpatialIntelligenceKey[];

export function SpatialIntelligenceRadar({ baseline, selected }: { baseline: ScenarioOutcome; selected: ScenarioOutcome }) {
  const showBoth = selected.scenarioId !== 'R0';
  const data = KEYS.map((k) => ({
    axis: SI_LABELS[k],
    R0: baseline.si[k],
    [selected.scenarioId]: selected.si[k],
  }));

  return (
    <div className="h-64" role="img" aria-label={`Spatial Intelligence sub-scores for ${selected.scenarioId}${showBoth ? ' compared with R0' : ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#263b2e" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a398', fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip contentStyle={{ background: '#111c15', border: '1px solid #263b2e', borderRadius: 6, fontSize: 12 }} />
          <Radar name="R0 baseline" dataKey="R0" stroke={SCENARIO_COLORS.R0} fill={SCENARIO_COLORS.R0} fillOpacity={0.15} />
          {showBoth && (
            <Radar
              name={selected.scenarioId}
              dataKey={selected.scenarioId}
              stroke={SCENARIO_COLORS[selected.scenarioId]}
              fill={SCENARIO_COLORS[selected.scenarioId]}
              fillOpacity={0.3}
            />
          )}
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
