// ============================================
// Sewanya iPhone — iPhone Service
// ============================================

import { db } from '../db/index.js';
import { iphone, pricingTier, transaction } from '../db/schema.js';
import { eq, and, or, ne, lt, gt, ilike, sql, notInArray } from 'drizzle-orm';

interface CreateIphoneData {
  model: string;
  serialNumber: string;
  color: string;
  batteryHealth: number;
  physicalStatus: 'ready' | 'servis';
}

interface UpdateIphoneData {
  model?: string;
  serialNumber?: string;
  color?: string;
  batteryHealth?: number;
  physicalStatus?: 'ready' | 'servis';
}

export const iphoneService = {
  /**
   * Get all iPhones with optional filter and search
   */
  async getAll(filter?: string, search?: string) {
    let query = db.select().from(iphone);
    const conditions = [];

    if (filter && filter !== 'semua') {
      conditions.push(
        eq(iphone.physicalStatus, filter as 'ready' | 'servis')
      );
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(iphone.model, searchPattern),
          ilike(iphone.serialNumber, searchPattern),
          ilike(iphone.color, searchPattern)
        )!
      );
    }

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  },

  /**
   * Get a single iPhone by ID
   */
  async getById(id: string) {
    const result = await db
      .select()
      .from(iphone)
      .where(eq(iphone.id, id))
      .limit(1);
    return result[0] || null;
  },

  /**
   * Create a new iPhone
   */
  async create(data: CreateIphoneData) {
    const result = await db
      .insert(iphone)
      .values({
        model: data.model,
        serialNumber: data.serialNumber,
        color: data.color,
        batteryHealth: data.batteryHealth,
        physicalStatus: data.physicalStatus,
      })
      .returning();
    return result[0];
  },

  /**
   * Update an iPhone
   */
  async update(id: string, data: UpdateIphoneData) {
    const result = await db
      .update(iphone)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(iphone.id, id))
      .returning();
    return result[0] || null;
  },

  /**
   * Delete an iPhone (pricing cascade via FK)
   */
  async delete(id: string) {
    await db.delete(iphone).where(eq(iphone.id, id));
  },

  /**
   * Get available iPhones for a time range
   * An iPhone is available if:
   * 1. Its physical status is 'ready'
   * 2. It has no overlapping active transactions in the given time range
   */
  async getAvailable(
    startDate: string,
    endDate: string,
    excludeTxId?: string
  ) {
    // Get iPhones that have conflicting transactions
    const conflictConditions = [
      ne(transaction.rentalStatus, 'selesai'),
      lt(transaction.startTime, new Date(endDate)),
      gt(transaction.endTime, new Date(startDate)),
    ];

    if (excludeTxId) {
      conflictConditions.push(ne(transaction.id, excludeTxId));
    }

    const conflicting = await db
      .select({ iphoneId: transaction.iphoneId })
      .from(transaction)
      .where(and(...conflictConditions));

    const conflictingIds = conflicting.map((c) => c.iphoneId);

    // Get ready iPhones that are NOT in the conflicting list
    const conditions = [eq(iphone.physicalStatus, 'ready')];
    if (conflictingIds.length > 0) {
      conditions.push(notInArray(iphone.id, conflictingIds));
    }

    return db.select().from(iphone).where(and(...conditions));
  },
};
