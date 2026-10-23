import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth';
import {
  createOrUpdateBranch,
  getBranches,
  isEmailAuthorizedAdmin,
  isSuperAdminRecord,
} from '@/lib/db';

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const session = getAdminSessionFromRequest(req);
  if (!session) return false;
  const admin = await isEmailAuthorizedAdmin(session.email);
  return isSuperAdminRecord(admin);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const code = Number(body.code);
    if (isNaN(code) || code < 1 || code > 9) {
      return NextResponse.json(
        { error: 'Branch code must be a single digit between 1 and 9 (used in 6-digit ID)' },
        { status: 400 }
      );
    }

    if (!body.name_ro?.trim()) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }

    const branch = await createOrUpdateBranch({
      code,
      name_ro: body.name_ro.trim(),
      name_ru: (body.name_ru || body.name_ro).trim(),
      name_en: (body.name_en || body.name_ro).trim(),
      city: (body.city || 'Chișinău').trim(),
      address: (body.address || '').trim(),
      is_active: body.is_active ?? true,
    });

    const branches = await getBranches(true);
    return NextResponse.json({ branch, branches });
  } catch (error) {
    console.error('[POST /api/admin/branches] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
