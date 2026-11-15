import { NextResponse } from 'next/server';
import { getCounties } from '@/lib/server/counties';
import type { CountiesResponse } from '@/types';

export const revalidate = 3600;

export async function GET() {
  const body: CountiesResponse = {
    generatedAt: new Date().toISOString(),
    dataSource: 'synthetic-demo',
    counties: await getCounties(),
  };
  return NextResponse.json(body);
}
