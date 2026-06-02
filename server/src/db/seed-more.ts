import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

const { Pool } = pkg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seedMore() {
  console.log('🌱 Starting to seed more dummy data for charts...');

  // 1. Get existing admin and iphone
  const users = await db.select().from(schema.user).limit(1);
  if (users.length === 0) {
    console.error('No users found. Run normal seed first.');
    process.exit(1);
  }
  const admin = users[0];

  const iphones = await db.select().from(schema.iphone).limit(3);
  if (iphones.length === 0) {
    console.error('No iphones found.');
    process.exit(1);
  }

  // Generate random dates in the past 60 days
  const transactions = [];
  const logs = [];

  for (let i = 6; i <= 35; i++) {
    const daysAgo = Math.floor(Math.random() * 60); // 0 to 60 days ago
    const duration = Math.floor(Math.random() * 3) + 1; // 1 to 3 days
    
    const start = new Date();
    start.setDate(start.getDate() - daysAgo);
    start.setHours(10, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + duration);

    const pricePerDay = 300000;
    const totalPrice = duration * pricePerDay;
    const iphoneId = iphones[i % iphones.length].id;
    
    const txId = `TX-${String(i).padStart(3, '0')}`;
    
    transactions.push({
      txNumber: txId,
      userId: admin.id,
      iphoneId: iphoneId,
      customerName: `Pelanggan Dummy ${i}`,
      customerWhatsapp: `0812345678${i}`,
      startTime: start,
      endTime: end,
      dpAmount: totalPrice,
      settlementAmount: 0,
      totalPrice: totalPrice,
      paymentStatus: 'lunas' as const,
      rentalStatus: 'selesai' as const, // mostly completed
      createdAt: start,
      updatedAt: end,
    });
    
    logs.push({
      userId: admin.id,
      activity: `Menambahkan transaksi ${txId}`,
      createdAt: start,
    });
  }

  // Insert transactions
  try {
    for (const tx of transactions) {
      await db.insert(schema.transaction).values(tx).onConflictDoNothing({ target: schema.transaction.txNumber });
    }
    console.log(`✅ ${transactions.length} more transactions created.`);
    
    for (const log of logs) {
      await db.insert(schema.activityLog).values(log);
    }
    console.log(`✅ ${logs.length} more logs created.`);
  } catch (error) {
    console.error('Error inserting data:', error);
  }

  console.log('✅ Done!');
  process.exit(0);
}

seedMore();
