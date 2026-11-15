/**
 * Field Shift - shared domain types.
 * Everything the API, hooks, and UI exchange is described here.
 */

// ---------------------------------------------------------------------------
// Crop rotation scenarios (R0-R3)
// ---------------------------------------------------------------------------

export type ScenarioId = 'R0' | 'R1' | 'R2' | 'R3';

export type CropType =
  | 'corn'
  | 'soybean'
  | 'oats'
  | 'red-clover'
  | 'alfalfa'
  | 'cereal-rye'
  | 'winter-wheat';

export interface CropRotationScenario {
  id: ScenarioId;
  /** Short display name, e.g. "Corn-soy baseline". */
  name: string;
  description: string;
  /** Crop sequence by year; cover crops are listed as their own entry. */
  sequence: CropType[];
  practices: string[];
}

// ---------------------------------------------------------------------------
// Spatial Intelligence (SI) sub-scores - every score is 0 (worst) to 100 (best)
// ---------------------------------------------------------------------------

export type SpatialIntelligenceKey = 'water' | 'soil' | 'climate' | 'profit' | 'carbon';

export type SpatialIntelligence = Record<SpatialIntelligenceKey, number>;

export interface ScenarioOutcome {
  scenarioId: ScenarioId;
  /** Corn-equivalent yield, bushels per acre. */
  yieldBuAc: number;
  /** Net return, USD per acre per year. */
  profitPerAcre: number;
  /** Profit change relative to R0 in this county, percent (negative = loss). */
  profitDeltaPct: number;
  si: SpatialIntelligence;
}

// ---------------------------------------------------------------------------
// NASA climate metrics
// ---------------------------------------------------------------------------

/** Annual climate summary for one county (NASA POWER, AG community). */
export interface ClimateYear {
  year: number;
  /** Annual mean 2 m air temperature, degrees C (POWER: T2M). */
  meanTempC: number;
  /** Annual precipitation, mm (POWER: PRECTOTCORR, mm/day x 365). */
  precipMm: number;
  /** Mean all-sky surface shortwave irradiance, kWh/m2/day (POWER: ALLSKY_SFC_SW_DWN). */
  solarKwhM2Day: number;
}

export interface HistoricalYear extends ClimateYear {
  cornYieldBuAc: number;
  soyYieldBuAc: number;
  /** 0-100 growing-season moisture stress index (higher = drier). */
  droughtStress: number;
}

export type ClimateSource = 'nasa-power' | 'synthetic-demo';

export interface ClimateResponse {
  fips: string;
  source: ClimateSource;
  years: ClimateYear[];
}

// ---------------------------------------------------------------------------
// Counties
// ---------------------------------------------------------------------------

/** Properties carried on each GeoJSON feature in public/data/iowa-counties.geojson. */
export interface CountyFeatureProperties {
  fips: string;
  name: string;
  areaSqMi: number;
  /** Injected client-side by InteractiveMap for the active metric. */
  value?: number | null;
}

export interface County {
  fips: string;
  name: string;
  /** [longitude, latitude] */
  centroid: [number, number];
  areaSqMi: number;
  baseline: {
    cornYieldBuAc: number;
    soyYieldBuAc: number;
    profitPerAcre: number;
  };
  outcomes: Record<ScenarioId, ScenarioOutcome>;
  /** Ten most recent complete years, oldest first. */
  history: HistoricalYear[];
}

export interface CountiesResponse {
  generatedAt: string;
  dataSource: 'synthetic-demo' | 'pipeline';
  counties: County[];
}

// ---------------------------------------------------------------------------
// Judge controls & evaluation
// ---------------------------------------------------------------------------

export interface JudgeWeights {
  /** Relative importance, 0-100. Normalised before use. */
  water: number;
  soil: number;
  profit: number;
  /** Guardrail: maximum acceptable profit loss versus R0, percent (0-25). */
  profitFloorPct: number;
}

export interface ScenarioEvaluation {
  outcome: ScenarioOutcome;
  /** Weighted SI composite, 0-100. */
  composite: number;
  /** False when the profit loss exceeds the guardrail. */
  passesGuardrail: boolean;
}

// ---------------------------------------------------------------------------
// Map metrics
// ---------------------------------------------------------------------------

export type MapMetric = 'cornYield' | 'composite' | 'water' | 'soil' | 'profit';

export interface MetricConfig {
  id: MapMetric;
  label: string;
  unit: string;
  description: string;
  /** Low-to-high colour stops for the choropleth. */
  palette: string[];
  /** True when the value depends on the active scenario. */
  scenarioDependent: boolean;
  format: (value: number) => string;
}
