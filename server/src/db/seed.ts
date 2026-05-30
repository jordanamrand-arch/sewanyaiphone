// ============================================
// Sewanya iPhone — Database Seed Script
// ============================================
// Run with: npm run db:seed
// Creates demo data matching the frontend seed-data.js

import 'dotenv/config';
import { db, pool } from './index.js';
import { iphone, pricingTier, transaction, activityLog } from './schema.js';
import { auth } from '../auth/index.js';
import { sql } from 'drizzle-orm';

// ============ Helpers ============

const now = new Date();

function hoursFromNow(hours: number): Date {
  const d = new Date(now);
  d.setHours(d.getHours() + hours);
  return d;
}

function daysAgo(days: number, addHours = 0): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() + addHours);
  return d;
}

// ============ Seed Data ============

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // ---- 1. Create users via Better Auth (handles password hashing) ----
  console.log('👤 Creating users...');

  let adminUser: { id: string };
  let karyawanUser: { id: string };

  try {
    const adminResult = await auth.api.signUpEmail({
      body: {
        name: 'Jordan Admin',
        email: 'admin@sewanya.com',
        password: 'admin123',
        role: 'owner',
      },
    });
    adminUser = adminResult.user;
    console.log(`   ✅ Admin: ${adminUser.id} (admin@sewanya.com / admin123)`);
  } catch (error: any) {
    console.log(`   ⚠️  Admin user may already exist: ${error.message}`);
    // Try to find existing user
    const existing = await db.execute(
      sql`SELECT id FROM "user" WHERE email = 'admin@sewanya.com' LIMIT 1`
    );
    adminUser = { id: (existing.rows[0] as any)?.id };
    if (!adminUser.id) {
      throw new Error('Failed to create or find admin user');
    }
  }

  try {
    const karyawanResult = await auth.api.signUpEmail({
      body: {
        name: 'Budi Karyawan',
        email: 'karyawan@sewanya.com',
        password: 'karyawan123',
        role: 'karyawan',
      },
    });
    karyawanUser = karyawanResult.user;
    console.log(`   ✅ Karyawan: ${karyawanUser.id} (karyawan@sewanya.com / karyawan123)`);
  } catch (error: any) {
    console.log(`   ⚠️  Karyawan user may already exist: ${error.message}`);
    const existing = await db.execute(
      sql`SELECT id FROM "user" WHERE email = 'karyawan@sewanya.com' LIMIT 1`
    );
    karyawanUser = { id: (existing.rows[0] as any)?.id };
    if (!karyawanUser.id) {
      throw new Error('Failed to create or find karyawan user');
    }
  }

  // ---- 2. Insert iPhones ----
  console.log('\n📱 Creating iPhone inventory...');

  const iphoneData = [
    { model: 'iPhone 15 Pro Max', serialNumber: '352910125678901', color: 'Natural Titanium', batteryHealth: 95, physicalStatus: 'ready' as const },
    { model: 'iPhone 15 Pro', serialNumber: '352910125678902', color: 'Blue Titanium', batteryHealth: 88, physicalStatus: 'ready' as const },
    { model: 'iPhone 14 Pro Max', serialNumber: '352910125678903', color: 'Deep Purple', batteryHealth: 82, physicalStatus: 'ready' as const },
    { model: 'iPhone 14', serialNumber: '352910125678904', color: 'Midnight', batteryHealth: 79, physicalStatus: 'servis' as const },
    { model: 'iPhone 13 Pro', serialNumber: '352910125678905', color: 'Graphite', batteryHealth: 75, physicalStatus: 'ready' as const },
    { model: 'iPhone 16 Pro Max', serialNumber: '352910125678906', color: 'Desert Titanium', batteryHealth: 100, physicalStatus: 'ready' as const },
  ];

  const insertedIphones = await db
    .insert(iphone)
    .values(iphoneData)
    .onConflictDoNothing({ target: iphone.serialNumber })
    .returning();

  // If no rows returned (already existed), fetch them
  let iphones = insertedIphones;
  if (iphones.length === 0) {
    iphones = await db.select().from(iphone);
  }

  const iphoneMap = new Map(iphones.map((i) => [i.serialNumber, i.id]));
  console.log(`   ✅ ${iphones.length} units ready`);

  // ---- 3. Insert Pricing Tiers ----
  console.log('\n💰 Creating pricing tiers...');

  const getIphoneId = (serial: string) => iphoneMap.get(serial)!;

  const pricingData = [
    // iPhone 15 Pro Max
    { iphoneId: getIphoneId('352910125678901'), durationType: 'jam' as const, duration: 6, price: 175000 },
    { iphoneId: getIphoneId('352910125678901'), durationType: 'jam' as const, duration: 12, price: 300000 },
    { iphoneId: getIphoneId('352910125678901'), durationType: 'hari' as const, duration: 1, price: 450000 },
    { iphoneId: getIphoneId('352910125678901'), durationType: 'hari' as const, duration: 2, price: 800000 },
    { iphoneId: getIphoneId('352910125678901'), durationType: 'hari' as const, duration: 3, price: 1100000 },
    // iPhone 15 Pro
    { iphoneId: getIphoneId('352910125678902'), durationType: 'jam' as const, duration: 6, price: 150000 },
    { iphoneId: getIphoneId('352910125678902'), durationType: 'jam' as const, duration: 12, price: 250000 },
    { iphoneId: getIphoneId('352910125678902'), durationType: 'hari' as const, duration: 1, price: 400000 },
    { iphoneId: getIphoneId('352910125678902'), durationType: 'hari' as const, duration: 2, price: 700000 },
    { iphoneId: getIphoneId('352910125678902'), durationType: 'hari' as const, duration: 3, price: 1000000 },
    // iPhone 14 Pro Max
    { iphoneId: getIphoneId('352910125678903'), durationType: 'jam' as const, duration: 6, price: 125000 },
    { iphoneId: getIphoneId('352910125678903'), durationType: 'jam' as const, duration: 12, price: 200000 },
    { iphoneId: getIphoneId('352910125678903'), durationType: 'hari' as const, duration: 1, price: 350000 },
    { iphoneId: getIphoneId('352910125678903'), durationType: 'hari' as const, duration: 2, price: 600000 },
    { iphoneId: getIphoneId('352910125678903'), durationType: 'hari' as const, duration: 3, price: 850000 },
    // iPhone 14
    { iphoneId: getIphoneId('352910125678904'), durationType: 'jam' as const, duration: 6, price: 100000 },
    { iphoneId: getIphoneId('352910125678904'), durationType: 'hari' as const, duration: 1, price: 250000 },
    { iphoneId: getIphoneId('352910125678904'), durationType: 'hari' as const, duration: 2, price: 450000 },
    // iPhone 13 Pro
    { iphoneId: getIphoneId('352910125678905'), durationType: 'jam' as const, duration: 6, price: 100000 },
    { iphoneId: getIphoneId('352910125678905'), durationType: 'hari' as const, duration: 1, price: 250000 },
    { iphoneId: getIphoneId('352910125678905'), durationType: 'hari' as const, duration: 2, price: 400000 },
    // iPhone 16 Pro Max
    { iphoneId: getIphoneId('352910125678906'), durationType: 'jam' as const, duration: 6, price: 200000 },
    { iphoneId: getIphoneId('352910125678906'), durationType: 'jam' as const, duration: 12, price: 350000 },
    { iphoneId: getIphoneId('352910125678906'), durationType: 'hari' as const, duration: 1, price: 500000 },
    { iphoneId: getIphoneId('352910125678906'), durationType: 'hari' as const, duration: 2, price: 900000 },
    { iphoneId: getIphoneId('352910125678906'), durationType: 'hari' as const, duration: 3, price: 1300000 },
  ];

  await db
    .insert(pricingTier)
    .values(pricingData)
    .onConflictDoNothing();

  console.log(`   ✅ ${pricingData.length} pricing tiers created`);

  // ---- 4. Insert Transactions ----
  console.log('\n📋 Creating demo transactions...');

  const transactionData = [
    {
      txNumber: 'TX-001',
      userId: adminUser.id,
      iphoneId: getIphoneId('352910125678901'),
      customerName: 'Andi Pratama',
      customerWhatsapp: '08123456789',
      startTime: daysAgo(1),
      endTime: hoursFromNow(23),
      dpAmount: 200000,
      settlementAmount: 250000,
      totalPrice: 450000,
      paymentStatus: 'sudah_dp' as const,
      rentalStatus: 'aktif_disewa' as const,
      createdAt: daysAgo(1),
    },
    {
      txNumber: 'TX-002',
      userId: karyawanUser.id,
      iphoneId: getIphoneId('352910125678902'),
      customerName: 'Siti Rahayu',
      customerWhatsapp: '08567890123',
      startTime: daysAgo(3),
      endTime: daysAgo(1),
      dpAmount: 400000,
      settlementAmount: 0,
      totalPrice: 400000,
      paymentStatus: 'lunas' as const,
      rentalStatus: 'selesai' as const,
      createdAt: daysAgo(3),
    },
    {
      txNumber: 'TX-003',
      userId: adminUser.id,
      iphoneId: getIphoneId('352910125678903'),
      customerName: 'Rudi Hartono',
      customerWhatsapp: '08234567890',
      startTime: daysAgo(2),
      endTime: daysAgo(0, -2),
      dpAmount: 350000,
      settlementAmount: 0,
      totalPrice: 350000,
      paymentStatus: 'sudah_dp' as const,
      rentalStatus: 'terlambat' as const,
      createdAt: daysAgo(2),
    },
    {
      txNumber: 'TX-004',
      userId: karyawanUser.id,
      iphoneId: getIphoneId('352910125678905'),
      customerName: 'Maya Angelina',
      customerWhatsapp: '08345678901',
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(8),
      dpAmount: 50000,
      settlementAmount: 50000,
      totalPrice: 100000,
      paymentStatus: 'menunggu_dp' as const,
      rentalStatus: 'booking' as const,
      createdAt: daysAgo(0, -3),
    },
    {
      txNumber: 'TX-005',
      userId: adminUser.id,
      iphoneId: getIphoneId('352910125678906'),
      customerName: 'Dian Permata',
      customerWhatsapp: '08987654321',
      startTime: daysAgo(0, -5),
      endTime: hoursFromNow(19),
      dpAmount: 250000,
      settlementAmount: 250000,
      totalPrice: 500000,
      paymentStatus: 'sudah_dp' as const,
      rentalStatus: 'aktif_disewa' as const,
      createdAt: daysAgo(0, -5),
    },
  ];

  await db
    .insert(transaction)
    .values(transactionData)
    .onConflictDoNothing({ target: transaction.txNumber });

  console.log(`   ✅ ${transactionData.length} transactions created`);

  // ---- 5. Insert Activity Logs ----
  console.log('\n📝 Creating activity logs...');

  const logData = [
    { userId: adminUser.id, activity: 'Membuat transaksi baru TX-001 untuk iPhone 15 Pro Max — Pelanggan: Andi Pratama', createdAt: daysAgo(1) },
    { userId: karyawanUser.id, activity: 'Membuat transaksi baru TX-002 untuk iPhone 15 Pro — Pelanggan: Siti Rahayu', createdAt: daysAgo(3) },
    { userId: karyawanUser.id, activity: 'Mengubah status TX-002 dari Aktif menjadi Selesai', createdAt: daysAgo(1, 2) },
    { userId: adminUser.id, activity: 'Membuat transaksi baru TX-003 untuk iPhone 14 Pro Max — Pelanggan: Rudi Hartono', createdAt: daysAgo(2) },
    { userId: karyawanUser.id, activity: 'Membuat transaksi baru TX-004 untuk iPhone 13 Pro — Pelanggan: Maya Angelina (Booking)', createdAt: daysAgo(0, -3) },
    { userId: adminUser.id, activity: 'Membuat transaksi baru TX-005 untuk iPhone 16 Pro Max — Pelanggan: Dian Permata', createdAt: daysAgo(0, -5) },
    { userId: adminUser.id, activity: 'Menambahkan unit baru: iPhone 16 Pro Max — IMEI 352910125678906', createdAt: daysAgo(5) },
    { userId: adminUser.id, activity: 'Mengubah status iPhone 14 menjadi Servis', createdAt: daysAgo(4) },
  ];

  await db.insert(activityLog).values(logData);

  console.log(`   ✅ ${logData.length} activity logs created`);

  // ---- Done ----
  console.log('\n══════════════════════════════════════');
  console.log('✅ Database seeded successfully!');
  console.log('══════════════════════════════════════');
  console.log('\n📧 Login credentials:');
  console.log('   Admin:    admin@sewanya.com / admin123');
  console.log('   Karyawan: karyawan@sewanya.com / karyawan123\n');
}

// ============ Run ============

seed()
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    process.exit(0);
  });
