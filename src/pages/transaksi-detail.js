// ============================================
// Sewanya iPhone — Transaksi Detail Page
// ============================================

import { store } from '../store.js';
import { formatRupiah, formatDateTime, getCountdown, getWhatsAppUrl } from '../utils/format.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { logActivity } from '../utils/activity-logger.js';

const STATUS_RENTAL_LABELS = {
  booking: 'Booking',
  aktif_disewa: 'Aktif Disewa',
  selesai: 'Selesai',
  terlambat: 'Terlambat',
};

const STATUS_BAYAR_LABELS = {
  menunggu_dp: 'Menunggu DP',
  sudah_dp: 'Sudah DP',
  lunas: 'Lunas',
};

let countdownInterval = null;

export function renderTransaksiDetail(params) {
  const { id } = params;
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  function render() {
    const tx = store.getTransactionById(id);
    if (!tx) {
      mainContent.innerHTML = `
        <div class="page-enter">
          <div class="empty-state">
            <i data-lucide="file-x" class="empty-state-icon"></i>
            <p class="empty-state-title">Transaksi tidak ditemukan</p>
            <button class="btn btn-primary" onclick="window.location.hash='#/transaksi'">Kembali</button>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const iphone = store.getIphoneById(tx.iphone_id);
    const user = store.getUserById(tx.user_id);
    const countdown = getCountdown(tx.tanggal_waktu_selesai);
    const isActive = tx.status_rental === 'aktif_disewa' || tx.status_rental === 'terlambat';

    // Get related logs
    const logs = store.getLogs().filter(l =>
      (l.aktivitas || '').includes(tx.tx_number)
    ).slice(0, 10);

    mainContent.innerHTML = `
      <div class="page-enter tx-detail">
        <div class="page-header">
          <div style="display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap;">
            <button class="btn btn-ghost" id="back-btn">
              <i data-lucide="arrow-left"></i>
            </button>
            <span class="tx-detail-id">${tx.tx_number}</span>
            <span class="badge badge-${tx.status_rental === 'aktif_disewa' ? 'aktif' : tx.status_rental}">${STATUS_RENTAL_LABELS[tx.status_rental]}</span>
            <span class="badge badge-${tx.status_pembayaran === 'menunggu_dp' ? 'menunggu' : tx.status_pembayaran === 'sudah_dp' ? 'dp' : 'lunas'}">${STATUS_BAYAR_LABELS[tx.status_pembayaran]}</span>
          </div>
        </div>

        ${isActive ? `
          <div class="price-display" style="margin-bottom: var(--space-lg); text-align: center;">
            <div class="price-label">${countdown.isOverdue ? '⚠️ Terlambat' : '⏳ Sisa Waktu'}</div>
            <div class="price-value" id="countdown-display" style="${countdown.isOverdue ? 'background: linear-gradient(135deg, #ef4444, #f97316); -webkit-background-clip: text;' : ''}">${countdown.text}</div>
          </div>
        ` : ''}

        <!-- Action Buttons -->
        <div class="tx-detail-actions">
          <button class="btn btn-secondary" id="update-rental-btn">
            <i data-lucide="refresh-cw"></i>
            Update Status Rental
          </button>
          <button class="btn btn-secondary" id="update-bayar-btn">
            <i data-lucide="credit-card"></i>
            Update Pembayaran
          </button>
          <a href="${getWhatsAppUrl(tx.nomor_whatsapp)}" target="_blank" class="btn btn-secondary" style="color: #22c55e;">
            <i data-lucide="message-circle"></i>
            Chat WhatsApp
          </a>
        </div>

        <!-- Detail Grid -->
        <div class="tx-detail-grid">
          <!-- Pelanggan -->
          <div class="tx-detail-card">
            <h3><i data-lucide="user"></i> Pelanggan</h3>
            <div class="tx-detail-row">
              <span class="label">Nama</span>
              <span class="value">${tx.nama_pelanggan}</span>
            </div>
            <div class="tx-detail-row">
              <span class="label">WhatsApp</span>
              <span class="value">${tx.nomor_whatsapp}</span>
            </div>
          </div>

          <!-- Unit -->
          <div class="tx-detail-card">
            <h3><i data-lucide="smartphone"></i> Unit</h3>
            <div class="tx-detail-row">
              <span class="label">Model</span>
              <span class="value">${iphone?.model || '-'}</span>
            </div>
            <div class="tx-detail-row">
              <span class="label">IMEI</span>
              <span class="value">${iphone?.nomor_seri || '-'}</span>
            </div>
            <div class="tx-detail-row">
              <span class="label">Warna</span>
              <span class="value">${iphone?.warna || '-'}</span>
            </div>
          </div>

          <!-- Jadwal -->
          <div class="tx-detail-card">
            <h3><i data-lucide="calendar"></i> Jadwal</h3>
            <div class="tx-detail-row">
              <span class="label">Mulai</span>
              <span class="value">${formatDateTime(tx.tanggal_waktu_mulai)}</span>
            </div>
            <div class="tx-detail-row">
              <span class="label">Selesai</span>
              <span class="value">${formatDateTime(tx.tanggal_waktu_selesai)}</span>
            </div>
            <div class="tx-detail-row">
              <span class="label">Dibuat oleh</span>
              <span class="value">${user?.nama || '-'}</span>
            </div>
          </div>

          <!-- Pembayaran -->
          <div class="tx-detail-card">
            <h3><i data-lucide="wallet"></i> Pembayaran</h3>
            <div class="tx-detail-row">
              <span class="label">Total Harga</span>
              <span class="value"><strong>${formatRupiah(tx.total_harga)}</strong></span>
            </div>
            <div class="tx-detail-row">
              <span class="label">DP</span>
              <span class="value">${formatRupiah(tx.nominal_dp)}</span>
            </div>
            <div class="tx-detail-row">
              <span class="label">Sisa</span>
              <span class="value">${formatRupiah(tx.nominal_pelunasan)}</span>
            </div>
          </div>
        </div>

        <!-- Activity Timeline -->
        <div class="section-header">
          <h2 class="section-title">
            <i data-lucide="scroll-text"></i>
            Riwayat Aktivitas
          </h2>
        </div>

        ${logs.length > 0 ? `
          <div class="timeline">
            ${logs.map(log => {
      const logUser = store.getUserById(log.user_id);
      return `
                <div class="timeline-item">
                  <div class="timeline-time">${formatDateTime(log.created_at)}</div>
                  <div class="timeline-text">
                    <span class="timeline-user">${logUser?.nama || 'System'}</span> — ${log.aktivitas || ''}
                  </div>
                </div>
              `;
    }).join('')}
          </div>
        ` : `
          <p class="text-muted text-sm">Belum ada riwayat aktivitas</p>
        `}
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Back
    document.getElementById('back-btn')?.addEventListener('click', () => navigate('/transaksi'));

    // Update Rental Status
    document.getElementById('update-rental-btn')?.addEventListener('click', () => {
      const options = ['booking', 'aktif_disewa', 'selesai', 'terlambat'];
      const body = `
        <div class="form-group">
          <label class="form-label">Status Rental Baru</label>
          <select class="form-input" id="modal-rental-status">
            ${options.map(o => `<option value="${o}" ${tx.status_rental === o ? 'selected' : ''}>${STATUS_RENTAL_LABELS[o]}</option>`).join('')}
          </select>
        </div>
      `;
      showModal({
        title: 'Update Status Rental',
        body,
        onSubmit: (close) => {
          const newStatus = document.getElementById('modal-rental-status').value;
          const oldLabel = STATUS_RENTAL_LABELS[tx.status_rental];
          const newLabel = STATUS_RENTAL_LABELS[newStatus];
          store.updateTransaction(tx.id, { status_rental: newStatus });
          logActivity(`Mengubah status rental ${tx.tx_number} dari ${oldLabel} menjadi ${newLabel}`);
          showToast(`Status rental diubah ke ${newLabel}`, 'success');
          close();
          render();
        },
      });
    });

    // Update Payment Status
    document.getElementById('update-bayar-btn')?.addEventListener('click', () => {
      const options = ['menunggu_dp', 'sudah_dp', 'lunas'];
      const body = `
        <div class="form-group">
          <label class="form-label">Status Pembayaran</label>
          <select class="form-input" id="modal-bayar-status">
            ${options.map(o => `<option value="${o}" ${tx.status_pembayaran === o ? 'selected' : ''}>${STATUS_BAYAR_LABELS[o]}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nominal Pelunasan (Rp)</label>
          <input type="number" class="form-input" id="modal-pelunasan" value="${tx.nominal_pelunasan}" min="0" />
        </div>
      `;
      showModal({
        title: 'Update Pembayaran',
        body,
        onSubmit: (close) => {
          const newStatus = document.getElementById('modal-bayar-status').value;
          const pelunasan = Number(document.getElementById('modal-pelunasan').value) || 0;
          const oldLabel = STATUS_BAYAR_LABELS[tx.status_pembayaran];
          const newLabel = STATUS_BAYAR_LABELS[newStatus];

          const updates = {
            status_pembayaran: newStatus,
            nominal_pelunasan: pelunasan,
          };
          if (newStatus === 'lunas') {
            updates.nominal_dp = tx.total_harga;
            updates.nominal_pelunasan = 0;
          }

          store.updateTransaction(tx.id, updates);
          logActivity(`Mengubah status pembayaran ${tx.tx_number} dari ${oldLabel} menjadi ${newLabel}`);
          showToast(`Pembayaran diubah ke ${newLabel}`, 'success');
          close();
          render();
        },
      });
    });

    // Live countdown
    if (isActive) {
      countdownInterval = setInterval(() => {
        const el = document.getElementById('countdown-display');
        if (el) {
          const cd = getCountdown(tx.tanggal_waktu_selesai);
          el.textContent = cd.text;
          if (cd.isOverdue) {
            el.style.background = 'linear-gradient(135deg, #ef4444, #f97316)';
            el.style.webkitBackgroundClip = 'text';
          }
        }
      }, 1000);
    }
  }

  render();

  return () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  };
}
