// ============================================
// Sewanya iPhone — Pricing Service
// ============================================

import { db } from '../db/index.js';
import { pricingTier } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

interface CreatePricingData {
  iphoneId: string;
  durationType: 'jam' | 'hari';
  duration: number;
  price: number;
}

interface UpdatePricingData {
  iphoneId?: string;
  durationType?: 'jam' | 'hari';
  duration?: number;
  price?: number;
}

export const pricingService = {
  /**
   * Get all pricing tiers across all iPhones
   */
  async getAll() {
    return db.select().from(pricingTier).orderBy(pricingTier.durationType, pricingTier.duration);
  },

  /**
   * Get all pricing tiers for an iPhone
   */
  async getByIphone(iphoneId: string) {
    return db
      .select()
      .from(pricingTier)
      .where(eq(pricingTier.iphoneId, iphoneId))
      .orderBy(pricingTier.durationType, pricingTier.duration);
  },

  /**
   * Get a specific pricing tier
   */
  async getTier(
    iphoneId: string,
    durationType: 'jam' | 'hari',
    duration: number
  ) {
    const result = await db
      .select()
      .from(pricingTier)
      .where(
        and(
          eq(pricingTier.iphoneId, iphoneId),
          eq(pricingTier.durationType, durationType),
          eq(pricingTier.duration, duration)
        )
      )
      .limit(1);
    return result[0] || null;
  },

  /**
   * Get a pricing tier by ID
   */
  async getById(id: string) {
    const result = await db
      .select()
      .from(pricingTier)
      .where(eq(pricingTier.id, id))
      .limit(1);
    return result[0] || null;
  },

  /**
   * Create a new pricing tier
   */
  async create(data: CreatePricingData) {
    const result = await db
      .insert(pricingTier)
      .values({
        iphoneId: data.iphoneId,
        durationType: data.durationType,
        duration: data.duration,
        price: data.price,
      })
      .returning();
    return result[0];
  },

  /**
   * Update a pricing tier
   */
  async update(id: string, data: UpdatePricingData) {
    const result = await db
      .update(pricingTier)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(pricingTier.id, id))
      .returning();
    return result[0] || null;
  },

  /**
   * Delete a pricing tier
   */
  async delete(id: string) {
    await db.delete(pricingTier).where(eq(pricingTier.id, id));
  },
};
