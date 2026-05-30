// ============================================
// Sewanya iPhone — Log Routes
// ============================================

import { Router } from 'express';
import { logService } from '../services/log.service.js';

const router = Router();

/**
 * GET /api/logs
 * Get activity logs with optional user filter
 * Query: ?userId=userId
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const logs = await logService.getAll(
      userId && userId !== 'semua' ? (userId as string) : undefined
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Gagal mengambil log aktivitas' });
  }
});

export default router;
