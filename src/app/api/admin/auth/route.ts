import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  checkRateLimit,
  createAdminSessionToken,
  getAdminSessionFromRequest,
  getClientIp,
  verifyGoogleIdToken,
} from '@/lib/auth';
import { getSiteSettings, isEmailAuthorizedAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const settings = await getSiteSettings();
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      googleClientId: settings.google_client_id || '',
    });
  }

  // Verify the email is still in the whitelist
  const adminRecord = await isEmailAuthorizedAdmin(session.email);
  if (!adminRecord) {
    const res = NextResponse.json({
      authenticated: false,
      googleClientId: settings.google_client_id || '',
    });
    res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      email: adminRecord.email,
      name: session.name || adminRecord.name,
      role: adminRecord.role,
      picture: session.picture,
    },
    googleClientId: settings.google_client_id || '',
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(`admin_auth:${ip}`, 8, 15 * 60); // max 8 attempts per 15 min
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

    // Method 1: Google Sign-In (OAuth 2.0 ID Token)
    if (body.idToken) {
      const googleUser = await verifyGoogleIdToken(
        body.idToken,
        settings.google_client_id || undefined
      );
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
          role: adminRecord.role,
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
    }

    // Method 2: Whitelisted Admin Email + Master Key
    const email = String(body.email || '')
      .toLowerCase()
      .trim();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Introduceți adresa de email autorizată și cheia de acces' },
        { status: 400 }
      );
    }

    const adminRecord = await isEmailAuthorizedAdmin(email);
    if (!adminRecord) {
      return NextResponse.json(
        {
          error: `Acces interzis / Доступ запрещен: ${email} nu este în lista administratorilor autorizați.`,
        },
        { status: 403 }
      );
    }

    const expectedPass = process.env.ADMIN_PASSWORD || 'lumina2026admin';
    const passBuf = Buffer.from(password);
    const expectedBuf = Buffer.from(expectedPass);

    if (
      passBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(passBuf, expectedBuf)
    ) {
      return NextResponse.json(
        { error: 'Cheie de acces incorectă / Неверный ключ доступа' },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken({
      email: adminRecord.email,
      name: adminRecord.name,
    });

    const res = NextResponse.json({
      authenticated: true,
      admin: {
        email: adminRecord.email,
        name: adminRecord.name,
        role: adminRecord.role,
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
