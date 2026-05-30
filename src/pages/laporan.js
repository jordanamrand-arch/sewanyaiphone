// ============================================
// Sewanya iPhone — Laporan Bulanan
// ============================================

import { store } from '../store.js';
import { formatRupiah, formatDateTime } from '../utils/format.js';

export function renderLaporan() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  const transactions = store.getTransactions().filter(t => t.status_pembayaran !== 'menunggu_dp');
  
  // Aggregate by month (YYYY-MM)
  const monthlyData = {};
  
  transactions.forEach(tx => {
    const date = new Date(tx.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        label: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        timestamp: date.getTime(),
        totalTransaksi: 0,
        totalSelesai: 0,
        totalPendapatan: 0,
        unitDisewa: new Set(),
      };
    }
    
    const data = monthlyData[monthKey];
    data.totalTransaksi++;
    if (tx.status_rental === 'selesai') {
      data.totalSelesai++;
    }
    data.totalPendapatan += (tx.total_harga || 0);
    data.unitDisewa.add(tx.iphone_id);
  });
  
  const sortedMonths = Object.values(monthlyData).sort((a, b) => b.timestamp - a.timestamp);

  mainContent.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <h1>
          <i data-lucide="file-bar-chart"></i>
          Laporan Keuangan
        </h1>
        <p class="text-muted">Rekapitulasi pendapatan dan penyewaan per bulan</p>
      </div>

      <div class="data-table-wrapper" style="margin-top: var(--space-xl);">
        <table class="data-table">
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Total Transaksi</th>
              <th>Transaksi Selesai</th>
              <th>Unit Disewa Unik</th>
              <th style="text-align: right;">Total Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            ${sortedMonths.length > 0 ? sortedMonths.map(m => `
              <tr>
                <td><strong>${m.label}</strong></td>
                <td>${m.totalTransaksi}</td>
                <td>
                  <span class="badge badge-aktif">${m.totalSelesai}</span>
                </td>
                <td>${m.unitDisewa.size} unit</td>
                <td style="text-align: right; color: #22c55e; font-weight: 600;">
                  ${formatRupiah(m.totalPendapatan)}
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="text-align: center; padding: 2rem;">Belum ada data transaksi</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}
