// ============================================
// Sewanya iPhone — Transaction Routes
// ============================================

import { Router } from 'express';
import { transactionService } from '../services/transaction.service.js';
import { iphoneService } from '../services/iphone.service.js';
import { logService } from '../services/log.service.js';

const router = Router();

const STATUS_RENTAL_LABELS: Record<string, string> = {
  booking: 'Booking',
  aktif_disewa: 'Aktif Disewa',
  selesai: 'Selesai',
  terlambat: 'Terlambat',
};

const STATUS_BAYAR_LABELS: Record<string, string> = {
  menunggu_dp: 'Menunggu DP',
  sudah_dp: 'Sudah DP',
  lunas: 'Lunas',
};

/**
 * GET /api/transactions
 * List transactions with filter, search, and pagination
 * Query: ?filter=booking|aktif_disewa|selesai|terlambat&search=keyword&page=1&perPage=10
 */
router.get('/', async (req, res) => {
  try {
    const { filter, search, page, perPage } = req.query;
    const result = await transactionService.getAll(
      filter as string,
      search as string,
      page ? Number(page) : 1,
      perPage ? Number(perPage) : 10
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Gagal mengambil data transaksi' });
  }
});

/**
 * GET /api/transactions/check-availability
 * Check if an iPhone is available for a time range
 * Query: ?iphoneId=uuid&start=ISO&end=ISO&excludeTx=txId
 */
router.get('/check-availability', async (req, res) => {
  try {
    const { iphoneId, start, end, excludeTx } = req.query;
    if (!iphoneId || !start || !end) {
      res.status(400).json({
        error: 'Parameter iphoneId, start, dan end wajib diisi',
      });
      return;
    }
    const available = await transactionService.checkAvailability(
      iphoneId as string,
      start as string,
      end as string,
      excludeTx as string
    );
    res.json({ available });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Gagal mengecek ketersediaan' });
  }
});

/**
 * GET /api/transactions/:id
 * Get a single transaction by ID with related data
 */
router.get('/:id', async (req, res) => {
  try {
    const tx = await transactionService.getById(req.params.id);
    if (!tx) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      return;
    }
    res.json(tx);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Gagal mengambil data transaksi' });
  }
});

/**
 * POST /api/transactions
 * Create a new transaction
 */
router.post('/', async (req, res) => {
  try {
    const {
      iphoneId,
      customerName,
      customerWhatsapp,
      startTime,
      endTime,
      dpAmount,
      settlementAmount,
      totalPrice,
      penaltyAmount,
      penaltyNote,
      paymentStatus,
      rentalStatus,
    } = req.body;

    // Validation
    if (!iphoneId || !customerName || !customerWhatsapp || !startTime || !endTime || !totalPrice) {
      res.status(400).json({ error: 'Semua field wajib diisi' });
      return;
    }

    // Check availability
    const available = await transactionService.checkAvailability(
      iphoneId,
      startTime,
      endTime
    );
    if (!available) {
      res.status(409).json({
        error: 'Unit tidak tersedia di jadwal tersebut! Ada konflik dengan transaksi lain.',
      });
      return;
    }

    const tx = await transactionService.create({
      userId: req.user!.id,
      iphoneId,
      customerName,
      customerWhatsapp,
      startTime,
      endTime,
      dpAmount: dpAmount || 0,
      settlementAmount: settlementAmount || 0,
      totalPrice,
      penaltyAmount: penaltyAmount || 0,
      penaltyNote: penaltyNote || null,
      paymentStatus: paymentStatus || 'menunggu_dp',
      rentalStatus: rentalStatus || 'booking',
    });

    const iphone = await iphoneService.getById(iphoneId);
    await logService.create(
      req.user!.id,
      `Membuat transaksi baru ${tx.txNumber} untuk ${iphone?.model} — Pelanggan: ${customerName}`
    );

    res.status(201).json(tx);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Gagal membuat transaksi' });
  }
});

/**
 * PUT /api/transactions/:id
 * Update a transaction (status changes, payment updates)
 */
router.put('/:id', async (req, res) => {
  try {
    const existing = await transactionService.getById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      return;
    }

    const updated = await transactionService.update(req.params.id, req.body);

    // Log status changes
    if (req.body.rentalStatus && req.body.rentalStatus !== existing.rentalStatus) {
      const oldLabel = STATUS_RENTAL_LABELS[existing.rentalStatus] || existing.rentalStatus;
      const newLabel = STATUS_RENTAL_LABELS[req.body.rentalStatus] || req.body.rentalStatus;
      await logService.create(
        req.user!.id,
        `Mengubah status rental ${existing.txNumber} dari ${oldLabel} menjadi ${newLabel}`
      );
    }

    if (req.body.paymentStatus && req.body.paymentStatus !== existing.paymentStatus) {
      const oldLabel = STATUS_BAYAR_LABELS[existing.paymentStatus] || existing.paymentStatus;
      const newLabel = STATUS_BAYAR_LABELS[req.body.paymentStatus] || req.body.paymentStatus;
      await logService.create(
        req.user!.id,
        `Mengubah status pembayaran ${existing.txNumber} dari ${oldLabel} menjadi ${newLabel}`
      );
    }

    // Log penalty changes
    if (req.body.penaltyAmount !== undefined && req.body.penaltyAmount !== existing.penaltyAmount) {
      const note = req.body.penaltyNote ? ` — Keterangan: ${req.body.penaltyNote}` : '';
      if (req.body.penaltyAmount > 0) {
        await logService.create(
          req.user!.id,
          `Mengubah denda ${existing.txNumber} menjadi Rp ${Number(req.body.penaltyAmount).toLocaleString('id-ID')}${note}`
        );
      } else {
        await logService.create(
          req.user!.id,
          `Menghapus denda pada transaksi ${existing.txNumber}`
        );
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Gagal memperbarui transaksi' });
  }
});

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await transactionService.getById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      return;
    }

    await transactionService.delete(req.params.id);

    await logService.create(
      req.user!.id,
      `Menghapus transaksi ${existing.txNumber}`
    );

    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Gagal menghapus transaksi' });
  }
});

export default router;
