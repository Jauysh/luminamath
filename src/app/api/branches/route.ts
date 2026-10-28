import { NextResponse } from 'next/server';
import { getBranches } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const branches = await getBranches(false);
    return NextResponse.json(
      { branches },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/branches] Error:', error);
    return NextResponse.json({ error: 'Failed to load branches' }, { status: 500 });
  }
}
