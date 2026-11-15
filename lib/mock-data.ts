/**
 * Deterministic SYNTHETIC data generator.
 *
 * Stand-in for the real analysis pipeline (NASS yields + SSURGO soils + NASA POWER/SMAP/MODIS
 * features -> SI scores). It produces plausible spatial gradients (north-central highest yield,
 * southern and western counties more erosion-prone) so the UI can be built and judged end-to-end.
 *
 * To go live, replace `buildCounty` in lib/server/counties.ts with a loader for pipeline output
 * that returns the same `County` shape. Nothing in the UI depends on this file.
 */
import { HISTORY_YEARS, SCENARIO_ORDER } from '@/lib/constants';
import { clamp, mean } from '@/lib/utils';
import type { County, HistoricalYear, ScenarioId, ScenarioOutcome, SpatialIntelligence } from '@/types';

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Year-level shocks shared by all counties: yield, precipitation multiplier, temp offset (C), drought stress. */
const YEAR_SHOCKS: Record<number, { yield: number; precip: number; temp: number; drought: number }> = {
  2016: { yield: 0.04, precip: 1.05, temp: 0.2, drought: 25 },
  2017: { yield: 0.01, precip: 1.0, temp: 0.3, drought: 30 },
  2018: { yield: 0.03, precip: 1.08, temp: 0.4, drought: 28 },
  2019: { yield: -0.05, precip: 1.22, temp: -0.8, drought: 18 },
  2020: { yield: -0.04, precip: 0.95, temp: 0.2, drought: 45 },
  2021: { yield: -0.02, precip: 0.88, temp: 0.1, drought: 55 },
  2022: { yield: -0.01, precip: 0.85, temp: 0.3, drought: 58 },
  2023: { yield: -0.07, precip: 0.72, temp: 0.5, drought: 72 },
  2024: { yield: 0.05, precip: 1.12, temp: 0.4, drought: 22 },
  2025: { yield: 0.04, precip: 1.0, temp: 0.3, drought: 30 },
};

/** Per-scenario effects relative to R0: [water, soil, climate, carbon] boosts, yield ratio, mean profit change (%). */
const SCENARIO_EFFECTS: Record<Exclude<ScenarioId, 'R0'>, { boosts: [number, number, number, number]; yieldRatio: number; profitPct: number }> = {
  R1: { boosts: [10, 9, 7, 8], yieldRatio: 0.98, profitPct: -2.5 },
  R2: { boosts: [13, 14, 8, 11], yieldRatio: 0.99, profitPct: -3.5 },
  R3: { boosts: [20, 19, 16, 18], yieldRatio: 0.94, profitPct: -7.5 },
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const profitScore = (profitPerAcre: number) => clamp(50 + (profitPerAcre - 130) * 0.55, 0, 100);

export function buildSyntheticCounty(input: {
  fips: string;
  name: string;
  centroid: [number, number];
  areaSqMi: number;
}): County {
  const { fips, name, centroid, areaSqMi } = input;
  const rand = mulberry32(hashString(fips));
  const [lon, lat] = centroid;

  // 0 = south / east edge, 1 = north / west edge
  const north = clamp((lat - 40.4) / 3.1, 0, 1);
  const west = clamp((-90.1 - lon) / 6.5, 0, 1);
  const centrality = 1 - Math.abs(west - 0.5) * 2; // 1 at the state's east-west middle

  const cornMean = 170 + 14 * north + 12 * centrality + (rand() - 0.5) * 10;
  const baseProfit = 105 + (cornMean - 176) * 3.4 + (rand() - 0.5) * 30;

  // Climate normals for the county
  const normalTemp = 12.6 - 2.4 * north + 0.6 * (1 - west);
  const normalPrecip = 920 - 140 * north - 90 * west + (rand() - 0.5) * 60;
  const normalSolar = 4.35 + 0.1 * west + (rand() - 0.5) * 0.08;

  const history: HistoricalYear[] = [];
  for (let year = HISTORY_YEARS.start; year <= HISTORY_YEARS.end; year++) {
    const shock = YEAR_SHOCKS[year];
    const noise = () => (rand() - 0.5) * 2;
    const corn = cornMean * (1 + shock.yield + noise() * 0.03);
    history.push({
      year,
      cornYieldBuAc: round1(corn),
      soyYieldBuAc: round1(corn * 0.3 * (1 + noise() * 0.02)),
      meanTempC: round1(normalTemp + shock.temp + noise() * 0.3),
      precipMm: Math.round(normalPrecip * shock.precip * (1 + noise() * 0.05)),
      solarKwhM2Day: Math.round((normalSolar + noise() * 0.08) * 100) / 100,
      droughtStress: Math.round(clamp(shock.drought + noise() * 6 + west * 6, 0, 100)),
    });
  }

  const r0Yield = mean(history.map((h) => h.cornYieldBuAc));

  // Baseline sub-scores
  const soilBase = 66 - 14 * (1 - north) - 8 * Math.max(0, west - 0.6) / 0.4 + (rand() - 0.5) * 10;
  const waterBase = 52 + 10 * (1 - north) - 10 * centrality * north + (rand() - 0.5) * 12;
  const climateBase = 55 - 8 * west + (rand() - 0.5) * 14;
  const carbonBase = 38 + (soilBase - 60) * 0.5 + (rand() - 0.5) * 8;
  const responsiveness = 0.8 + rand() * 0.4;

  const outcomes = {} as Record<ScenarioId, ScenarioOutcome>;
  for (const id of SCENARIO_ORDER) {
    const fx = id === 'R0' ? null : SCENARIO_EFFECTS[id];
    const [bw, bs, bc, bk] = fx ? fx.boosts.map((b) => b * responsiveness) : [0, 0, 0, 0];

    // Converting marginal (southern) ground costs less profit than converting prime land.
    const profitPct = fx ? fx.profitPct + (1 - north) * 3 + (rand() - 0.5) * 6 : 0;
    const profitPerAcre = baseProfit * (1 + profitPct / 100);

    const si: SpatialIntelligence = {
      water: round1(clamp(waterBase + bw, 0, 100)),
      soil: round1(clamp(soilBase + bs, 0, 100)),
      climate: round1(clamp(climateBase + bc, 0, 100)),
      carbon: round1(clamp(carbonBase + bk, 0, 100)),
      profit: round1(profitScore(profitPerAcre)),
    };

    outcomes[id] = {
      scenarioId: id,
      yieldBuAc: round1(r0Yield * (fx?.yieldRatio ?? 1)),
      profitPerAcre: round1(profitPerAcre),
      profitDeltaPct: round1(profitPct),
      si,
    };
  }

  return {
    fips,
    name,
    centroid,
    areaSqMi,
    baseline: {
      cornYieldBuAc: round1(r0Yield),
      soyYieldBuAc: round1(mean(history.map((h) => h.soyYieldBuAc))),
      profitPerAcre: round1(baseProfit),
    },
    outcomes,
    history,
  };
}
