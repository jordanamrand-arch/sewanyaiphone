// ============================================
// Sewanya iPhone — Dashboard Page
// ============================================

import { store } from '../store.js';
import { formatRupiah, getCountdown, formatDateTime, getWhatsAppUrl } from '../utils/format.js';
import { navigate } from '../router.js';

let countdownInterval = null;

export function renderDashboard() {
  const stats = store.getDashboardStats();
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <h1>
          <i data-lucide="layout-dashboard"></i>
          Dashboard
        </h1>
      </div>

      <!-- Stat Cards -->
      <div class="stat-cards">
        <div class="stat-card" style="--stat-color: var(--accent-gradient); --stat-bg: rgba(99, 102, 241, 0.12); --stat-icon-color: var(--accent-start);">
          <div class="stat-card-header">
            <span class="stat-card-label">Total Unit</span>
            <div class="stat-card-icon">
              <i data-lucide="smartphone"></i>
            </div>
          </div>
          <div class="stat-card-value">${stats.totalUnit}</div>
        </div>

        <div class="stat-card" style="--stat-color: linear-gradient(135deg, #3b82f6, #60a5fa); --stat-bg: rgba(59, 130, 246, 0.12); --stat-icon-color: #3b82f6;">
          <div class="stat-card-header">
            <span class="stat-card-label">Sedang Disewa</span>
            <div class="stat-card-icon">
              <i data-lucide="repeat"></i>
            </div>
          </div>
          <div class="stat-card-value">${stats.sedangDisewa}</div>
        </div>

        <div class="stat-card" style="--stat-color: linear-gradient(135deg, #a78bfa, #c4b5fd); --stat-bg: rgba(167, 139, 250, 0.12); --stat-icon-color: #a78bfa;">
          <div class="stat-card-header">
            <span class="stat-card-label">Booking</span>
            <div class="stat-card-icon">
              <i data-lucide="calendar-clock"></i>
            </div>
          </div>
          <div class="stat-card-value">${stats.booking}</div>
        </div>

        <div class="stat-card" style="--stat-color: linear-gradient(135deg, #22c55e, #4ade80); --stat-bg: rgba(34, 197, 94, 0.12); --stat-icon-color: #22c55e;">
          <div class="stat-card-header">
            <span class="stat-card-label">Pendapatan Bulan Ini</span>
            <div class="stat-card-icon">
              <i data-lucide="wallet"></i>
            </div>
          </div>
          <div class="stat-card-value" style="font-size: 1.5rem;">${formatRupiah(stats.pendapatanBulan)}</div>
        </div>
      </div>

      <!-- Alerts Section -->
      <div class="section-header">
        <h2 class="section-title">
          <i data-lucide="bell"></i>
          Perlu Perhatian
        </h2>
      </div>

      <div class="alert-cards" id="alert-section">
        ${renderAlerts(stats)}
      </div>

      <!-- Revenue Chart -->
      <div class="section-header" style="margin-top: var(--space-xl);">
        <h2 class="section-title">
          <i data-lucide="bar-chart-3"></i>
          Grafik Pendapatan Mingguan
        </h2>
      </div>
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-lg); box-shadow: var(--shadow-sm); height: 300px; position: relative;">
        <canvas id="revenueChart"></canvas>
      </div>

      <!-- Active Transactions -->
      <div class="section-header">
        <h2 class="section-title">
          <i data-lucide="clock"></i>
          Transaksi Aktif
        </h2>
      </div>

      ${stats.transaksiAktif.length > 0 ? `
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Pelanggan</th>
                <th>Unit</th>
                <th>Sisa Waktu</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="active-tx-body">
              ${renderActiveTransactions(stats.transaksiAktif)}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state" style="padding: var(--space-xl);">
          <i data-lucide="coffee" class="empty-state-icon"></i>
          <p class="empty-state-title">Tidak ada transaksi aktif</p>
          <p class="empty-state-desc">Semua unit tersedia untuk disewa</p>
        </div>
      `}

      <!-- Available Units -->
      <div class="section-header" style="margin-top: var(--space-xl);">
        <h2 class="section-title">
          <i data-lucide="check-circle"></i>
          Unit Tersedia
        </h2>
      </div>

      <div class="unit-chips" id="available-chips">
        ${stats.unitTersedia.length > 0
      ? stats.unitTersedia.map(u => `
              <span class="chip" data-id="${u.id}" onclick="window.location.hash='#/inventaris'">
                <i data-lucide="smartphone" style="width: 14px; height: 14px;"></i>
                ${u.model}
              </span>
            `).join('')
      : '<p class="text-muted text-sm">Semua unit sedang disewa atau dalam servis</p>'
    }
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Add click handlers for detail buttons
  mainContent.querySelectorAll('.tx-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(`/transaksi/${btn.dataset.id}`);
    });
  });

  // Initialize Revenue Chart
  initRevenueChart();

  // Live countdown updates
  countdownInterval = setInterval(() => {
    const body = document.getElementById('active-tx-body');
    if (body && stats.transaksiAktif.length > 0) {
      body.innerHTML = renderActiveTransactions(stats.transaksiAktif);
      if (window.lucide) lucide.createIcons();
    }
  }, 1000);

  // Return cleanup
  return () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  };
}

