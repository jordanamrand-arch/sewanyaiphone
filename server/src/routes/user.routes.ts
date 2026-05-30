// ============================================
// Sewanya iPhone — User Routes
// ============================================

import { Router } from 'express';
import { userService } from '../services/user.service.js';
import { logService } from '../services/log.service.js';
import { requireRole } from '../middleware/role.js';
import { auth } from '../auth/index.js';
import { fromNodeHeaders } from 'better-auth/node';

const router = Router();

/**
 * GET /api/users
 * List all users (owner only)
 */
router.get('/', requireRole('owner'), async (_req, res) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
  try {
    const user = await userService.getById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Gagal mengambil profil' });
  }
});

/**
 * GET /api/users/:id
 * Get a user by ID (owner or self)
 */
router.get('/:id', async (req, res) => {
  try {
    // Only owner can view other users
    if (req.params.id !== req.user!.id && req.user!.role !== 'owner') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const user = await userService.getById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

/**
 * PUT /api/users/:id
 * Update a user (owner or self, role change owner only)
 */
router.put('/:id', async (req, res) => {
  try {
    const isSelf = req.params.id === req.user!.id;
    const isOwner = req.user!.role === 'owner';

    // Only owner can edit other users
    if (!isSelf && !isOwner) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Only owner can change roles
    if (req.body.role && !isOwner) {
      res.status(403).json({ error: 'Hanya owner yang bisa mengubah role' });
      return;
    }

    const { name, email, role } = req.body;
    const updateData: { name?: string; email?: string; role?: 'owner' | 'karyawan' } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role && isOwner) updateData.role = role;

    const updated = await userService.update(req.params.id, updateData);

    if (!updated) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    await logService.create(
      req.user!.id,
      isSelf
        ? 'Memperbarui profil pengguna'
        : `Mengubah data user: ${updated.name}`
    );

    res.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Gagal memperbarui user' });
  }
});

/**
 * POST /api/users
 * Create a new user (owner only) — uses Better Auth sign-up
 */
router.post('/', requireRole('owner'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
      return;
    }

    // Use Better Auth to create the user (handles password hashing)
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        role: role || 'karyawan',
      },
    });

    await logService.create(
      req.user!.id,
      `Menambahkan user baru: ${name} (${role || 'karyawan'})`
    );

    res.status(201).json({ user: result.user });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      res.status(409).json({ error: 'Email sudah terdaftar' });
      return;
    }
    res.status(500).json({ error: 'Gagal menambahkan user' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user (owner only, cannot delete self)
 */
router.delete('/:id', requireRole('owner'), async (req, res) => {
  try {
    const id = req.params.id as string;
    if (id === req.user!.id) {
      res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
      return;
    }

    const existing = await userService.getById(id);
    if (!existing) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    await userService.delete(id);

    await logService.create(
      req.user!.id,
      `Menghapus user: ${existing.name}`
    );

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Gagal menghapus user' });
  }
});

export default router;
