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

      <!-- Revenue Analytics Section -->
      <div class="revenue-analytics" id="revenue-analytics">
        <div class="revenue-header">
          <div class="revenue-header-left">
            <h2 class="section-title" style="margin-bottom: 0;">
              <i data-lucide="trending-up"></i>
              Analisis Pendapatan
            </h2>
            <p class="text-muted text-sm">Pendapatan mingguan berdasarkan kalender</p>
          </div>
          <div class="revenue-controls">
            <button class="btn btn-ghost btn-sm" id="revenue-prev-month">
              <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
            </button>
            <select id="revenue-month-select" class="revenue-month-select">
            </select>
            <button class="btn btn-ghost btn-sm" id="revenue-next-month">
              <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </div>

        <!-- Monthly Summary Cards -->
        <div class="revenue-summary" id="revenue-summary">
        </div>

        <!-- Weekly Bar Chart -->
        <div class="revenue-chart-container">
          <canvas id="revenueChart"></canvas>
        </div>

        <!-- iPhone Unit Breakdown -->
        <div class="revenue-unit-breakdown" id="revenue-unit-breakdown">
        </div>
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

let revenueChartInstance = null;
let currentRevenueMonth = null; // { year, month } (month is 0-indexed)

function initRevenueChart() {
  const now = new Date();
  currentRevenueMonth = { year: now.getFullYear(), month: now.getMonth() };

  // Populate month selector
  populateMonthSelector();

  // Render the chart and breakdown for current month
  updateRevenueView();

  // Event listeners
  const select = document.getElementById('revenue-month-select');
  const prevBtn = document.getElementById('revenue-prev-month');
  const nextBtn = document.getElementById('revenue-next-month');

  if (select) {
    select.addEventListener('change', (e) => {
      const [y, m] = e.target.value.split('-').map(Number);
      currentRevenueMonth = { year: y, month: m };
      updateRevenueView();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentRevenueMonth.month--;
      if (currentRevenueMonth.month < 0) {
        currentRevenueMonth.month = 11;
        currentRevenueMonth.year--;
      }
      document.getElementById('revenue-month-select').value =
        `${currentRevenueMonth.year}-${currentRevenueMonth.month}`;
      updateRevenueView();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentRevenueMonth.month++;
      if (currentRevenueMonth.month > 11) {
        currentRevenueMonth.month = 0;
        currentRevenueMonth.year++;
      }
      document.getElementById('revenue-month-select').value =
        `${currentRevenueMonth.year}-${currentRevenueMonth.month}`;
      updateRevenueView();
    });
  }
}

