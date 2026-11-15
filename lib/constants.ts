import type {
  CropRotationScenario,
  JudgeWeights,
  MapMetric,
  MetricConfig,
  ScenarioId,
  SpatialIntelligenceKey,
} from '@/types';

export const HISTORY_YEARS = { start: 2016, end: 2025 } as const;

/** Iowa bounding box [[west, south], [east, north]]. */
export const IOWA_BOUNDS: [[number, number], [number, number]] = [
  [-96.7, 40.35],
  [-90.1, 43.55],
];

export const SCENARIO_ORDER: ScenarioId[] = ['R0', 'R1', 'R2', 'R3'];

export const SCENARIOS: Record<ScenarioId, CropRotationScenario> = {
  R0: {
    id: 'R0',
    name: 'Corn-soy baseline',
    description: 'The standard two-year rotation with conventional tillage. All other scenarios are measured against it.',
    sequence: ['corn', 'soybean'],
    practices: ['Conventional tillage', 'Tile drainage where present'],
  },
  R1: {
    id: 'R1',
    name: 'Extended rotation',
    description: 'Adds a small-grain year with a clover underseed, breaking pest cycles and cutting nitrogen needs.',
    sequence: ['corn', 'soybean', 'oats', 'red-clover'],
    practices: ['Reduced tillage', 'Clover underseeding', 'Split nitrogen'],
  },
  R2: {
    id: 'R2',
    name: 'Cover-crop corn-soy',
    description: 'Keeps the two-year rotation but adds cereal rye after harvest and moves to no-till.',
    sequence: ['corn', 'soybean', 'cereal-rye'],
    practices: ['No-till', 'Cereal rye cover', 'Saturated buffers'],
  },
  R3: {
    id: 'R3',
    name: 'Diversified perennial',
    description: 'Four-year rotation with winter wheat and alfalfa plus prairie strips on the most erodible ground.',
    sequence: ['corn', 'soybean', 'winter-wheat', 'alfalfa'],
    practices: ['No-till', 'Prairie strips', 'Perennial phase', 'Cover crops'],
  },
};

export const SI_LABELS: Record<SpatialIntelligenceKey, string> = {
  water: 'Water quality',
  soil: 'Soil health',
  climate: 'Climate resilience',
  profit: 'Profit',
  carbon: 'Carbon',
};

export const DEFAULT_WEIGHTS: JudgeWeights = {
  water: 40,
  soil: 35,
  profit: 25,
  profitFloorPct: 5,
};

export const SCENARIO_COLORS: Record<ScenarioId, string> = {
  R0: '#8a9a8f',
  R1: '#7cc576',
  R2: '#5fb3d6',
  R3: '#e3b341',
};

const fixed = (digits: number, suffix = '') => (v: number) => `${v.toFixed(digits)}${suffix}`;

export const METRICS: Record<MapMetric, MetricConfig> = {
  cornYield: {
    id: 'cornYield',
    label: 'Corn yield',
    unit: 'bu/ac',
    description: 'Ten-year mean corn yield under the selected scenario.',
    palette: ['#1d2f25', '#2c5a3c', '#4f8f45', '#9bbd45', '#e3b341', '#f7de8a'],
    scenarioDependent: true,
    format: fixed(0, ' bu/ac'),
  },
  composite: {
    id: 'composite',
    label: 'Sustainability score',
    unit: '/100',
    description: 'Judge-weighted Spatial Intelligence composite for the selected scenario.',
    palette: ['#2a1f12', '#5b4318', '#8a7a2c', '#6faa4e', '#3d9b6b', '#8ee0b0'],
    scenarioDependent: true,
    format: fixed(1),
  },
  water: {
    id: 'water',
    label: 'Water quality',
    unit: '/100',
    description: 'Nitrate and runoff risk score. Higher is cleaner water.',
    palette: ['#0f2433', '#134b73', '#1f78a8', '#3aa6c8', '#7fd3e6', '#cdf2fa'],
    scenarioDependent: true,
    format: fixed(1),
  },
  soil: {
    id: 'soil',
    label: 'Soil health',
    unit: '/100',
    description: 'Erosion, organic matter and structure score. Higher is healthier soil.',
    palette: ['#241a10', '#53371a', '#85591f', '#b58330', '#dfae52', '#f5d995'],
    scenarioDependent: true,
    format: fixed(1),
  },
  profit: {
    id: 'profit',
    label: 'Net return',
    unit: '$/ac',
    description: 'Estimated annual net return per acre for the selected scenario.',
    palette: ['#251a35', '#48297a', '#6b3fb0', '#9566d6', '#c39af0', '#ead3ff'],
    scenarioDependent: true,
    format: (v) => `$${v.toFixed(0)}/ac`,
  },
};

export const METRIC_ORDER: MapMetric[] = ['composite', 'cornYield', 'water', 'soil', 'profit'];
