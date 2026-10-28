import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'lumina_admin_session';

export interface AdminSessionPayload {
  email: string;
  name?: string;
  picture?: string;
  iat: number;
  exp: number;
}

function getSigningSecret(): string {
  const base =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.DATABASE_URL ||
    process.env.ADMIN_PASSWORD ||
    'luminamath-md-default-hmac-secret-2026';
  return crypto.createHash('sha256').update(base).digest('hex');
}

export function createAdminSessionToken(payload: {
  email: string;
  name?: string;
  picture?: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AdminSessionPayload = {
    email: payload.email.toLowerCase().trim(),
    name: payload.name,
    picture: payload.picture,
    iat: now,
    exp: now + 60 * 60 * 12, // 12 hours session
  };

  const dataB64 = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(dataB64)
    .digest('base64url');

  return `${dataB64}.${sig}`;
}

export function verifyAdminSessionToken(
  token: string | undefined | null
): AdminSessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [dataB64, sig] = token.split('.');
  if (!dataB64 || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(dataB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(dataB64, 'base64url').toString('utf8')
    ) as AdminSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp < now) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(req: NextRequest): AdminSessionPayload | null {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(cookieToken);
}

/**
 * Verifies a Google OAuth 2.0 ID token (JWT) using Google's official tokeninfo endpoint.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedClientId?: string
): Promise<{ email: string; name?: string; picture?: string } | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();

    if (data.email_verified !== 'true' && data.email_verified !== true) {
      return null;
    }

    if (expectedClientId && data.aud !== expectedClientId) {
      return null;
    }

    if (!data.email) return null;

    return {
      email: String(data.email).toLowerCase().trim(),
      name: data.name || data.given_name || undefined,
      picture: data.picture || undefined,
    };
  } catch (err) {
    console.error('[verifyGoogleIdToken] Error:', err);
    return null;
  }
}

// ============================================================================
// Input Sanitization & XSS / Injection Prevention Helpers
// ============================================================================
export function escapeHtml(input: unknown): string {
  const str = String(input ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizePlainText(input: unknown, maxLength = 150): string {
  return String(input ?? '')
    .replace(/[<>]/g, '') // Strip HTML angle brackets
    .replace(/[\u0000-\u001F\u007F]/g, ' ') // Strip control characters
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function timingSafePinMatch(providedPin: string, actualPin: string): boolean {
  const cleanProvided = providedPin.trim();
  const cleanActual = actualPin.trim();
  if (!cleanProvided || !cleanActual) return false;
  const bufA = Buffer.from(cleanProvided, 'utf8');
  const bufB = Buffer.from(cleanActual, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ============================================================================
// In-Memory Rate Limiter (Brute-Force & Spam Protection)
// ============================================================================
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __luminaRateLimits: Map<string, RateLimitBucket> | undefined;
}

function getRateLimitStore(): Map<string, RateLimitBucket> {
  if (!global.__luminaRateLimits) {
    global.__luminaRateLimits = new Map();
  }
  // Periodic memory cleanup if map grows large
  if (global.__luminaRateLimits.size > 10000) {
    const now = Date.now();
    for (const [k, v] of Array.from(global.__luminaRateLimits.entries())) {
      if (now > v.resetAt) {
        global.__luminaRateLimits.delete(k);
      }
    }
  }
  return global.__luminaRateLimits;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; retryAfterSeconds: number } {
  const store = getRateLimitStore();
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function isRateLimitExceeded(key: string, maxRequests: number): boolean {
  const store = getRateLimitStore();
  const bucket = store.get(key);
  if (!bucket) return false;
  if (Date.now() > bucket.resetAt) {
    store.delete(key);
    return false;
  }
  return bucket.count >= maxRequests;
}

/**
 * Extracts the real client IP on Google Cloud Run / Reverse Proxies.
 * On Cloud Run, Google Frontend appends `<real-client-ip>, <gfe-ip>` to `x-forwarded-for`.
 * Taking the second-to-last IP when >=2 entries exist prevents client `X-Forwarded-For` spoofing.
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    if (parts.length === 1) {
      return parts[0];
    }
  }
  return req.headers.get('x-real-ip') || 'unknown';
}
