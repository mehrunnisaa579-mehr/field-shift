// Builds public/data/iowa-counties.geojson (99 counties) from the public Plotly US county dataset
// (derived from US Census cartographic boundaries). Run: node scripts/build-iowa-geojson.mjs
import { writeFile, mkdir } from 'node:fs/promises';

const SRC = 'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json';
const round = (n) => Math.round(n * 1e4) / 1e4;
const roundCoords = (c) => (typeof c[0] === 'number' ? c.map(round) : c.map(roundCoords));

const res = await fetch(SRC);
if (!res.ok) throw new Error(`Download failed: ${res.status}`);
const all = await res.json();

const features = all.features
  .filter((f) => String(f.id).startsWith('19'))
  .map((f) => ({
    type: 'Feature',
    properties: {
      fips: String(f.id),
      name: f.properties.NAME,
      areaSqMi: Math.round(Number(f.properties.CENSUSAREA)),
    },
    geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) },
  }))
  .sort((a, b) => a.properties.fips.localeCompare(b.properties.fips));

if (features.length !== 99) throw new Error(`Expected 99 Iowa counties, got ${features.length}`);
await mkdir('public/data', { recursive: true });
await writeFile('public/data/iowa-counties.geojson', JSON.stringify({ type: 'FeatureCollection', features }));
console.log(`Wrote ${features.length} counties`);
