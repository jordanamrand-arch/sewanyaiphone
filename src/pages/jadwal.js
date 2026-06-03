// ============================================
// Sewanya iPhone — Jadwal Sewa (Calendar View)
// ============================================

import { store } from '../store.js';
import { formatRupiah, formatDateTime } from '../utils/format.js';
import { navigate } from '../router.js';

const STATUS_LABELS = {
  booking: 'Booking',
  aktif_disewa: 'Aktif Disewa',
  selesai: 'Selesai',
  terlambat: 'Terlambat',
};

const STATUS_COLORS = {
  booking: { bg: 'rgba(167, 139, 250, 0.18)', border: '#a78bfa', text: '#c4b5fd' },
  aktif_disewa: { bg: 'rgba(59, 130, 246, 0.18)', border: '#3b82f6', text: '#93c5fd' },
  selesai: { bg: 'rgba(34, 197, 94, 0.18)', border: '#22c55e', text: '#86efac' },
  terlambat: { bg: 'rgba(239, 68, 68, 0.18)', border: '#ef4444', text: '#fca5a5' },
};

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function renderJadwal() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  let selectedDate = null;
  let filterStatus = 'semua';

  function getAllTransactions() {
    let txs = store.getTransactions();
    if (filterStatus !== 'semua') {
      txs = txs.filter(t => t.status_rental === filterStatus);
    }
    return txs;
  }

  // Get transactions that overlap with a specific date
  function getTransactionsForDate(date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return getAllTransactions().filter(t => {
      const txStart = new Date(t.tanggal_waktu_mulai);
      const txEnd = new Date(t.tanggal_waktu_selesai);
      return txStart < dayEnd && txEnd > dayStart;
    });
  }

  // Build calendar grid data
  function getCalendarDays() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun

    const days = [];

    // Previous month padding
    const prevMonthLast = new Date(currentYear, currentMonth, 0);
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(prevMonthLast);
      d.setDate(prevMonthLast.getDate() - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(currentYear, currentMonth, i), isCurrentMonth: true });
    }

    // Next month padding (fill to complete 6 rows max, or at least fill current row)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(currentYear, currentMonth + 1, i), isCurrentMonth: false });
      }
    }

    return days;
  }

  function isToday(date) {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  function isSameDay(a, b) {
    if (!a || !b) return false;
    return a.getDate() === b.getDate() &&
           a.getMonth() === b.getMonth() &&
           a.getFullYear() === b.getFullYear();
  }

  function render() {
    const calendarDays = getCalendarDays();
    const transactions = getAllTransactions();

    // Count transactions per status for this month
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    const monthTxs = transactions.filter(t => {
      const txStart = new Date(t.tanggal_waktu_mulai);
      const txEnd = new Date(t.tanggal_waktu_selesai);
      return txStart <= monthEnd && txEnd >= monthStart;
    });

    const statusCounts = {
      aktif_disewa: monthTxs.filter(t => t.status_rental === 'aktif_disewa').length,
      booking: monthTxs.filter(t => t.status_rental === 'booking').length,
      terlambat: monthTxs.filter(t => t.status_rental === 'terlambat').length,
      selesai: monthTxs.filter(t => t.status_rental === 'selesai').length,
    };

    // Build selected date detail panel
    let detailPanel = '';
    if (selectedDate) {
      const dateTxs = getTransactionsForDate(selectedDate);
      const dateStr = selectedDate.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });

      detailPanel = `
        <div class="cal-detail-panel">
          <div class="cal-detail-header">
            <div>
              <h3>${dateStr}</h3>
              <span class="text-muted text-sm">${dateTxs.length} transaksi</span>
            </div>
            <button class="btn btn-ghost btn-sm" id="close-detail-btn">
              <i data-lucide="x" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
          <div class="cal-detail-list">
            ${dateTxs.length > 0 ? dateTxs.map(tx => {
              const iphone = store.getIphoneById(tx.iphone_id);
              const sc = STATUS_COLORS[tx.status_rental] || STATUS_COLORS.booking;
              return `
                <div class="cal-detail-item" data-tx-id="${tx.id}" style="border-left: 3px solid ${sc.border};">
                  <div class="cal-detail-item-header">
                    <span class="cal-detail-tx-number">${tx.tx_number || '-'}</span>
                    <span class="badge badge-${tx.status_rental === 'aktif_disewa' ? 'aktif' : tx.status_rental}" style="font-size: 0.65rem;">${STATUS_LABELS[tx.status_rental]}</span>
                  </div>
                  <div class="cal-detail-item-body">
                    <div class="cal-detail-row">
                      <i data-lucide="user" style="width: 12px; height: 12px;"></i>
                      <span>${tx.nama_pelanggan || '-'}</span>
                    </div>
                    <div class="cal-detail-row">
                      <i data-lucide="smartphone" style="width: 12px; height: 12px;"></i>
                      <span>${iphone?.model || '-'}</span>
                    </div>
                    <div class="cal-detail-row">
                      <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                      <span class="text-xs">${formatDateTime(tx.tanggal_waktu_mulai)} → ${formatDateTime(tx.tanggal_waktu_selesai)}</span>
                    </div>
                    <div class="cal-detail-row">
                      <i data-lucide="wallet" style="width: 12px; height: 12px;"></i>
                      <span>${formatRupiah(tx.total_harga)}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="cal-detail-empty">
                <i data-lucide="calendar-x" style="width: 32px; height: 32px; color: var(--text-muted); margin-bottom: 8px;"></i>
                <p class="text-muted text-sm">Tidak ada transaksi di tanggal ini</p>
              </div>
            `}
          </div>
        </div>
      `;
    }

    mainContent.innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <h1>
            <i data-lucide="calendar-days"></i>
            Jadwal Sewa
          </h1>
          <p class="text-muted text-sm" style="margin-top: -20px;">Pantau seluruh jadwal penyewaan dalam tampilan kalender</p>
        </div>

        <!-- Month Stats -->
        <div class="cal-stats">
          <div class="cal-stat-item" style="border-left: 3px solid ${STATUS_COLORS.aktif_disewa.border};">
            <span class="cal-stat-value">${statusCounts.aktif_disewa}</span>
            <span class="cal-stat-label">Aktif</span>
          </div>
          <div class="cal-stat-item" style="border-left: 3px solid ${STATUS_COLORS.booking.border};">
            <span class="cal-stat-value">${statusCounts.booking}</span>
            <span class="cal-stat-label">Booking</span>
          </div>
          <div class="cal-stat-item" style="border-left: 3px solid ${STATUS_COLORS.terlambat.border};">
            <span class="cal-stat-value">${statusCounts.terlambat}</span>
            <span class="cal-stat-label">Terlambat</span>
          </div>
          <div class="cal-stat-item" style="border-left: 3px solid ${STATUS_COLORS.selesai.border};">
            <span class="cal-stat-value">${statusCounts.selesai}</span>
            <span class="cal-stat-label">Selesai</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="cal-controls">
          <div class="cal-nav">
            <button class="btn btn-ghost btn-sm" id="prev-month-btn">
              <i data-lucide="chevron-left" style="width: 18px; height: 18px;"></i>
            </button>
            <h2 class="cal-month-title">${MONTH_NAMES[currentMonth]} ${currentYear}</h2>
            <button class="btn btn-ghost btn-sm" id="next-month-btn">
              <i data-lucide="chevron-right" style="width: 18px; height: 18px;"></i>
            </button>
            <button class="btn btn-secondary btn-sm" id="today-btn" style="margin-left: 8px;">Hari Ini</button>
          </div>

          <div class="cal-filter">
            <div class="filter-tabs">
              <button class="filter-tab ${filterStatus === 'semua' ? 'active' : ''}" data-filter="semua">Semua</button>
              <button class="filter-tab ${filterStatus === 'aktif_disewa' ? 'active' : ''}" data-filter="aktif_disewa">Aktif</button>
              <button class="filter-tab ${filterStatus === 'booking' ? 'active' : ''}" data-filter="booking">Booking</button>
              <button class="filter-tab ${filterStatus === 'terlambat' ? 'active' : ''}" data-filter="terlambat">Terlambat</button>
              <button class="filter-tab ${filterStatus === 'selesai' ? 'active' : ''}" data-filter="selesai">Selesai</button>
            </div>
          </div>
        </div>

        <!-- Calendar + Detail Layout -->
        <div class="cal-layout ${selectedDate ? 'has-detail' : ''}">
          <!-- Calendar Grid -->
          <div class="cal-grid-wrapper">
            <div class="cal-grid">
              <!-- Day headers -->
              ${DAY_NAMES.map(d => `
                <div class="cal-day-header${d === 'Min' || d === 'Sab' ? ' weekend' : ''}">${d}</div>
              `).join('')}

              <!-- Day cells -->
              ${calendarDays.map(({ date, isCurrentMonth }) => {
                const txs = getTransactionsForDate(date);
                const todayClass = isToday(date) ? ' is-today' : '';
                const currentClass = isCurrentMonth ? '' : ' other-month';
                const selectedClass = isSameDay(date, selectedDate) ? ' is-selected' : '';
                const hasEvents = txs.length > 0 ? ' has-events' : '';
                const isWeekend = date.getDay() === 0 || date.getDay() === 6 ? ' weekend' : '';

                // Show up to 3 transaction chips, then "+N more"
                const maxChips = 3;
                const visibleTxs = txs.slice(0, maxChips);
                const moreCount = txs.length - maxChips;

                const chips = visibleTxs.map(tx => {
                  const sc = STATUS_COLORS[tx.status_rental] || STATUS_COLORS.booking;
                  return `<div class="cal-chip" style="background: ${sc.bg}; border-left: 2px solid ${sc.border}; color: ${sc.text};" title="${tx.tx_number} — ${tx.nama_pelanggan || '-'}">${tx.nama_pelanggan || tx.tx_number || '-'}</div>`;
                }).join('');

                const moreLabel = moreCount > 0
                  ? `<div class="cal-chip-more">+${moreCount} lagi</div>`
                  : '';

                return `
                  <div class="cal-cell${todayClass}${currentClass}${selectedClass}${hasEvents}${isWeekend}" data-date="${date.toISOString()}">
                    <div class="cal-cell-header">
                      <span class="cal-date-num">${date.getDate()}</span>
                      ${txs.length > 0 ? `<span class="cal-event-count">${txs.length}</span>` : ''}
                    </div>
                    <div class="cal-cell-body">
                      ${chips}
                      ${moreLabel}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Detail Panel -->
          ${detailPanel}
        </div>

        <!-- Legend -->
        <div class="cal-legend">
          <div class="cal-legend-item">
            <div class="cal-legend-dot" style="background: ${STATUS_COLORS.aktif_disewa.border};"></div>
            <span>Aktif Disewa</span>
          </div>
          <div class="cal-legend-item">
            <div class="cal-legend-dot" style="background: ${STATUS_COLORS.booking.border};"></div>
            <span>Booking</span>
          </div>
          <div class="cal-legend-item">
            <div class="cal-legend-dot" style="background: ${STATUS_COLORS.terlambat.border};"></div>
            <span>Terlambat</span>
          </div>
          <div class="cal-legend-item">
            <div class="cal-legend-dot" style="background: ${STATUS_COLORS.selesai.border};"></div>
            <span>Selesai</span>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    bindEvents();
  }

  function bindEvents() {
    // Month navigation
    document.getElementById('prev-month-btn')?.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      selectedDate = null;
      render();
    });

    document.getElementById('next-month-btn')?.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      selectedDate = null;
      render();
    });

    document.getElementById('today-btn')?.addEventListener('click', () => {
      currentMonth = today.getMonth();
      currentYear = today.getFullYear();
      selectedDate = new Date(today);
      render();
    });

    // Filter tabs
    document.querySelectorAll('.cal-filter .filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        filterStatus = tab.dataset.filter;
        render();
      });
    });

    // Calendar cell click
    document.querySelectorAll('.cal-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const date = new Date(cell.dataset.date);
        if (isSameDay(date, selectedDate)) {
          selectedDate = null;
        } else {
          selectedDate = date;
        }
        render();
      });
    });

    // Close detail panel
    document.getElementById('close-detail-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedDate = null;
      render();
    });

    // Detail item click → navigate to transaction
    document.querySelectorAll('.cal-detail-item').forEach(item => {
      item.addEventListener('click', () => {
        const txId = item.dataset.txId;
        if (txId) navigate(`/transaksi/${txId}`);
      });
    });
  }

  render();
}
