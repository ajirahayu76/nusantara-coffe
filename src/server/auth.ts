import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export interface AuthenticatedUser {
  id: number;
  uid?: string | null;
  username: string;
  fullName: string;
  role: 'owner' | 'manager' | 'cashier' | string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  currentUser?: AuthenticatedUser;
}

// In-memory token session map for staff login
const sessionStore = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();

export function createStaffSession(user: AuthenticatedUser): string {
  const token = 'kn_' + crypto.randomBytes(32).toString('hex');
  // 7 days expiration
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessionStore.set(token, { user, expiresAt });
  return token;
}

export function revokeStaffSession(token: string) {
  sessionStore.delete(token);
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Check custom staff session token
  if (token.startsWith('kn_')) {
    const session = sessionStore.get(token);
    if (session) {
      if (Date.now() > session.expiresAt) {
        sessionStore.delete(token);
        return res.status(401).json({ error: 'Sesi telah berakhir. Silakan login kembali.' });
      }
      req.currentUser = session.user;
      return next();
    }
  }

  // 2. Check Firebase ID Token
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    // Find or create in Cloud SQL users
    const userRecords = await db.select().from(users).where(eq(users.uid, decodedToken.uid));
    let dbUser: AuthenticatedUser;

    if (userRecords.length > 0) {
      dbUser = userRecords[0] as AuthenticatedUser;
    } else {
      // Auto create as owner or cashier
      const email = decodedToken.email || `user_${decodedToken.uid.substring(0, 8)}@kopinusantara.id`;
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const inserted = await db.insert(users).values({
        uid: decodedToken.uid,
        username: `${baseUsername}_${Math.floor(Math.random() * 1000)}`,
        fullName: decodedToken.name || 'Pengguna Google',
        role: 'owner', // Default first google login as owner
        email: decodedToken.email,
        isActive: true,
      }).returning();
      dbUser = inserted[0] as AuthenticatedUser;
    }

    req.currentUser = dbUser;
    return next();
  } catch (error) {
    // If token invalid, allow request to proceed (route handlers will check currentUser if needed)
    return next();
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Akses ditolak: Anda belum masuk ke sistem Kopi Nusantara.' });
  }
  if (!req.currentUser.isActive) {
    return res.status(403).json({ error: 'Akun Anda dinonaktifkan. Hubungi administrator.' });
  }
  next();
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Akses ditolak: Silakan login terlebih dahulu.' });
    }
    if (!allowedRoles.includes(req.currentUser.role)) {
      return res.status(403).json({
        error: `Akses ditolak: Fitur ini hanya untuk pengguna dengan role [${allowedRoles.join(', ')}].`,
      });
    }
    next();
  };
}
