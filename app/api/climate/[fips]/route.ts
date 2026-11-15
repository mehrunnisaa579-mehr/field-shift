import { NextResponse } from 'next/server';
import { HISTORY_YEARS } from '@/lib/constants';
import { fetchAnnualClimate } from '@/lib/nasa-power';
import { getCounties } from '@/lib/server/counties';
import type { ClimateResponse } from '@/types';

export const revalidate = 86400;

export async function GET(_req: Request, { params }: { params: Promise<{ fips: string }> }) {
  const { fips } = await params;
  const county = (await getCounties()).find((c) => c.fips === fips);
  if (!county) return NextResponse.json({ error: 'Unknown county FIPS code' }, { status: 404 });

  const [lng, lat] = county.centroid;
  try {
    const years = await fetchAnnualClimate(lat, lng, HISTORY_YEARS.start, HISTORY_YEARS.end);
    const body: ClimateResponse = { fips, source: 'nasa-power', years };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: 'NASA POWER is unavailable right now' }, { status: 502 });
  }
}
