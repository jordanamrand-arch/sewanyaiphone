// ============================================
// Sewanya iPhone — iPhone Routes
// ============================================

import { Router } from 'express';
import { iphoneService } from '../services/iphone.service.js';
import { logService } from '../services/log.service.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

/**
 * GET /api/iphones
 * List all iPhones with optional filter and search
 * Query: ?status=ready|servis&search=keyword
 */
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const iphones = await iphoneService.getAll(
      status as string,
      search as string
    );
    res.json(iphones);
  } catch (error) {
    console.error('Error fetching iPhones:', error);
    res.status(500).json({ error: 'Gagal mengambil data iPhone' });
  }
});

/**
 * GET /api/iphones/available
 * Get available iPhones for a date range
 * Query: ?start=ISO&end=ISO&excludeTx=txId
 */
router.get('/available', async (req, res) => {
  try {
    const { start, end, excludeTx } = req.query;
    if (!start || !end) {
      res
        .status(400)
        .json({ error: 'Parameter start dan end wajib diisi' });
      return;
    }
    const available = await iphoneService.getAvailable(
      start as string,
      end as string,
      excludeTx as string
    );
    res.json(available);
  } catch (error) {
    console.error('Error fetching available iPhones:', error);
    res.status(500).json({ error: 'Gagal mengambil data unit tersedia' });
  }
});

/**
 * GET /api/iphones/:id
 * Get a single iPhone by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const iphone = await iphoneService.getById(req.params.id);
    if (!iphone) {
      res.status(404).json({ error: 'iPhone tidak ditemukan' });
      return;
    }
    res.json(iphone);
  } catch (error) {
    console.error('Error fetching iPhone:', error);
    res.status(500).json({ error: 'Gagal mengambil data iPhone' });
  }
});

/**
 * POST /api/iphones
 * Create a new iPhone
 */
router.post('/', async (req, res) => {
  try {
    const { model, serialNumber, color, batteryHealth, physicalStatus } =
      req.body;

    if (!model || !serialNumber || !color) {
      res
        .status(400)
        .json({ error: 'Model, nomor seri, dan warna wajib diisi' });
      return;
    }

    const iphone = await iphoneService.create({
      model,
      serialNumber,
      color,
      batteryHealth: batteryHealth ?? 100,
      physicalStatus: physicalStatus || 'ready',
    });

    await logService.create(
      req.user!.id,
      `Menambahkan unit baru: ${model} — IMEI ${serialNumber}`
    );

    res.status(201).json(iphone);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Nomor seri/IMEI sudah terdaftar' });
      return;
    }
    console.error('Error creating iPhone:', error);
    res.status(500).json({ error: 'Gagal menambahkan iPhone' });
  }
});

/**
 * PUT /api/iphones/:id
 * Update an iPhone
 */
router.put('/:id', async (req, res) => {
  try {
    const existing = await iphoneService.getById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'iPhone tidak ditemukan' });
      return;
    }

    const updated = await iphoneService.update(req.params.id, req.body);

    await logService.create(
      req.user!.id,
      `Mengubah unit: ${updated!.model} — IMEI ${updated!.serialNumber}`
    );

    res.json(updated);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Nomor seri/IMEI sudah terdaftar' });
      return;
    }
    console.error('Error updating iPhone:', error);
    res.status(500).json({ error: 'Gagal memperbarui iPhone' });
  }
});

/**
 * DELETE /api/iphones/:id
 * Delete an iPhone (owner only)
 */
router.delete('/:id', requireRole('owner'), async (req, res) => {
  try {
    const id = req.params.id as string;
    const existing = await iphoneService.getById(id);
    if (!existing) {
      res.status(404).json({ error: 'iPhone tidak ditemukan' });
      return;
    }

    await iphoneService.delete(id);

    await logService.create(
      req.user!.id,
      `Menghapus unit: ${existing.model} — IMEI ${existing.serialNumber}`
    );

    res.json({ message: 'iPhone berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting iPhone:', error);
    res.status(500).json({ error: 'Gagal menghapus iPhone' });
  }
});

export default router;
