// ============================================
// Sewanya iPhone — Matriks Harga Page
// ============================================

import { store } from '../store.js';
import { formatRupiah } from '../utils/format.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { showConfirm } from '../components/confirm-dialog.js';
import { logActivity } from '../utils/activity-logger.js';

export function renderHarga() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  let selectedIphoneId = store.getIphones()[0]?.id || '';

  function render() {
    const iphones = store.getIphones();
    const selectedIphone = store.getIphoneById(selectedIphoneId);
    const pricing = selectedIphoneId ? store.getPricingByIphone(selectedIphoneId) : [];

    const jamPricing = pricing.filter(p => p.jenis_durasi === 'jam').sort((a, b) => a.durasi - b.durasi);
    const hariPricing = pricing.filter(p => p.jenis_durasi === 'hari').sort((a, b) => a.durasi - b.durasi);

    mainContent.innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <h1>
            <i data-lucide="wallet"></i>
            Matriks Harga
          </h1>
          <button class="btn btn-primary" id="add-price-btn" ${!selectedIphoneId ? 'disabled' : ''}>
            <i data-lucide="plus"></i>
            Tambah Harga
          </button>
        </div>

        <div class="pricing-header">
          <div class="form-group pricing-select">
            <label class="form-label">Pilih Unit iPhone</label>
            <select class="form-input" id="iphone-select">
              ${iphones.length === 0 ? '<option value="">Tidak ada unit</option>' : ''}
              ${iphones.map(i => `
                <option value="${i.id}" ${i.id === selectedIphoneId ? 'selected' : ''}>
                  ${i.model} — ${i.warna}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        ${!selectedIphoneId || pricing.length === 0 ? `
          <div class="empty-state">
            <i data-lucide="wallet" class="empty-state-icon"></i>
            <p class="empty-state-title">${!selectedIphoneId ? 'Pilih unit iPhone' : 'Belum ada harga'}</p>
            <p class="empty-state-desc">${!selectedIphoneId ? 'Pilih unit di atas untuk melihat daftar harga' : 'Tambahkan tier harga untuk unit ini'}</p>
          </div>
        ` : `
          ${jamPricing.length > 0 ? `
            <div class="pricing-group">
              <div class="pricing-group-title">
                <i data-lucide="clock"></i>
                Per Jam
              </div>
              <div class="data-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Durasi</th>
                      <th>Harga</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${jamPricing.map(p => `
                      <tr>
                        <td>${p.durasi} Jam</td>
                        <td><strong>${formatRupiah(p.harga)}</strong></td>
                        <td class="td-actions">
                          <button class="btn btn-ghost btn-sm edit-price-btn" data-id="${p.id}">
                            <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
                          </button>
                          <button class="btn btn-ghost btn-sm delete-price-btn" data-id="${p.id}">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--status-terlambat);"></i>
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          ${hariPricing.length > 0 ? `
            <div class="pricing-group">
              <div class="pricing-group-title">
                <i data-lucide="calendar-days"></i>
                Per Hari
              </div>
              <div class="data-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Durasi</th>
                      <th>Harga</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${hariPricing.map(p => `
                      <tr>
                        <td>${p.durasi} Hari</td>
                        <td><strong>${formatRupiah(p.harga)}</strong></td>
                        <td class="td-actions">
                          <button class="btn btn-ghost btn-sm edit-price-btn" data-id="${p.id}">
                            <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
                          </button>
                          <button class="btn btn-ghost btn-sm delete-price-btn" data-id="${p.id}">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--status-terlambat);"></i>
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}
        `}
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('iphone-select')?.addEventListener('change', (e) => {
      selectedIphoneId = e.target.value;
      render();
    });

    document.getElementById('add-price-btn')?.addEventListener('click', () => openPriceForm());

    document.querySelectorAll('.edit-price-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pricing = store.getPricing().find(p => p.id === btn.dataset.id);
        if (pricing) openPriceForm(pricing);
      });
    });

    document.querySelectorAll('.delete-price-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await showConfirm({
          title: 'Hapus Harga',
          message: 'Apakah Anda yakin ingin menghapus tier harga ini?',
        });
        if (confirmed) {
          store.deletePricing(btn.dataset.id);
          const iphone = store.getIphoneById(selectedIphoneId);
          logActivity(`Menghapus tier harga dari ${iphone?.model || 'unit'}`);
          showToast('Harga berhasil dihapus', 'success');
          render();
        }
      });
    });
  }

  function openPriceForm(editing = null) {
    const isEdit = !!editing;
    const body = `
      <div class="form-group">
        <label class="form-label">Jenis Durasi</label>
        <div class="toggle-group">
          <button type="button" class="toggle-option ${!editing || editing.jenis_durasi === 'jam' ? 'active' : ''}" data-jenis="jam">Jam</button>
          <button type="button" class="toggle-option ${editing?.jenis_durasi === 'hari' ? 'active' : ''}" data-jenis="hari">Hari</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Durasi</label>
        <input type="number" class="form-input" id="modal-durasi" placeholder="Contoh: 6" min="1" value="${editing?.durasi || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Harga (Rp)</label>
        <input type="number" class="form-input" id="modal-harga" placeholder="Contoh: 150000" min="0" value="${editing?.harga || ''}" />
      </div>
    `;

    showModal({
      title: isEdit ? 'Edit Harga' : 'Tambah Harga Baru',
      body,
      submitLabel: isEdit ? 'Simpan' : 'Tambah',
      onSubmit: (close) => {
        const modalBody = document.getElementById('modal-body');
        const activeJenis = modalBody.querySelector('.toggle-option.active');
        const jenis_durasi = activeJenis?.dataset.jenis || 'jam';
        const durasi = Number(document.getElementById('modal-durasi').value);
        const harga = Number(document.getElementById('modal-harga').value);

        if (!durasi || durasi <= 0) { showToast('Durasi harus angka positif', 'warning'); return; }
        if (!harga || harga <= 0) { showToast('Harga harus angka positif', 'warning'); return; }

        // Check duplicate
        const existing = store.getPricingTier(selectedIphoneId, jenis_durasi, durasi);
        if (existing && (!isEdit || existing.id !== editing.id)) {
          showToast(`Harga untuk ${durasi} ${jenis_durasi} sudah ada`, 'warning');
          return;
        }

        const iphone = store.getIphoneById(selectedIphoneId);
        const data = { iphone_id: selectedIphoneId, jenis_durasi, durasi, harga };

        if (isEdit) {
          store.updatePricing(editing.id, data);
          logActivity(`Mengubah harga ${iphone?.model}: ${durasi} ${jenis_durasi} = ${formatRupiah(harga)}`);
          showToast('Harga berhasil diperbarui', 'success');
        } else {
          store.addPricing(data);
          logActivity(`Menambah harga baru ${iphone?.model}: ${durasi} ${jenis_durasi} = ${formatRupiah(harga)}`);
          showToast('Harga baru berhasil ditambahkan', 'success');
        }

        close();
        render();
      },
    });

    // Toggle
    const modalBody = document.getElementById('modal-body');
    if (modalBody) {
      modalBody.querySelectorAll('.toggle-option').forEach(opt => {
        opt.addEventListener('click', () => {
          modalBody.querySelectorAll('.toggle-option').forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
        });
      });
    }
  }

  render();
}
