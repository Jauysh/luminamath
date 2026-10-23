import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth';
import {
  getSiteSettings,
  isEmailAuthorizedAdmin,
  isSuperAdminRecord,
  updateSiteSettings,
} from '@/lib/db';

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
  const admin = session ? await isEmailAuthorizedAdmin(session.email) : null;
  if (!admin || !isSuperAdminRecord(admin)) {
    return NextResponse.json(
      { error: 'Acces permis doar pentru Super Admin' },
      { status: 403 }
    );
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
