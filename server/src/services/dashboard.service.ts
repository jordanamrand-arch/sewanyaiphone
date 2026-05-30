// ============================================
// Sewanya iPhone — Dashboard Service
// ============================================

import { db } from '../db/index.js';
import { iphone, transaction, user } from '../db/schema.js';
import {
  eq,
  and,
  or,
  count,
  sum,
  gte,
  ne,
  lt,
  gt,
  sql,
  notInArray,
} from 'drizzle-orm';

export const dashboardService = {
  /**
   * Get all dashboard statistics in a single call
   */
  async getStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    // Total units
    const totalUnitResult = await db
      .select({ total: count() })
      .from(iphone);
    const totalUnit = totalUnitResult[0]?.total || 0;

    // Active rentals count
    const sedangDisewaResult = await db
      .select({ total: count() })
      .from(transaction)
      .where(eq(transaction.rentalStatus, 'aktif_disewa'));
    const sedangDisewa = sedangDisewaResult[0]?.total || 0;

    // Booking count
    const bookingResult = await db
      .select({ total: count() })
      .from(transaction)
      .where(eq(transaction.rentalStatus, 'booking'));
    const booking = bookingResult[0]?.total || 0;

    // Late count
    const terlambatResult = await db
      .select({ total: count() })
      .from(transaction)
      .where(eq(transaction.rentalStatus, 'terlambat'));
    const terlambat = terlambatResult[0]?.total || 0;

    // Monthly revenue (excluding menunggu_dp)
    const revenueResult = await db
      .select({ total: sum(transaction.totalPrice) })
      .from(transaction)
      .where(
        and(
          gte(transaction.createdAt, monthStart),
          ne(transaction.paymentStatus, 'menunggu_dp')
        )
      );
    const pendapatanBulan = Number(revenueResult[0]?.total) || 0;

    // Active transactions (aktif_disewa + terlambat) — full data with iPhone info
    const transaksiAktif = await db
      .select({
        id: transaction.id,
        txNumber: transaction.txNumber,
        customerName: transaction.customerName,
        customerWhatsapp: transaction.customerWhatsapp,
        iphoneId: transaction.iphoneId,
        startTime: transaction.startTime,
        endTime: transaction.endTime,
        totalPrice: transaction.totalPrice,
        rentalStatus: transaction.rentalStatus,
        paymentStatus: transaction.paymentStatus,
        iphoneModel: iphone.model,
      })
      .from(transaction)
      .leftJoin(iphone, eq(transaction.iphoneId, iphone.id))
      .where(
        or(
          eq(transaction.rentalStatus, 'aktif_disewa'),
          eq(transaction.rentalStatus, 'terlambat')
        )
      );

    // Bookings starting today
    const bookingHariIni = await db
      .select({
        id: transaction.id,
        txNumber: transaction.txNumber,
        customerName: transaction.customerName,
        customerWhatsapp: transaction.customerWhatsapp,
        iphoneId: transaction.iphoneId,
        startTime: transaction.startTime,
        endTime: transaction.endTime,
        rentalStatus: transaction.rentalStatus,
        iphoneModel: iphone.model,
      })
      .from(transaction)
      .leftJoin(iphone, eq(transaction.iphoneId, iphone.id))
      .where(
        and(
          eq(transaction.rentalStatus, 'booking'),
          gte(transaction.startTime, todayStart),
          lt(transaction.startTime, todayEnd)
        )
      );

    // Available units: ready + not currently rented/booked
    const rentedIphoneIds = await db
      .select({ iphoneId: transaction.iphoneId })
      .from(transaction)
      .where(
        or(
          eq(transaction.rentalStatus, 'aktif_disewa'),
          eq(transaction.rentalStatus, 'booking')
        )
      );

    const rentedIds = rentedIphoneIds.map((r) => r.iphoneId);

    const availableConditions = [eq(iphone.physicalStatus, 'ready')];
    if (rentedIds.length > 0) {
      availableConditions.push(notInArray(iphone.id, rentedIds));
    }

    const unitTersedia = await db
      .select()
      .from(iphone)
      .where(and(...availableConditions));

    return {
      totalUnit,
      sedangDisewa,
      booking,
      terlambat,
      pendapatanBulan,
      transaksiAktif,
      bookingHariIni,
      unitTersedia,
    };
  },
};
