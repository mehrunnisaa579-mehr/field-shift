import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { FeatureCollection, Geometry } from 'geojson';
import { boundsCenter, geometryBounds } from '@/lib/geo';
import { buildSyntheticCounty } from '@/lib/mock-data';
import type { County, CountyFeatureProperties } from '@/types';

let cache: County[] | null = null;

/**
 * Single seam between the UI and the data source.
 * Swap `buildSyntheticCounty` for a pipeline/database loader to go live.
 */
export async function getCounties(): Promise<County[]> {
  if (cache) return cache;

  const file = path.join(process.cwd(), 'public', 'data', 'iowa-counties.geojson');
  const geo = JSON.parse(await readFile(file, 'utf8')) as FeatureCollection<Geometry, CountyFeatureProperties>;

  cache = geo.features.map((f) =>
    buildSyntheticCounty({
      fips: f.properties.fips,
      name: f.properties.name,
      areaSqMi: f.properties.areaSqMi,
      centroid: boundsCenter(geometryBounds(f.geometry)),
    }),
  );
  return cache;
}
