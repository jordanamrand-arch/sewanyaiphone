// ============================================
// Sewanya iPhone — Seed Data (Demo)
// ============================================

export const SEED_USERS = [
  {
    id: 'user-1',
    nama: 'Jordan Admin',
    username: 'admin',
    password: 'admin123',
    role: 'owner',
  },
  {
    id: 'user-2',
    nama: 'Budi Karyawan',
    username: 'karyawan1',
    password: 'kary123',
    role: 'karyawan',
  },
];

export const SEED_IPHONES = [
  {
    id: 'iphone-1',
    model: 'iPhone 15 Pro Max',
    nomor_seri: '352910125678901',
    warna: 'Natural Titanium',
    battery_health: 95,
    status_fisik: 'ready',
  },
  {
    id: 'iphone-2',
    model: 'iPhone 15 Pro',
    nomor_seri: '352910125678902',
    warna: 'Blue Titanium',
    battery_health: 88,
    status_fisik: 'ready',
  },
  {
    id: 'iphone-3',
    model: 'iPhone 14 Pro Max',
    nomor_seri: '352910125678903',
    warna: 'Deep Purple',
    battery_health: 82,
    status_fisik: 'ready',
  },
  {
    id: 'iphone-4',
    model: 'iPhone 14',
    nomor_seri: '352910125678904',
    warna: 'Midnight',
    battery_health: 79,
    status_fisik: 'servis',
  },
  {
    id: 'iphone-5',
    model: 'iPhone 13 Pro',
    nomor_seri: '352910125678905',
    warna: 'Graphite',
    battery_health: 75,
    status_fisik: 'ready',
  },
  {
    id: 'iphone-6',
    model: 'iPhone 16 Pro Max',
    nomor_seri: '352910125678906',
    warna: 'Desert Titanium',
    battery_health: 100,
    status_fisik: 'ready',
  },
];

export const SEED_PRICING = [
  // iPhone 15 Pro Max
  { id: 'price-1', iphone_id: 'iphone-1', jenis_durasi: 'jam', durasi: 6, harga: 175000 },
  { id: 'price-2', iphone_id: 'iphone-1', jenis_durasi: 'jam', durasi: 12, harga: 300000 },
  { id: 'price-3', iphone_id: 'iphone-1', jenis_durasi: 'hari', durasi: 1, harga: 450000 },
  { id: 'price-4', iphone_id: 'iphone-1', jenis_durasi: 'hari', durasi: 2, harga: 800000 },
  { id: 'price-5', iphone_id: 'iphone-1', jenis_durasi: 'hari', durasi: 3, harga: 1100000 },
  // iPhone 15 Pro
  { id: 'price-6', iphone_id: 'iphone-2', jenis_durasi: 'jam', durasi: 6, harga: 150000 },
  { id: 'price-7', iphone_id: 'iphone-2', jenis_durasi: 'jam', durasi: 12, harga: 250000 },
  { id: 'price-8', iphone_id: 'iphone-2', jenis_durasi: 'hari', durasi: 1, harga: 400000 },
  { id: 'price-9', iphone_id: 'iphone-2', jenis_durasi: 'hari', durasi: 2, harga: 700000 },
  { id: 'price-10', iphone_id: 'iphone-2', jenis_durasi: 'hari', durasi: 3, harga: 1000000 },
  // iPhone 14 Pro Max
  { id: 'price-11', iphone_id: 'iphone-3', jenis_durasi: 'jam', durasi: 6, harga: 125000 },
  { id: 'price-12', iphone_id: 'iphone-3', jenis_durasi: 'jam', durasi: 12, harga: 200000 },
  { id: 'price-13', iphone_id: 'iphone-3', jenis_durasi: 'hari', durasi: 1, harga: 350000 },
  { id: 'price-14', iphone_id: 'iphone-3', jenis_durasi: 'hari', durasi: 2, harga: 600000 },
  { id: 'price-15', iphone_id: 'iphone-3', jenis_durasi: 'hari', durasi: 3, harga: 850000 },
  // iPhone 14
  { id: 'price-16', iphone_id: 'iphone-4', jenis_durasi: 'jam', durasi: 6, harga: 100000 },
  { id: 'price-17', iphone_id: 'iphone-4', jenis_durasi: 'hari', durasi: 1, harga: 250000 },
  { id: 'price-18', iphone_id: 'iphone-4', jenis_durasi: 'hari', durasi: 2, harga: 450000 },
  // iPhone 13 Pro
  { id: 'price-19', iphone_id: 'iphone-5', jenis_durasi: 'jam', durasi: 6, harga: 100000 },
  { id: 'price-20', iphone_id: 'iphone-5', jenis_durasi: 'hari', durasi: 1, harga: 250000 },
  { id: 'price-21', iphone_id: 'iphone-5', jenis_durasi: 'hari', durasi: 2, harga: 400000 },
  // iPhone 16 Pro Max
  { id: 'price-22', iphone_id: 'iphone-6', jenis_durasi: 'jam', durasi: 6, harga: 200000 },
  { id: 'price-23', iphone_id: 'iphone-6', jenis_durasi: 'jam', durasi: 12, harga: 350000 },
  { id: 'price-24', iphone_id: 'iphone-6', jenis_durasi: 'hari', durasi: 1, harga: 500000 },
  { id: 'price-25', iphone_id: 'iphone-6', jenis_durasi: 'hari', durasi: 2, harga: 900000 },
  { id: 'price-26', iphone_id: 'iphone-6', jenis_durasi: 'hari', durasi: 3, harga: 1300000 },
];

