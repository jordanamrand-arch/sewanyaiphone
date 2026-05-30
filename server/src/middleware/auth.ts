// ============================================
// Sewanya iPhone — Auth Middleware
// ============================================

import type { Request, Response, NextFunction } from 'express';
import { auth } from '../auth/index.js';
import { fromNodeHeaders } from 'better-auth/node';

// Extend Express Request to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
      session?: {
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
      };
    }
  }
}

/**
 * Middleware that validates the Better Auth session cookie.
 * Attaches `req.user` and `req.session` if authenticated.
 * Returns 401 if no valid session is found.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: 'Unauthorized — silakan login terlebih dahulu' });
      return;
    }

    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as any).role || 'karyawan',
    };

    req.session = {
      id: session.session.id,
      userId: session.session.userId,
      token: session.session.token,
      expiresAt: session.session.expiresAt,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized — sesi tidak valid' });
  }
}
