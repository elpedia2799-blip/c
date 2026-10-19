import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import crypto from 'crypto';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

// Cryptographically signed stateless admin session tokens
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.DATABASE_URL ||
  'lordzicco_creative_portfolio_master_secret_2026_key';

const revokedTokens = new Set<string>();
const legacyAdminTokens = new Map<string, { email: string; expiresAt: number }>();

export const getAuthorizedAdminEmails = (): string[] => {
  const list = ['elpedia2799@gmail.com', 'lordzicco@gmail.com'];
  if (process.env.ADMIN_EMAIL) {
    list.push(process.env.ADMIN_EMAIL.trim().toLowerCase());
  }
  return list.map((e) => e.toLowerCase());
};

export function createAdminSessionToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days validity
  const payload = JSON.stringify({
    email: normalizedEmail,
    role: 'admin',
    exp: expiresAt,
    iat: Date.now(),
  });

  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `lz_${payloadB64}.${signature}`;
}

export function revokeAdminToken(token: string): void {
  revokedTokens.add(token);
  legacyAdminTokens.delete(token);
}

function verifyAdminSession(token: string): { email: string; role: string } | null {
  if (revokedTokens.has(token)) return null;

  // 1. Check signed lz_ token format
  if (token.startsWith('lz_')) {
    const raw = token.slice(3);
    const parts = raw.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;

    try {
      const expectedSig = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(payloadB64)
        .digest('base64url');

      if (signature.length !== expectedSig.length) return null;
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) return null;

      return { email: payload.email, role: payload.role || 'admin' };
    } catch {
      return null;
    }
  }

  // 2. Fallback check for legacy in-memory token
  const legacy = legacyAdminTokens.get(token);
  if (legacy && Date.now() <= legacy.expiresAt) {
    return { email: legacy.email, role: 'admin' };
  }

  return null;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  // 1. If it is an admin session token (starts with lz_ or is a 64-char hex legacy token)
  const isHexLegacy = /^[0-9a-f]{64}$/i.test(token);
  if (token.startsWith('lz_') || isHexLegacy) {
    const session = verifyAdminSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized: Admin session expired or invalid. Please sign in again.' });
    }

    req.user = {
      uid: 'admin-' + session.email,
      email: session.email,
      name: session.email.includes('elpedia') ? 'Lord Zicco (Owner)' : 'Lord Zicco',
      role: 'admin',
    };
    return next();
  }

  // 2. Otherwise verify as Firebase Google ID token only if it matches standard 3-part JWT structure
  const jwtParts = token.split('.');
  if (jwtParts.length !== 3) {
    return res.status(401).json({ error: 'Unauthorized: Malformed token format' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const email = decodedToken.email?.toLowerCase();
    const authorized = getAuthorizedAdminEmails();

    if (!email || !authorized.includes(email)) {
      console.warn(`[SECURITY] Unauthorized admin panel access attempt from Google account: ${email}`);
      return res.status(403).json({
        error: `Access Denied: Google account (${email || 'unknown'}) is not an authorized administrator.`,
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || 'Lord Zicco',
      role: 'admin',
    };
    return next();
  } catch (error: any) {
    const isExpectedAuthError =
      error?.code === 'auth/id-token-expired' ||
      error?.code === 'auth/argument-error' ||
      error?.code?.startsWith('auth/');

    if (!isExpectedAuthError) {
      console.warn('Firebase token verification error:', error?.message || error);
    }

    return res.status(401).json({
      error: 'Unauthorized: Session expired or invalid. Please sign in again.',
    });
  }
};
