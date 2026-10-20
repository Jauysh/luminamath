import { NextResponse } from 'next/server';
import { getBranches } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const branches = await getBranches(false);
    return NextResponse.json({ branches });
  } catch (error) {
    console.error('[GET /api/branches] Error:', error);
    return NextResponse.json({ error: 'Failed to load branches' }, { status: 500 });
  }
}