function populateMonthSelector() {
  const select = document.getElementById('revenue-month-select');
  if (!select) return;

  // Build list of months that have transactions + current month ± 2
  const transactions = store.getTransactions();
  const monthSet = new Set();
  const now = new Date();

  // Always include current month and 2 months before/after
  for (let offset = -6; offset <= 2; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    monthSet.add(`${d.getFullYear()}-${d.getMonth()}`);
  }

  // Include months from transactions
  transactions.forEach(tx => {
    const d = new Date(tx.tanggal_waktu_mulai);
    if (!isNaN(d.getTime())) {
      monthSet.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
  });

  // Sort and build options
  const sortedMonths = Array.from(monthSet).sort((a, b) => {
    const [ya, ma] = a.split('-').map(Number);
    const [yb, mb] = b.split('-').map(Number);
    return (yb * 12 + mb) - (ya * 12 + ma); // Descending
  });

  select.innerHTML = sortedMonths.map(key => {
    const [y, m] = key.split('-').map(Number);
    const label = new Date(y, m, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const selected = y === currentRevenueMonth.year && m === currentRevenueMonth.month ? 'selected' : '';
    return `<option value="${key}" ${selected}>${label}</option>`;
  }).join('');
}

function getCalendarWeeks(year, month) {
  // Returns array of { label, start, end } for each calendar week in the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks = [];
  let weekStart = new Date(firstDay);
  let weekNum = 1;

  while (weekStart <= lastDay) {
    // End of week = next Sunday or end of month, whichever comes first
    const weekEnd = new Date(weekStart);
    const daysUntilSunday = (7 - weekStart.getDay()) % 7;
    weekEnd.setDate(weekStart.getDate() + daysUntilSunday);

    const actualEnd = weekEnd > lastDay ? new Date(lastDay) : new Date(weekEnd);
    actualEnd.setHours(23, 59, 59, 999);

    const startLabel = weekStart.getDate();
    const endLabel = actualEnd.getDate();

    weeks.push({
      label: `Minggu ${weekNum} (${startLabel}–${endLabel})`,
      start: new Date(weekStart),
      end: actualEnd,
    });

    weekNum++;
    weekStart = new Date(actualEnd);
    weekStart.setDate(weekStart.getDate() + 1);
    weekStart.setHours(0, 0, 0, 0);
  }

  return weeks;
}

function getMonthTransactions(year, month) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return store.getTransactions().filter(tx => {
    if (tx.status_pembayaran === 'menunggu_dp') return false;
    const startDate = new Date(tx.tanggal_waktu_mulai);
    return startDate >= monthStart && startDate <= monthEnd;
  });
}

function updateRevenueView() {
  const { year, month } = currentRevenueMonth;
  const transactions = getMonthTransactions(year, month);
  const weeks = getCalendarWeeks(year, month);

  // Calculate weekly totals
  const weeklyData = weeks.map(week => {
    const weekTxs = transactions.filter(tx => {
      const d = new Date(tx.tanggal_waktu_mulai);
      return d >= week.start && d <= week.end;
    });
    const total = weekTxs.reduce((sum, tx) => sum + (tx.total_harga || 0) + (tx.denda || 0), 0);
    return { ...week, total, count: weekTxs.length };
  });

  // Total month stats
  const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.total_harga || 0) + (tx.denda || 0), 0);
  const totalTx = transactions.length;
  const uniqueUnits = new Set(transactions.map(tx => tx.iphone_id));

  // Build unit breakdown
  const unitMap = {};
  transactions.forEach(tx => {
    const iphoneId = tx.iphone_id;
    if (!unitMap[iphoneId]) {
      unitMap[iphoneId] = { revenue: 0, count: 0 };
    }
    unitMap[iphoneId].revenue += (tx.total_harga || 0) + (tx.denda || 0);
    unitMap[iphoneId].count++;
  });

  // Sort by revenue desc
  const unitBreakdown = Object.entries(unitMap)
    .map(([id, data]) => {
      const iphone = store.getIphoneById(id);
      return {
        id,
        model: iphone?.model || 'Unknown',
        warna: iphone?.warna || '-',
        revenue: data.revenue,
        count: data.count,
        percentage: totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100) : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // Render summary cards
  renderRevenueSummary(totalRevenue, totalTx, uniqueUnits.size);

  // Render chart
  renderRevenueChart(weeklyData);

  // Render unit breakdown
  renderUnitBreakdown(unitBreakdown, totalRevenue);

  if (window.lucide) lucide.createIcons();
}

function renderRevenueSummary(totalRevenue, totalTx, uniqueUnits) {
  const container = document.getElementById('revenue-summary');
  if (!container) return;

  const monthLabel = new Date(currentRevenueMonth.year, currentRevenueMonth.month, 1)
    .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  container.innerHTML = `
    <div class="revenue-summary-card revenue-summary-total">
      <div class="revenue-summary-icon">
        <i data-lucide="wallet" style="width: 20px; height: 20px;"></i>
      </div>
      <div class="revenue-summary-info">
        <span class="revenue-summary-label">Total Pendapatan</span>
        <span class="revenue-summary-value">${formatRupiah(totalRevenue)}</span>
      </div>
    </div>
    <div class="revenue-summary-card">
      <div class="revenue-summary-icon" style="background: rgba(59, 130, 246, 0.12); color: #3b82f6;">
        <i data-lucide="receipt" style="width: 20px; height: 20px;"></i>
      </div>
      <div class="revenue-summary-info">
        <span class="revenue-summary-label">Transaksi</span>
        <span class="revenue-summary-value">${totalTx}</span>
      </div>
    </div>
    <div class="revenue-summary-card">
      <div class="revenue-summary-icon" style="background: rgba(167, 139, 250, 0.12); color: #a78bfa;">
        <i data-lucide="smartphone" style="width: 20px; height: 20px;"></i>
      </div>
      <div class="revenue-summary-info">
        <span class="revenue-summary-label">Unit Disewa</span>
        <span class="revenue-summary-value">${uniqueUnits} unit</span>
      </div>
    </div>
  `;
}

function renderRevenueChart(weeklyData) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  // Destroy old chart instance
  if (revenueChartInstance) {
    revenueChartInstance.destroy();
    revenueChartInstance = null;
  }

  const labels = weeklyData.map(w => w.label);
  const data = weeklyData.map(w => w.total);
  const counts = weeklyData.map(w => w.count);

  revenueChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pendapatan (Rp)',
        data,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(99, 102, 241, 0.8)';
          const gradient = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.9)');
          return gradient;
        },
        borderRadius: 8,
        borderSkipped: false,
        borderWidth: 0,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (items) => items[0].label,
            label: (item) => {
              const val = item.raw;
              const count = counts[item.dataIndex];
              return [
                `Pendapatan: ${formatRupiah(val)}`,
                `Transaksi: ${count}`,
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            drawBorder: false,
          },
          border: { display: false },
          ticks: {
            color: 'var(--text-secondary)',
            font: { size: 11 },
            padding: 8,
            callback: function(value) {
              if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + ' Jt';
              if (value >= 1000) return 'Rp ' + (value / 1000).toFixed(0) + ' Rb';
              return 'Rp ' + value;
            }
          }
        },
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: 'var(--text-secondary)',
            font: { size: 11 },
            padding: 8,
          }
        }
      }
    }
  });
}

