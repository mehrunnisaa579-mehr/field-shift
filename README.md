# Field Shift: Adapting Farms with Iowa's 99 Counties

Interactive geospatial dashboard for the 2026 NASA Space Apps Challenge.
Next.js 15 (App Router), React 19, Tailwind CSS 4, MapLibre GL, Recharts.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
```

No API keys needed. The map uses a blank dark canvas (no tile server) over real Census county boundaries.

## Structure

```
app/
  layout.tsx, globals.css, page.tsx      theme tokens, fonts, redirect to /dashboard
  dashboard/page.tsx                     master-detail page (state lives here)
  api/counties/route.ts                  GET all 99 counties (scores, history)
  api/climate/[fips]/route.ts            GET live NASA POWER annual climate for one county
components/
  InteractiveMap.tsx                     MapLibre choropleth, hover tooltip, click select
  MapLegend.tsx
  dashboard/                             DashboardHeader, CountyRanking, CountyPanel,
                                         HistoricalCharts, ScenarioComparison,
                                         SpatialIntelligenceRadar, JudgeWeights, StatewideSummary
  ui/                                    card, slider, segmented-control, badge
hooks/                                   useCounties, useNasaClimate, useJudgeWeights
lib/
  constants.ts                           scenarios R0-R3, metrics, palettes, defaults
  scoring.ts                             weights, composite, profit guardrail, recommendation
  geo.ts, utils.ts, nasa-power.ts
  mock-data.ts                           SYNTHETIC scores (see below)
  server/counties.ts                     the one place the data source is chosen
types/index.ts                           all shared interfaces
public/data/iowa-counties.geojson        99 real county boundaries
scripts/build-iowa-geojson.mjs           regenerates the GeoJSON
```

## What is real and what is placeholder

- Real: county boundaries and names; the NASA POWER climate route (`/api/climate/[fips]`), which the
  county panel overlays on the bundled history when reachable, and labels "NASA POWER live".
- Placeholder: yields, profit, SI sub-scores and the R0-R3 effects in `lib/mock-data.ts`. They follow
  plausible north/south and east/west gradients but are not computed from NASS, SSURGO, SMAP or MODIS.
  The header shows a "Demo scores" badge until the data source changes.

To go live, return `County[]` from your pipeline in `lib/server/counties.ts` and set
`dataSource: 'pipeline'` in `app/api/counties/route.ts`. Nothing in the UI needs to change.
