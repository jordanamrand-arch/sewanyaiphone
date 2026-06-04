// ============================================
// Sewanya iPhone — Format Utilities
// ============================================

/**
 * Format angka ke format Rupiah Indonesia
 * @param {number} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

/**
 * Parse string Rupiah ke number
 * @param {string} str
 * @returns {number}
 */
export function parseRupiah(str) {
  if (!str) return 0;
  return Number(String(str).replace(/[^0-9]/g, '')) || 0;
}

/**
 * Format datetime ke string Indonesia
 * @param {string|Date} date
 * @param {boolean} includeTime
 * @returns {string}
 */
export function formatDateTime(date, includeTime = true) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return d.toLocaleDateString('id-ID', options);
}

/**
 * Format date ke YYYY-MM-DD
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateInput(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/**
 * Format date untuk nama file (YYYYMMDD_HHMMSS)
 * @param {string|Date} date 
 * @returns {string}
 */
export function formatDateForFileName(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/**
 * Format date ke datetime-local input value
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTimeInput(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Format relative time (waktu relatif)
 * @param {string|Date} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  const now = new Date();
  const diffMs = d - now;
  const diffMins = Math.floor(Math.abs(diffMs) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const isPast = diffMs < 0;

  if (diffMins < 1) return 'baru saja';
  if (diffMins < 60) return `${diffMins} menit ${isPast ? 'lalu' : 'lagi'}`;
  if (diffHours < 24) return `${diffHours} jam ${isPast ? 'lalu' : 'lagi'}`;
  return `${diffDays} hari ${isPast ? 'lalu' : 'lagi'}`;
}

/**
 * Hitung sisa waktu dalam format countdown
 * @param {string|Date} endDate
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, isOverdue: boolean, text: string }}
 */
export function getCountdown(endDate) {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end - now;
  const isOverdue = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  let text = '';
  if (days > 0) text += `${days}h `;
  if (hours > 0) text += `${hours}j `;
  text += `${minutes}m ${seconds}d`;

  if (isOverdue) text = `Terlambat ${text}`;

  return { days, hours, minutes, seconds, isOverdue, text };
}

/**
 * Generate ID transaksi (TX-001, TX-002, dst)
 * @param {number} num
 * @returns {string}
 */
export function generateTxId(num) {
  return `TX-${String(num).padStart(3, '0')}`;
}

/**
 * Format nomor WhatsApp ke format internasional
 * @param {string} number
 * @returns {string}
 */
export function formatWhatsApp(number) {
  if (!number) return '';
  let clean = number.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean;
}

/**
 * Generate WhatsApp chat URL
 * @param {string} number
 * @param {string} [message]
 * @returns {string}
 */
export function getWhatsAppUrl(number, message = '') {
  const formatted = formatWhatsApp(number);
  let url = `https://wa.me/${formatted}`;
  if (message) url += `?text=${encodeURIComponent(message)}`;
  return url;
}

/**
 * Format durasi ke string readable
 * @param {string} jenis - 'jam' atau 'hari'
 * @param {number} durasi
 * @returns {string}
 */
export function formatDurasi(jenis, durasi) {
  if (jenis === 'jam') return `${durasi} Jam`;
  return `${durasi} Hari`;
}

/**
 * Truncate string
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
export function truncate(str, max = 30) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

/**
 * Hitung durasi (selisih hari/jam) antara dua tanggal
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {string}
 */
export function calculateDurationString(startDate, endDate) {
  if (!startDate || !endDate) return '-';
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = Math.abs(end - start);
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  if (diffHours >= 24 && diffHours % 24 === 0) {
    return `${diffHours / 24} Hari`;
  }
  return `${diffHours} Jam`;
}

/**
 * Download CSV file
 * @param {Array<Object>} data 
 * @param {string} filename 
 */
export function exportToCSV(data, filename) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + (val || '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const blob = new Blob([csvRows.join('\\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  a.click();
  window.URL.revokeObjectURL(url);
}
