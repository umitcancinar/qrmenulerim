import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

export type Session = {
  userId: string;
  tenantId: string | null;
  role: 'SUPERADMIN' | 'OWNER' | 'MANAGER';
  username: string;
};

const configuredSecret = process.env.AUTH_SECRET;
if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret.length < 32)) {
  throw new Error('AUTH_SECRET must contain at least 32 characters in production.');
}
const secret = new TextEncoder().encode(configuredSecret || 'development-only-secret-change-before-deploy');

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function createSessionToken(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function readSessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.userId || !payload.role || !payload.username) return null;
    return {
      userId: String(payload.userId),
      tenantId: payload.tenantId ? String(payload.tenantId) : null,
      role: payload.role as Session['role'],
      username: String(payload.username),
    };
  } catch {
    return null;
  }
}
