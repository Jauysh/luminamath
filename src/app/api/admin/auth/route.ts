import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  checkRateLimit,
  createAdminSessionToken,
  getAdminSessionFromRequest,
  getClientIp,
  verifyGoogleIdToken,
} from '@/lib/auth';
import { getSiteSettings, isEmailAuthorizedAdmin, isSuperAdminRecord } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_GOOGLE_CLIENT_ID =
  '592645627631-jvrb0v4vq581avfjf1o53a5rkhfvjapm.apps.googleusercontent.com';

export async function GET(req: NextRequest) {
  const settings = await getSiteSettings();
  const clientId = settings.google_client_id || DEFAULT_GOOGLE_CLIENT_ID;
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      googleClientId: clientId,
    });
  }

  // Verify the email is still in the whitelist
  const adminRecord = await isEmailAuthorizedAdmin(session.email);
  if (!adminRecord) {
    const res = NextResponse.json({
      authenticated: false,
      googleClientId: clientId,
    });
    res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      email: adminRecord.email,
      name: session.name || adminRecord.name,
      role: isSuperAdminRecord(adminRecord) ? 'Super Admin' : adminRecord.role,
      picture: session.picture,
    },
    googleClientId: clientId,
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(`admin_auth:${ip}`, 12, 15 * 60); // max 12 attempts per 15 min
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many login attempts. Please wait ${Math.ceil(
          limit.retryAfterSeconds / 60
        )} minutes.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const settings = await getSiteSettings();
    const expectedClientId = settings.google_client_id || DEFAULT_GOOGLE_CLIENT_ID;

    if (!body.idToken || typeof body.idToken !== 'string') {
      return NextResponse.json(
        {
          error:
            'Autentificarea este permisă exclusiv prin contul oficial Google (@orizont.md / Gmail autorizat).',
        },
        { status: 400 }
      );
    }

    const googleUser = await verifyGoogleIdToken(body.idToken, expectedClientId);
    if (!googleUser) {
      return NextResponse.json(
        { error: 'Invalid or expired Google Sign-In token' },
        { status: 401 }
      );
    }

    const adminRecord = await isEmailAuthorizedAdmin(googleUser.email);
    if (!adminRecord) {
      return NextResponse.json(
        {
          error: `Acces interzis / Доступ запрещен: ${googleUser.email} nu este în lista administratorilor autorizați.`,
        },
        { status: 403 }
      );
    }

    const token = createAdminSessionToken({
      email: adminRecord.email,
      name: googleUser.name || adminRecord.name,
      picture: googleUser.picture,
    });

    const res = NextResponse.json({
      authenticated: true,
      admin: {
        email: adminRecord.email,
        name: googleUser.name || adminRecord.name,
        role: isSuperAdminRecord(adminRecord) ? 'Super Admin' : adminRecord.role,
        picture: googleUser.picture,
      },
    });

    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch (error) {
    console.error('[POST /api/admin/auth] Error:', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
