'use client';

import { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SegmentedControl } from '@/components/ui/segmented-control';
import type { HistoricalYear } from '@/types';

type Tab = 'yield' | 'climate';

const AXIS = { stroke: '#94a398', fontSize: 11, tickLine: false, axisLine: false } as const;
const TOOLTIP_STYLE = {
  background: '#111c15',
  border: '1px solid #263b2e',
  borderRadius: 6,
  fontSize: 12,
  color: '#ece7d6',
} as const;

export function HistoricalCharts({ history }: { history: HistoricalYear[] }) {
  const [tab, setTab] = useState<Tab>('yield');

  return (
    <div>
      <SegmentedControl
        label="Chart type"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'yield', label: 'Yield' },
          { value: 'climate', label: 'Rain and temperature' },
        ]}
      />
      <div className="mt-3 h-56" role="img" aria-label={tab === 'yield' ? 'Ten-year corn and soybean yield chart' : 'Ten-year precipitation and temperature chart'}>
        <ResponsiveContainer width="100%" height="100%">
          {tab === 'yield' ? (
            <ComposedChart data={history} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#1b2c22" vertical={false} />
              <XAxis dataKey="year" {...AXIS} />
              <YAxis yAxisId="corn" domain={['dataMin - 10', 'dataMax + 10']} {...AXIS} />
              <YAxis yAxisId="soy" orientation="right" domain={['dataMin - 4', 'dataMax + 4']} {...AXIS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: '#263b2e' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="corn" type="monotone" dataKey="cornYieldBuAc" name="Corn (bu/ac)" stroke="#e3b341" strokeWidth={2} dot={{ r: 2.5 }} />
              <Line yAxisId="soy" type="monotone" dataKey="soyYieldBuAc" name="Soybean (bu/ac)" stroke="#7cc576" strokeWidth={2} dot={{ r: 2.5 }} />
            </ComposedChart>
          ) : (
            <ComposedChart data={history} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#1b2c22" vertical={false} />
              <XAxis dataKey="year" {...AXIS} />
              <YAxis yAxisId="precip" {...AXIS} />
              <YAxis yAxisId="temp" orientation="right" domain={['dataMin - 1', 'dataMax + 1']} {...AXIS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#1b2c22' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="precip" dataKey="precipMm" name="Precipitation (mm)" fill="#5fb3d6" fillOpacity={0.75} radius={[2, 2, 0, 0]} />
              <Line yAxisId="temp" type="monotone" dataKey="meanTempC" name="Mean temp (C)" stroke="#d9795b" strokeWidth={2} dot={{ r: 2.5 }} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