import Chart from 'chart.js/auto';

function initRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  const transactions = store.getTransactions().filter(t => t.status_pembayaran !== 'menunggu_dp');
  
  // Group by week (last 4 weeks)
  const now = new Date();
  const weeks = Array(4).fill(0);
  const weekLabels = [];
  
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - (i * 7));
    weekLabels.push(`Minggu ke-${4-i} (${d.getDate()}/${d.getMonth()+1})`);
  }

  transactions.forEach(tx => {
    const date = new Date(tx.created_at);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 28) {
      const weekIndex = 3 - Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 4) {
        weeks[weekIndex] += (tx.total_harga || 0);
      }
    }
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weekLabels,
      datasets: [{
        label: 'Pendapatan Mingguan (Rp)',
        data: weeks,
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 6,
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              if (value >= 1000000) return 'Rp ' + (value / 1000000) + ' Juta';
              if (value >= 1000) return 'Rp ' + (value / 1000) + ' Ribu';
              return value;
            }
          }
        }
      }
    }
  });
}

function renderAlerts(stats) {
  const alerts = [];

  // Late returns
  const terlambatTxs = store.getTransactions().filter(t => t.status_rental === 'terlambat');
  terlambatTxs.forEach(tx => {
    const iphone = store.getIphoneById(tx.iphone_id);
    alerts.push(`
      <div class="alert-card danger">
        <i data-lucide="alert-circle" class="alert-card-icon"></i>
        <div class="alert-card-content">
          <div class="alert-card-title">${tx.tx_number} — Terlambat!</div>
          <div class="alert-card-desc">${tx.nama_pelanggan} — ${iphone?.model || 'Unknown'}</div>
        </div>
      </div>
    `);
  });

  // Bookings today
  stats.bookingHariIni.forEach(tx => {
    const iphone = store.getIphoneById(tx.iphone_id);
    alerts.push(`
      <div class="alert-card info">
        <i data-lucide="calendar" class="alert-card-icon"></i>
        <div class="alert-card-content">
          <div class="alert-card-title">${tx.tx_number} — Booking Hari Ini</div>
          <div class="alert-card-desc">${tx.nama_pelanggan} — ${iphone?.model || 'Unknown'}</div>
        </div>
      </div>
    `);
  });

  if (alerts.length === 0) {
    return `
      <div class="alert-card success" style="grid-column: 1 / -1;">
        <i data-lucide="sparkles" class="alert-card-icon"></i>
        <div class="alert-card-content">
          <div class="alert-card-title">Semua baik-baik saja! ✨</div>
          <div class="alert-card-desc">Tidak ada alert yang perlu ditangani saat ini</div>
        </div>
      </div>
    `;
  }

  return alerts.join('');
}

function renderActiveTransactions(transactions) {
  return transactions.map(tx => {
    const iphone = store.getIphoneById(tx.iphone_id);
    const countdown = getCountdown(tx.tanggal_waktu_selesai);
    const isOverdue = countdown.isOverdue;

    return `
      <tr class="${isOverdue ? 'row-danger' : ''}">
        <td><strong>${tx.tx_number}</strong></td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${tx.nama_pelanggan}
            <a href="${getWhatsAppUrl(tx.nomor_whatsapp)}" target="_blank" style="color: #22c55e; display: flex;">
              <i data-lucide="message-circle" style="width: 14px; height: 14px;"></i>
            </a>
          </div>
        </td>
        <td>${iphone?.model || '-'}</td>
        <td>
          <span class="countdown-cell ${isOverdue ? 'overdue' : 'active'}">
            ${countdown.text}
          </span>
        </td>
        <td>
          <span class="badge badge-${tx.status_rental === 'terlambat' ? 'terlambat' : 'aktif'}">
            ${tx.status_rental === 'terlambat' ? 'Terlambat' : 'Aktif'}
          </span>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm tx-detail-btn" data-id="${tx.id}">
            <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
            Detail
          </button>
        </td>
      </tr>
    `;
  }).join('');
}
