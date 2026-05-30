// ============================================
// Sewanya iPhone — Dashboard Routes
// ============================================

import { Router } from 'express';
import { dashboardService } from '../services/dashboard.service.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
router.get('/stats', async (_req, res) => {
  try {
    const stats = await dashboardService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Gagal mengambil statistik dashboard' });
  }
});

export default router;