const now = new Date();
const h = (hours) => {
  const d = new Date(now);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
};
const daysAgo = (days, addHours = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() + addHours);
  return d.toISOString();
};

export const SEED_TRANSACTIONS = [
  {
    id: 'tx-1',
    tx_number: 'TX-001',
    user_id: 'user-1',
    iphone_id: 'iphone-1',
    nama_pelanggan: 'Andi Pratama',
    nomor_whatsapp: '08123456789',
    tanggal_waktu_mulai: daysAgo(1),
    tanggal_waktu_selesai: h(23),
    nominal_dp: 200000,
    nominal_pelunasan: 250000,
    total_harga: 450000,
    status_pembayaran: 'sudah_dp',
    status_rental: 'aktif_disewa',
    created_at: daysAgo(1),
  },
  {
    id: 'tx-2',
    tx_number: 'TX-002',
    user_id: 'user-2',
    iphone_id: 'iphone-2',
    nama_pelanggan: 'Siti Rahayu',
    nomor_whatsapp: '08567890123',
    tanggal_waktu_mulai: daysAgo(3),
    tanggal_waktu_selesai: daysAgo(1),
    nominal_dp: 400000,
    nominal_pelunasan: 0,
    total_harga: 400000,
    status_pembayaran: 'lunas',
    status_rental: 'selesai',
    created_at: daysAgo(3),
  },
  {
    id: 'tx-3',
    tx_number: 'TX-003',
    user_id: 'user-1',
    iphone_id: 'iphone-3',
    nama_pelanggan: 'Rudi Hartono',
    nomor_whatsapp: '08234567890',
    tanggal_waktu_mulai: daysAgo(2),
    tanggal_waktu_selesai: daysAgo(0, -2),
    nominal_dp: 350000,
    nominal_pelunasan: 0,
    total_harga: 350000,
    status_pembayaran: 'sudah_dp',
    status_rental: 'terlambat',
    created_at: daysAgo(2),
  },
  {
    id: 'tx-4',
    tx_number: 'TX-004',
    user_id: 'user-2',
    iphone_id: 'iphone-5',
    nama_pelanggan: 'Maya Angelina',
    nomor_whatsapp: '08345678901',
    tanggal_waktu_mulai: h(2),
    tanggal_waktu_selesai: h(8),
    nominal_dp: 50000,
    nominal_pelunasan: 50000,
    total_harga: 100000,
    status_pembayaran: 'menunggu_dp',
    status_rental: 'booking',
    created_at: daysAgo(0, -3),
  },
  {
    id: 'tx-5',
    tx_number: 'TX-005',
    user_id: 'user-1',
    iphone_id: 'iphone-6',
    nama_pelanggan: 'Dian Permata',
    nomor_whatsapp: '08987654321',
    tanggal_waktu_mulai: daysAgo(0, -5),
    tanggal_waktu_selesai: h(19),
    nominal_dp: 250000,
    nominal_pelunasan: 250000,
    total_harga: 500000,
    status_pembayaran: 'sudah_dp',
    status_rental: 'aktif_disewa',
    created_at: daysAgo(0, -5),
  },
];

export const SEED_LOGS = [
  {
    id: 'log-1',
    user_id: 'user-1',
    aktivitas: 'Membuat transaksi baru TX-001 untuk iPhone 15 Pro Max — Pelanggan: Andi Pratama',
    created_at: daysAgo(1),
  },
  {
    id: 'log-2',
    user_id: 'user-2',
    aktivitas: 'Membuat transaksi baru TX-002 untuk iPhone 15 Pro — Pelanggan: Siti Rahayu',
    created_at: daysAgo(3),
  },
  {
    id: 'log-3',
    user_id: 'user-2',
    aktivitas: 'Mengubah status TX-002 dari Aktif menjadi Selesai',
    created_at: daysAgo(1, 2),
  },
  {
    id: 'log-4',
    user_id: 'user-1',
    aktivitas: 'Membuat transaksi baru TX-003 untuk iPhone 14 Pro Max — Pelanggan: Rudi Hartono',
    created_at: daysAgo(2),
  },
  {
    id: 'log-5',
    user_id: 'user-2',
    aktivitas: 'Membuat transaksi baru TX-004 untuk iPhone 13 Pro — Pelanggan: Maya Angelina (Booking)',
    created_at: daysAgo(0, -3),
  },
  {
    id: 'log-6',
    user_id: 'user-1',
    aktivitas: 'Membuat transaksi baru TX-005 untuk iPhone 16 Pro Max — Pelanggan: Dian Permata',
    created_at: daysAgo(0, -5),
  },
  {
    id: 'log-7',
    user_id: 'user-1',
    aktivitas: 'Menambahkan unit baru: iPhone 16 Pro Max — IMEI 352910125678906',
    created_at: daysAgo(5),
  },
  {
    id: 'log-8',
    user_id: 'user-1',
    aktivitas: 'Mengubah status iPhone 14 menjadi Servis',
    created_at: daysAgo(4),
  },
];
