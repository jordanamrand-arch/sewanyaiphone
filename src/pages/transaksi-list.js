// ============================================
// Sewanya iPhone — Transaksi List Page
// ============================================

import { store } from '../store.js';
import { formatRupiah, formatDateTime, getWhatsAppUrl } from '../utils/format.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';
import { showConfirm } from '../components/confirm-dialog.js';
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

const STATUS_BAYAR_BADGE = {
  menunggu_dp: 'menunggu',
  sudah_dp: 'dp',
  lunas: 'lunas',
};

const STATUS_RENTAL_BADGE = {
  booking: 'booking',
  aktif_disewa: 'aktif',
  selesai: 'selesai',
  terlambat: 'terlambat',
};

export function renderTransaksiList() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  let activeFilter = 'semua';
  let search = '';
  let page = 1;
  const perPage = 10;

  function render() {
    let transactions = store.getTransactions().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Filter
    if (activeFilter !== 'semua') {
      transactions = transactions.filter(t => t.status_rental === activeFilter);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      transactions = transactions.filter(t => {
        const iphone = store.getIphoneById(t.iphone_id);
        return (
          (t.tx_number || '').toLowerCase().includes(q) ||
          (t.nama_pelanggan || '').toLowerCase().includes(q) ||
          (iphone?.model || '').toLowerCase().includes(q)
        );
      });
    }

    const totalPages = Math.ceil(transactions.length / perPage) || 1;
    if (page > totalPages) page = totalPages;
    const paged = transactions.slice((page - 1) * perPage, page * perPage);

    mainContent.innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <h1>
            <i data-lucide="clipboard-list"></i>
            Transaksi
          </h1>
          <button class="btn btn-primary" id="new-tx-btn">
            <i data-lucide="plus"></i>
            Transaksi Baru
          </button>
        </div>

        <div class="toolbar">
          <div class="search-wrapper">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" class="form-input" id="tx-search" placeholder="Cari ID, pelanggan, unit..." value="${search}" />
          </div>

          <div class="filter-tabs">
            <button class="filter-tab ${activeFilter === 'semua' ? 'active' : ''}" data-f="semua">Semua</button>
            <button class="filter-tab ${activeFilter === 'booking' ? 'active' : ''}" data-f="booking">Booking</button>
            <button class="filter-tab ${activeFilter === 'aktif_disewa' ? 'active' : ''}" data-f="aktif_disewa">Aktif</button>
            <button class="filter-tab ${activeFilter === 'selesai' ? 'active' : ''}" data-f="selesai">Selesai</button>
            <button class="filter-tab ${activeFilter === 'terlambat' ? 'active' : ''}" data-f="terlambat">Terlambat</button>
          </div>
        </div>

        ${paged.length > 0 ? `
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Pelanggan</th>
                  <th>Unit</th>
                  <th>Jadwal</th>
                  <th>Total</th>
                  <th>Bayar</th>
                  <th>Rental</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${paged.map(tx => {
      const iphone = store.getIphoneById(tx.iphone_id);
      const isLate = tx.status_rental === 'terlambat';
      return `
                    <tr class="${isLate ? 'row-danger' : ''}">
                      <td><strong>${tx.tx_number}</strong></td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 6px;">
                          ${tx.nama_pelanggan}
                          <a href="${getWhatsAppUrl(tx.nomor_whatsapp)}" target="_blank" style="color: #22c55e; display: flex;" title="Chat WhatsApp">
                            <i data-lucide="message-circle" style="width: 14px; height: 14px;"></i>
                          </a>
                        </div>
                      </td>
                      <td>${iphone?.model || '-'}</td>
                      <td>
                        <div style="font-size: 0.8rem; line-height: 1.5;">
                          ${formatDateTime(tx.tanggal_waktu_mulai)}<br/>
                          <span style="color: var(--text-muted);">→ ${formatDateTime(tx.tanggal_waktu_selesai)}</span>
                        </div>
                      </td>
                      <td><strong>${formatRupiah(tx.total_harga)}</strong></td>
                      <td><span class="badge badge-${STATUS_BAYAR_BADGE[tx.status_pembayaran]}">${STATUS_BAYAR_LABELS[tx.status_pembayaran]}</span></td>
                      <td><span class="badge badge-${STATUS_RENTAL_BADGE[tx.status_rental]}">${STATUS_RENTAL_LABELS[tx.status_rental]}</span></td>
                      <td class="td-actions">
                        <button class="btn btn-ghost btn-sm detail-btn" data-id="${tx.id}" title="Detail">
                          <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm delete-tx-btn" data-id="${tx.id}" title="Hapus">
                          <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--status-terlambat);"></i>
                        </button>
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </div>

          ${totalPages > 1 ? `
            <div class="pagination">
              <button class="pagination-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>&laquo;</button>
              ${Array.from({ length: totalPages }, (_, i) => `
                <button class="pagination-btn ${page === i + 1 ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>
              `).join('')}
              <button class="pagination-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>&raquo;</button>
            </div>
          ` : ''}
        ` : `
          <div class="empty-state">
            <i data-lucide="clipboard-list" class="empty-state-icon"></i>
            <p class="empty-state-title">Tidak ada transaksi</p>
            <p class="empty-state-desc">${search || activeFilter !== 'semua' ? 'Coba ubah filter atau pencarian' : 'Buat transaksi pertama Anda'}</p>
          </div>
        `}
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('new-tx-btn')?.addEventListener('click', () => navigate('/transaksi/baru'));

    document.getElementById('tx-search')?.addEventListener('input', (e) => {
      search = e.target.value;
      page = 1;
      render();
    });

    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeFilter = tab.dataset.f;
        page = 1;
        render();
      });
    });

    document.querySelectorAll('.detail-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate(`/transaksi/${btn.dataset.id}`));
    });

    document.querySelectorAll('.delete-tx-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tx = store.getTransactionById(btn.dataset.id);
        if (!tx) return;
        const confirmed = await showConfirm({
          title: 'Hapus Transaksi',
          message: `Hapus transaksi ${tx.tx_number}? Data tidak bisa dikembalikan.`,
        });
        if (confirmed) {
          store.deleteTransaction(tx.id);
          logActivity(`Menghapus transaksi ${tx.tx_number}`);
          showToast('Transaksi berhasil dihapus', 'success');
          render();
        }
      });
    });

    document.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = Number(btn.dataset.page);
        if (p >= 1) {
          page = p;
          render();
        }
      });
    });
  }

  render();
}
