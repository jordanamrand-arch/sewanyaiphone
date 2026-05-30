// ============================================
// Sewanya iPhone — Role Middleware
// ============================================

import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware factory that checks if the authenticated user has one of the required roles.
 * Must be used AFTER requireAuth middleware.
 *
 * @example
 * router.get('/admin', requireAuth, requireRole('owner'), handler);
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden — Anda tidak memiliki akses untuk fitur ini',
      });
      return;
    }

    next();
  };
}
