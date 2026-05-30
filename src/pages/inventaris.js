// ============================================
// Sewanya iPhone — Inventaris iPhone Page
// ============================================

import { store } from '../store.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { showConfirm } from '../components/confirm-dialog.js';
import { logActivity } from '../utils/activity-logger.js';

export function renderInventaris() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  let filter = 'semua';
  let search = '';

  function render() {
    let iphones = store.getIphones();
    if (filter !== 'semua') iphones = iphones.filter(i => i.status_fisik === filter);
    if (search) {
      const q = search.toLowerCase();
      iphones = iphones.filter(i =>
        i.model.toLowerCase().includes(q) ||
        i.nomor_seri.toLowerCase().includes(q) ||
        i.warna.toLowerCase().includes(q)
      );
    }

    mainContent.innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <h1>
            <i data-lucide="smartphone"></i>
            Inventaris iPhone
          </h1>
          <button class="btn btn-primary" id="add-unit-btn">
            <i data-lucide="plus"></i>
            Tambah Unit
          </button>
        </div>

        <div class="toolbar">
          <div class="search-wrapper">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" class="form-input" id="search-input" placeholder="Cari model, IMEI, warna..." value="${search}" />
          </div>

          <div class="filter-tabs">
            <button class="filter-tab ${filter === 'semua' ? 'active' : ''}" data-filter="semua">Semua</button>
            <button class="filter-tab ${filter === 'ready' ? 'active' : ''}" data-filter="ready">Ready</button>
            <button class="filter-tab ${filter === 'servis' ? 'active' : ''}" data-filter="servis">Servis</button>
          </div>
        </div>

        ${iphones.length > 0 ? `
          <div class="iphone-grid">
            ${iphones.map(iphone => renderCard(iphone)).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <i data-lucide="smartphone" class="empty-state-icon"></i>
            <p class="empty-state-title">Tidak ada unit ditemukan</p>
            <p class="empty-state-desc">${search || filter !== 'semua' ? 'Coba ubah filter atau kata kunci pencarian' : 'Mulai tambahkan unit iPhone pertama Anda'}</p>
          </div>
        `}
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    bindEvents();
  }

  function renderCard(iphone) {
    const batteryClass = iphone.battery_health >= 90 ? 'full' : iphone.battery_health >= 70 ? 'high' : iphone.battery_health >= 50 ? 'mid' : 'low';
    const statusClass = iphone.status_fisik === 'ready' ? 'ready' : 'servis';
    const statusLabel = iphone.status_fisik === 'ready' ? 'Ready' : 'Servis';

    return `
      <div class="iphone-card">
        <div class="iphone-card-header">
          <span class="iphone-model">${iphone.model}</span>
          <span class="badge badge-${statusClass}">${statusLabel}</span>
        </div>
        <div class="iphone-card-body">
          <div class="iphone-detail">
            <i data-lucide="hash"></i>
            <span>IMEI: ${iphone.nomor_seri}</span>
          </div>
          <div class="iphone-detail">
            <i data-lucide="palette"></i>
            <span>${iphone.warna}</span>
          </div>
          <div class="iphone-detail">
            <i data-lucide="battery-charging"></i>
            <div class="battery-row">
              <div class="progress-bar battery-bar">
                <div class="progress-fill ${batteryClass}" style="width: ${iphone.battery_health}%"></div>
              </div>
              <span class="battery-value">${iphone.battery_health}%</span>
            </div>
          </div>
        </div>
        <div class="iphone-card-footer">
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${iphone.id}">
            <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
            Edit
          </button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${iphone.id}">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            Hapus
          </button>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    // Add unit
    document.getElementById('add-unit-btn')?.addEventListener('click', () => openForm());

    // Search
    document.getElementById('search-input')?.addEventListener('input', (e) => {
      search = e.target.value;
      render();
    });

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        filter = tab.dataset.filter;
        render();
      });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const iphone = store.getIphoneById(btn.dataset.id);
        if (iphone) openForm(iphone);
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const iphone = store.getIphoneById(btn.dataset.id);
        if (!iphone) return;
        const confirmed = await showConfirm({
          title: 'Hapus Unit',
          message: `Apakah Anda yakin ingin menghapus "${iphone.model}" (${iphone.nomor_seri})? Data harga terkait juga akan dihapus.`,
        });
        if (confirmed) {
          store.deleteIphone(iphone.id);
          logActivity(`Menghapus unit: ${iphone.model} — IMEI ${iphone.nomor_seri}`);
          showToast('Unit berhasil dihapus', 'success');
          render();
        }
      });
    });
  }

  function openForm(editing = null) {
    const isEdit = !!editing;
    const title = isEdit ? 'Edit Unit iPhone' : 'Tambah Unit Baru';

    const MODELS = [
      'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12',
    ];

    const body = `
      <div class="form-group">
        <label class="form-label">Model iPhone</label>
        <select class="form-input" id="modal-model">
          <option value="">Pilih model...</option>
          ${MODELS.map(m => `<option value="${m}" ${editing?.model === m ? 'selected' : ''}>${m}</option>`).join('')}
          <option value="custom" ${editing && !MODELS.includes(editing.model) ? 'selected' : ''}>Custom (ketik sendiri)</option>
        </select>
      </div>
      <div class="form-group" id="custom-model-group" style="display: ${editing && !MODELS.includes(editing.model) ? 'flex' : 'none'};">
        <label class="form-label">Model Custom</label>
        <input type="text" class="form-input" id="modal-custom-model" placeholder="Ketik model..." value="${editing && !MODELS.includes(editing.model) ? editing.model : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Nomor Seri / IMEI</label>
        <input type="text" class="form-input" id="modal-imei" placeholder="Contoh: 352910125678901" value="${editing?.nomor_seri || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Warna</label>
        <input type="text" class="form-input" id="modal-warna" placeholder="Contoh: Natural Titanium" value="${editing?.warna || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Battery Health</label>
        <div class="battery-slider-wrapper">
          <input type="range" class="battery-slider" id="modal-battery" min="0" max="100" value="${editing?.battery_health ?? 100}" />
          <span class="battery-slider-value" id="battery-display">${editing?.battery_health ?? 100}%</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status Fisik</label>
        <div class="toggle-group">
          <button type="button" class="toggle-option ${!editing || editing.status_fisik === 'ready' ? 'active' : ''}" data-status="ready">Ready</button>
          <button type="button" class="toggle-option ${editing?.status_fisik === 'servis' ? 'active' : ''}" data-status="servis">Servis</button>
        </div>
      </div>
    `;

    showModal({
      title,
      body,
      submitLabel: isEdit ? 'Simpan Perubahan' : 'Tambah Unit',
      onSubmit: (close) => {
        const modelSelect = document.getElementById('modal-model');
        const customModel = document.getElementById('modal-custom-model');
        let model = modelSelect.value === 'custom' ? customModel.value.trim() : modelSelect.value;
        const nomor_seri = document.getElementById('modal-imei').value.trim();
        const warna = document.getElementById('modal-warna').value.trim();
        const battery_health = Number(document.getElementById('modal-battery').value);
        const activeToggle = document.querySelector('.toggle-option.active');
        const status_fisik = activeToggle?.dataset.status || 'ready';

        // Validate
        if (!model) { showToast('Model iPhone wajib dipilih', 'warning'); return; }
        if (!nomor_seri) { showToast('Nomor Seri/IMEI wajib diisi', 'warning'); return; }
        if (!warna) { showToast('Warna wajib diisi', 'warning'); return; }

        const data = { model, nomor_seri, warna, battery_health, status_fisik };

        if (isEdit) {
          store.updateIphone(editing.id, data);
          logActivity(`Mengubah unit: ${model} — IMEI ${nomor_seri}`);
          showToast('Unit berhasil diperbarui', 'success');
        } else {
          store.addIphone(data);
          logActivity(`Menambahkan unit baru: ${model} — IMEI ${nomor_seri}`);
          showToast('Unit baru berhasil ditambahkan', 'success');
        }

        close();
        render();
      },
    });

    // Model select change
    document.getElementById('modal-model')?.addEventListener('change', (e) => {
      const customGroup = document.getElementById('custom-model-group');
      if (customGroup) {
        customGroup.style.display = e.target.value === 'custom' ? 'flex' : 'none';
      }
    });

    // Battery slider
    document.getElementById('modal-battery')?.addEventListener('input', (e) => {
      const display = document.getElementById('battery-display');
      if (display) display.textContent = e.target.value + '%';
    });

    // Toggle buttons
    document.querySelectorAll('.toggle-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.toggle-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
      });
    });
  }

  render();
}
