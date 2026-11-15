import type { ClimateYear } from '@/types';

/**
 * Thin client for the NASA POWER monthly point API (no key required).
 * Docs: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/
 *
 * For the monthly endpoint each parameter is keyed `YYYYMM`, and `YYYY13` is the annual value.
 * Missing data is reported as -999.
 */
const BASE_URL = 'https://power.larc.nasa.gov/api/temporal/monthly/point';
const MISSING = -999;

interface PowerResponse {
  properties?: { parameter?: Record<string, Record<string, number>> };
}

export async function fetchAnnualClimate(
  latitude: number,
  longitude: number,
  startYear: number,
  endYear: number,
): Promise<ClimateYear[]> {
  const url = new URL(BASE_URL);
  url.search = new URLSearchParams({
    parameters: 'T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN',
    community: 'AG',
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    start: String(startYear),
    end: String(endYear),
    format: 'JSON',
  }).toString();

  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) throw new Error(`NASA POWER responded ${res.status}`);

  const json = (await res.json()) as PowerResponse;
  const p = json.properties?.parameter;
  if (!p?.T2M || !p.PRECTOTCORR || !p.ALLSKY_SFC_SW_DWN) throw new Error('Unexpected NASA POWER payload');

  const years: ClimateYear[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const key = `${year}13`;
    const t = p.T2M[key];
    const pr = p.PRECTOTCORR[key];
    const sw = p.ALLSKY_SFC_SW_DWN[key];
    if ([t, pr, sw].some((v) => v === undefined || v === MISSING)) continue;
    years.push({
      year,
      meanTempC: Math.round(t * 10) / 10,
      precipMm: Math.round(pr * 365),
      solarKwhM2Day: Math.round(sw * 100) / 100,
    });
  }
  return years;
}