// Assign distinct colors to iPhone models
const unitColors = [
  { bg: 'rgba(99, 102, 241, 0.15)', bar: '#6366f1', text: '#818cf8' },
  { bg: 'rgba(34, 197, 94, 0.15)', bar: '#22c55e', text: '#4ade80' },
  { bg: 'rgba(245, 158, 11, 0.15)', bar: '#f59e0b', text: '#fbbf24' },
  { bg: 'rgba(239, 68, 68, 0.15)', bar: '#ef4444', text: '#f87171' },
  { bg: 'rgba(59, 130, 246, 0.15)', bar: '#3b82f6', text: '#60a5fa' },
  { bg: 'rgba(167, 139, 250, 0.15)', bar: '#a78bfa', text: '#c4b5fd' },
  { bg: 'rgba(236, 72, 153, 0.15)', bar: '#ec4899', text: '#f472b6' },
  { bg: 'rgba(20, 184, 166, 0.15)', bar: '#14b8a6', text: '#2dd4bf' },
];

function renderUnitBreakdown(units, totalRevenue) {
  const container = document.getElementById('revenue-unit-breakdown');
  if (!container) return;

  if (units.length === 0) {
    container.innerHTML = `
      <div class="revenue-breakdown-header">
        <h3>
          <i data-lucide="smartphone" style="width: 18px; height: 18px;"></i>
          Pendapatan per Unit
        </h3>
      </div>
      <div class="revenue-breakdown-empty">
        <i data-lucide="inbox" style="width: 32px; height: 32px; color: var(--text-muted);"></i>
        <p class="text-muted">Tidak ada transaksi di bulan ini</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="revenue-breakdown-header">
      <h3>
        <i data-lucide="smartphone" style="width: 18px; height: 18px;"></i>
        Pendapatan per Unit
      </h3>
      <span class="text-muted text-sm">${units.length} unit aktif bulan ini</span>
    </div>
    <div class="revenue-breakdown-list">
      ${units.map((unit, idx) => {
        const color = unitColors[idx % unitColors.length];
        return `
          <div class="revenue-unit-item">
            <div class="revenue-unit-left">
              <div class="revenue-unit-avatar" style="background: ${color.bg}; color: ${color.bar};">
                <i data-lucide="smartphone" style="width: 16px; height: 16px;"></i>
              </div>
              <div class="revenue-unit-info">
                <span class="revenue-unit-model">${unit.model}</span>
                <span class="revenue-unit-meta">${unit.warna} · ${unit.count} transaksi</span>
              </div>
            </div>
            <div class="revenue-unit-right">
              <span class="revenue-unit-amount">${formatRupiah(unit.revenue)}</span>
              <div class="revenue-unit-bar-track">
                <div class="revenue-unit-bar-fill" style="width: ${unit.percentage}%; background: ${color.bar};"></div>
              </div>
              <span class="revenue-unit-pct" style="color: ${color.text};">${unit.percentage.toFixed(1)}%</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
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
