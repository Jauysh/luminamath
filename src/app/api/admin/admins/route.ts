import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth';
import {
  addAdminEmail,
  getAdminEmails,
  isEmailAuthorizedAdmin,
  removeAdminEmail,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

async function requireAdmin(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) return null;
  const record = await isEmailAuthorizedAdmin(session.email);
  return record ? session : null;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admins = await getAdminEmails();
  return NextResponse.json({ admins });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const email = String(body.email || '')
      .toLowerCase()
      .trim();
    const name = String(body.name || '').trim();
    const role = String(body.role || 'Admin').trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const admins = await addAdminEmail({ email, name, role });
    return NextResponse.json({ success: true, admins });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const emailToRemove = (req.nextUrl.searchParams.get('email') || '').toLowerCase().trim();
  if (!emailToRemove) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (emailToRemove === session.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'You cannot remove your own currently signed-in admin email.' },
      { status: 400 }
    );
  }

  const admins = await removeAdminEmail(emailToRemove);
  return NextResponse.json({ success: true, admins });
}
