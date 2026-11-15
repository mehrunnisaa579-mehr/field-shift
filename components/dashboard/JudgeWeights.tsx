import { RotateCcw } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { normalizeWeights } from '@/lib/scoring';
import type { JudgeWeights as Weights } from '@/types';

interface JudgeWeightsProps {
  weights: Weights;
  isDefault: boolean;
  onChange: <K extends keyof Weights>(key: K, value: Weights[K]) => void;
  onReset: () => void;
}

export function JudgeWeights({ weights, isDefault, onChange, onReset }: JudgeWeightsProps) {
  const share = normalizeWeights(weights);
  const pct = (n: number) => `${Math.round(n * 100)}% of score`;

  return (
    <Card>
      <CardHeader
        title="Judge priorities"
        subtitle="Changes the sustainability score on the map and the best-fit scenario."
        action={
          <button
            type="button"
            onClick={onReset}
            disabled={isDefault}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-fog hover:text-parchment disabled:opacity-40"
          >
            <RotateCcw className="size-3" aria-hidden /> Reset
          </button>
        }
      />
      <CardBody className="space-y-4">
        <Slider label="Water quality" value={weights.water} display={pct(share.water)} onChange={(v) => onChange('water', v)} />
        <Slider label="Soil health" value={weights.soil} display={pct(share.soil)} onChange={(v) => onChange('soil', v)} />
        <Slider label="Profit" value={weights.profit} display={pct(share.profit)} onChange={(v) => onChange('profit', v)} />
        <div className="border-t border-line pt-4">
          <Slider
            label="Profit guardrail"
            hint="Scenarios that lose more than this versus R0 are flagged and never chosen as best fit."
            value={weights.profitFloorPct}
            min={0}
            max={25}
            display={`max ${weights.profitFloorPct}% loss`}
            onChange={(v) => onChange('profitFloorPct', v)}
          />
        </div>
      </CardBody>
    </Card>
  );
}
