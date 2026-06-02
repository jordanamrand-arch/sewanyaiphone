// ============================================
// Sewanya iPhone — Pricing Routes
// ============================================

import { Router } from 'express';
import { pricingService } from '../services/pricing.service.js';
import { logService } from '../services/log.service.js';
import { iphoneService } from '../services/iphone.service.js';

const router = Router();

/**
 * GET /api/pricing
 * Get pricing tiers for an iPhone
 * Query: ?iphoneId=uuid
 */
router.get('/', async (req, res) => {
  try {
    const { iphoneId } = req.query;
    if (iphoneId) {
      const pricing = await pricingService.getByIphone(iphoneId as string);
      res.json(pricing);
    } else {
      const allPricing = await pricingService.getAll();
      res.json(allPricing);
    }
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ error: 'Gagal mengambil data harga' });
  }
});

/**
 * POST /api/pricing
 * Create a new pricing tier
 */
router.post('/', async (req, res) => {
  try {
    const { iphoneId, durationType, duration, price } = req.body;

    if (!iphoneId || !durationType || duration == null || price == null) {
      res.status(400).json({ error: 'Semua field wajib diisi' });
      return;
    }

    // Check for duplicate
    const existing = await pricingService.getTier(
      iphoneId,
      durationType,
      Number(duration)
    );
    if (existing) {
      res.status(409).json({
        error: `Harga untuk ${duration} ${durationType} sudah ada`,
      });
      return;
    }

    const tier = await pricingService.create({
      iphoneId,
      durationType,
      duration: Number(duration),
      price: Number(price),
    });

    const iphone = await iphoneService.getById(iphoneId);
    await logService.create(
      req.user!.id,
      `Menambah harga baru ${iphone?.model}: ${duration} ${durationType} = Rp ${Number(price).toLocaleString('id-ID')}`
    );

    res.status(201).json(tier);
  } catch (error) {
    console.error('Error creating pricing:', error);
    res.status(500).json({ error: 'Gagal menambahkan harga' });
  }
});

/**
 * PUT /api/pricing/:id
 * Update a pricing tier
 */
router.put('/:id', async (req, res) => {
  try {
    const existing = await pricingService.getById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Harga tidak ditemukan' });
      return;
    }

    const { iphoneId, durationType, duration, price } = req.body;

    // Check for duplicate (exclude self)
    if (iphoneId && durationType && duration) {
      const dup = await pricingService.getTier(
        iphoneId,
        durationType,
        Number(duration)
      );
      if (dup && dup.id !== req.params.id) {
        res.status(409).json({
          error: `Harga untuk ${duration} ${durationType} sudah ada`,
        });
        return;
      }
    }

    const updated = await pricingService.update(req.params.id, {
      iphoneId,
      durationType,
      duration: duration ? Number(duration) : undefined,
      price: price ? Number(price) : undefined,
    });

    const iphone = await iphoneService.getById(
      updated!.iphoneId
    );
    await logService.create(
      req.user!.id,
      `Mengubah harga ${iphone?.model}: ${updated!.duration} ${updated!.durationType} = Rp ${updated!.price.toLocaleString('id-ID')}`
    );

    res.json(updated);
  } catch (error) {
    console.error('Error updating pricing:', error);
    res.status(500).json({ error: 'Gagal memperbarui harga' });
  }
});

/**
 * DELETE /api/pricing/:id
 * Delete a pricing tier
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await pricingService.getById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Harga tidak ditemukan' });
      return;
    }

    await pricingService.delete(req.params.id);

    const iphone = await iphoneService.getById(existing.iphoneId);
    await logService.create(
      req.user!.id,
      `Menghapus tier harga dari ${iphone?.model}`
    );

    res.json({ message: 'Harga berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting pricing:', error);
    res.status(500).json({ error: 'Gagal menghapus harga' });
  }
});

export default router;
