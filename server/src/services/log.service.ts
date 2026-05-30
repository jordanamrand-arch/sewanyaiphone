// ============================================
// Sewanya iPhone — Activity Log Service
// ============================================

import { db } from '../db/index.js';
import { activityLog, user } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const logService = {
  /**
   * Get all activity logs, optionally filtered by user
   */
  async getAll(filterUserId?: string) {
    const conditions = filterUserId
      ? eq(activityLog.userId, filterUserId)
      : undefined;

    return db
      .select({
        id: activityLog.id,
        userId: activityLog.userId,
        activity: activityLog.activity,
        createdAt: activityLog.createdAt,
        userName: user.name,
        userRole: user.role,
      })
      .from(activityLog)
      .leftJoin(user, eq(activityLog.userId, user.id))
      .where(conditions)
      .orderBy(desc(activityLog.createdAt));
  },

  /**
   * Create a new activity log entry
   */
  async create(userId: string, activity: string) {
    const result = await db
      .insert(activityLog)
      .values({
        userId,
        activity,
      })
      .returning();
    return result[0];
  },
};
