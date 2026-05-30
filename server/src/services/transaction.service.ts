// ============================================
// Sewanya iPhone — Transaction Service
// ============================================

import { db } from '../db/index.js';
import { transaction, iphone, user } from '../db/schema.js';
import {
  eq,
  and,
  or,
  ne,
  lt,
  gt,
  desc,
  ilike,
  sql,
  count,
  gte,
} from 'drizzle-orm';

interface CreateTransactionData {
  userId: string;
  iphoneId: string;
  customerName: string;
  customerWhatsapp: string;
  startTime: string;
  endTime: string;
  dpAmount: number;
  settlementAmount: number;
  totalPrice: number;
  paymentStatus: 'menunggu_dp' | 'sudah_dp' | 'lunas';
  rentalStatus: 'booking' | 'aktif_disewa' | 'selesai' | 'terlambat';
}

interface UpdateTransactionData {
  customerName?: string;
  customerWhatsapp?: string;
  startTime?: string;
  endTime?: string;
  dpAmount?: number;
  settlementAmount?: number;
  totalPrice?: number;
  paymentStatus?: 'menunggu_dp' | 'sudah_dp' | 'lunas';
  rentalStatus?: 'booking' | 'aktif_disewa' | 'selesai' | 'terlambat';
}

export const transactionService = {
  /**
   * Get paginated transactions with optional filter and search
   */
  async getAll(
    filter?: string,
    search?: string,
    page: number = 1,
    perPage: number = 10
  ) {
    const conditions = [];

    if (filter && filter !== 'semua') {
      conditions.push(
        eq(
          transaction.rentalStatus,
          filter as 'booking' | 'aktif_disewa' | 'selesai' | 'terlambat'
        )
      );
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(transaction.txNumber, searchPattern),
          ilike(transaction.customerName, searchPattern)
        )!
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ total: count() })
      .from(transaction)
      .where(whereClause);
    const total = countResult[0]?.total || 0;

    // Get paginated data
    const offset = (page - 1) * perPage;
    const data = await db
      .select({
        id: transaction.id,
        txNumber: transaction.txNumber,
        userId: transaction.userId,
        iphoneId: transaction.iphoneId,
        customerName: transaction.customerName,
        customerWhatsapp: transaction.customerWhatsapp,
        startTime: transaction.startTime,
        endTime: transaction.endTime,
        dpAmount: transaction.dpAmount,
        settlementAmount: transaction.settlementAmount,
        totalPrice: transaction.totalPrice,
        paymentStatus: transaction.paymentStatus,
        rentalStatus: transaction.rentalStatus,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        iphoneModel: iphone.model,
        iphoneColor: iphone.color,
      })
      .from(transaction)
      .leftJoin(iphone, eq(transaction.iphoneId, iphone.id))
      .where(whereClause)
      .orderBy(desc(transaction.createdAt))
      .limit(perPage)
      .offset(offset);

    return {
      data,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  /**
   * Get a single transaction by ID with related data
   */
  async getById(id: string) {
    const result = await db
      .select({
        id: transaction.id,
        txNumber: transaction.txNumber,
        userId: transaction.userId,
        iphoneId: transaction.iphoneId,
        customerName: transaction.customerName,
        customerWhatsapp: transaction.customerWhatsapp,
        startTime: transaction.startTime,
        endTime: transaction.endTime,
        dpAmount: transaction.dpAmount,
        settlementAmount: transaction.settlementAmount,
        totalPrice: transaction.totalPrice,
        paymentStatus: transaction.paymentStatus,
        rentalStatus: transaction.rentalStatus,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        iphoneModel: iphone.model,
        iphoneSerialNumber: iphone.serialNumber,
        iphoneColor: iphone.color,
        userName: user.name,
      })
      .from(transaction)
      .leftJoin(iphone, eq(transaction.iphoneId, iphone.id))
      .leftJoin(user, eq(transaction.userId, user.id))
      .where(eq(transaction.id, id))
      .limit(1);

    return result[0] || null;
  },

  /**
   * Generate the next sequential TX number (TX-001, TX-002, etc.)
   */
  async getNextTxNumber(): Promise<string> {
    const result = await db
      .select({ txNumber: transaction.txNumber })
      .from(transaction)
      .orderBy(desc(transaction.createdAt));

    let maxNum = 0;
    for (const row of result) {
      const match = row.txNumber.match(/TX-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    return `TX-${String(maxNum + 1).padStart(3, '0')}`;
  },

  /**
   * Create a new transaction
   */
  async create(data: CreateTransactionData) {
    const txNumber = await this.getNextTxNumber();

    const result = await db
      .insert(transaction)
      .values({
        txNumber,
        userId: data.userId,
        iphoneId: data.iphoneId,
        customerName: data.customerName,
        customerWhatsapp: data.customerWhatsapp,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        dpAmount: data.dpAmount,
        settlementAmount: data.settlementAmount,
        totalPrice: data.totalPrice,
        paymentStatus: data.paymentStatus,
        rentalStatus: data.rentalStatus,
      })
      .returning();

    return result[0];
  },

  /**
   * Update a transaction
   */
  async update(id: string, data: UpdateTransactionData) {
    const updateValues: any = { ...data, updatedAt: new Date() };

    if (data.startTime) updateValues.startTime = new Date(data.startTime);
    if (data.endTime) updateValues.endTime = new Date(data.endTime);

    const result = await db
      .update(transaction)
      .set(updateValues)
      .where(eq(transaction.id, id))
      .returning();

    return result[0] || null;
  },

  /**
   * Delete a transaction
   */
  async delete(id: string) {
    await db.delete(transaction).where(eq(transaction.id, id));
  },

  /**
   * Check if an iPhone is available for a time range (no overlapping active transactions)
   */
  async checkAvailability(
    iphoneId: string,
    startDate: string,
    endDate: string,
    excludeTxId?: string
  ): Promise<boolean> {
    const conditions = [
      eq(transaction.iphoneId, iphoneId),
      ne(transaction.rentalStatus, 'selesai'),
      lt(transaction.startTime, new Date(endDate)),
      gt(transaction.endTime, new Date(startDate)),
    ];

    if (excludeTxId) {
      conditions.push(ne(transaction.id, excludeTxId));
    }

    const conflicts = await db
      .select({ id: transaction.id })
      .from(transaction)
      .where(and(...conditions))
      .limit(1);

    return conflicts.length === 0;
  },
};
