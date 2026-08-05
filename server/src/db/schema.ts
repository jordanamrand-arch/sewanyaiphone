// ============================================
// Sewanya iPhone — Drizzle ORM Schema
// ============================================

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ============ Enums ============

export const userRoleEnum = pgEnum('user_role', ['owner', 'karyawan']);
export const physicalStatusEnum = pgEnum('physical_status', ['ready', 'servis']);
export const durationTypeEnum = pgEnum('duration_type', ['jam', 'hari']);
export const paymentStatusEnum = pgEnum('payment_status', [
  'menunggu_dp',
  'sudah_dp',
  'lunas',
]);
export const rentalStatusEnum = pgEnum('rental_status', [
  'booking',
  'aktif_disewa',
  'selesai',
  'terlambat',
]);

// ============ Better Auth Tables ============

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: userRoleEnum('role').notNull().default('karyawan'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ Application Tables ============

export const iphone = pgTable('iphone', {
  id: uuid('id').primaryKey().defaultRandom(),
  model: text('model').notNull(),
  serialNumber: text('serial_number').notNull().unique(),
  color: text('color').notNull(),
  batteryHealth: integer('battery_health').notNull().default(100),
  physicalStatus: physicalStatusEnum('physical_status')
    .notNull()
    .default('ready'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pricingTier = pgTable(
  'pricing_tier',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    iphoneId: uuid('iphone_id')
      .notNull()
      .references(() => iphone.id, { onDelete: 'cascade' }),
    durationType: durationTypeEnum('duration_type').notNull(),
    duration: integer('duration').notNull(),
    price: integer('price').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('pricing_tier_unique_idx').on(
      table.iphoneId,
      table.durationType,
      table.duration
    ),
  ]
);

export const transaction = pgTable(
  'transaction',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    txNumber: text('tx_number').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    iphoneId: uuid('iphone_id')
      .notNull()
      .references(() => iphone.id),
    customerName: text('customer_name').notNull(),
    customerWhatsapp: text('customer_whatsapp').notNull(),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    dpAmount: integer('dp_amount').notNull().default(0),
    settlementAmount: integer('settlement_amount').notNull().default(0),
    totalPrice: integer('total_price').notNull(),
    penaltyAmount: integer('penalty_amount').notNull().default(0),
    penaltyNote: text('penalty_note'),
    paymentStatus: paymentStatusEnum('payment_status')
      .notNull()
      .default('menunggu_dp'),
    rentalStatus: rentalStatusEnum('rental_status')
      .notNull()
      .default('booking'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('transaction_iphone_status_idx').on(
      table.iphoneId,
      table.rentalStatus
    ),
    index('transaction_created_at_idx').on(table.createdAt),
  ]
);

export const activityLog = pgTable(
  'activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    activity: text('activity').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('activity_log_created_at_idx').on(table.createdAt)]
);
