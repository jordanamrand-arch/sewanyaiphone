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

/**
 * POST /api/logs
 * Create a new activity log entry
 */
router.post('/', async (req, res) => {
  try {
    const { activity } = req.body;
    if (!activity) {
      res.status(400).json({ error: 'Field activity wajib diisi' });
      return;
    }

    const log = await logService.create(req.user!.id, activity);
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Gagal membuat log aktivitas' });
  }
});

export default router;
