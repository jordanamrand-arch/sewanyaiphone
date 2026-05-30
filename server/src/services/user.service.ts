// ============================================
// Sewanya iPhone — User Service
// ============================================

import { db } from '../db/index.js';
import { user } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const userService = {
  /**
   * Get all users (excluding password-related data)
   */
  async getAll() {
    return db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user);
  },

  /**
   * Get a single user by ID
   */
  async getById(id: string) {
    const result = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return result[0] || null;
  },

  /**
   * Update a user's profile (name, email, role)
   * Note: Password changes should go through Better Auth
   */
  async update(id: string, data: { name?: string; email?: string; role?: 'owner' | 'karyawan' }) {
    const result = await db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    return result[0] || null;
  },

  /**
   * Delete a user
   */
  async delete(id: string) {
    await db.delete(user).where(eq(user.id, id));
  },
};
