import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth';
import { getSiteSettings, isEmailAuthorizedAdmin, updateSiteSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[GET /api/settings] Error:', error);
    return NextResponse.json({ error: 'Failed to load site settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session || !(await isEmailAuthorizedAdmin(session.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const settings = await updateSiteSettings(body);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[POST /api/settings] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
