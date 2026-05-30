// ============================================
// Sewanya iPhone — Transaksi Form (Baru) Page
// ============================================

import { store } from '../store.js';
import { formatRupiah, formatDateTimeInput } from '../utils/format.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';
import { logActivity } from '../utils/activity-logger.js';

export function renderTransaksiForm() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  const session = store.getSession();
  const readyIphones = store.getIphones().filter(i => i.status_fisik === 'ready');

  let selectedIphoneId = '';
  let selectedJenis = 'hari';
  let selectedDurasi = '';
  let selectedPrice = 0;

  function render() {
    const pricing = selectedIphoneId ? store.getPricingByIphone(selectedIphoneId) : [];
    const filteredPricing = pricing.filter(p => p.jenis_durasi === selectedJenis).sort((a, b) => a.durasi - b.durasi);

    // Calculate auto end time
    const startInput = document.getElementById('tx-start')?.value || '';
    let autoEnd = '';
    if (startInput && selectedDurasi) {
      const start = new Date(startInput);
      if (selectedJenis === 'jam') {
        start.setHours(start.getHours() + Number(selectedDurasi));
      } else {
        start.setDate(start.getDate() + Number(selectedDurasi));
      }
      autoEnd = formatDateTimeInput(start);
    }

    const nominal_dp = Number(document.getElementById('tx-dp')?.value) || 0;
    const sisa = selectedPrice - nominal_dp;

    mainContent.innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <h1>
            <i data-lucide="plus-circle"></i>
            Transaksi Baru
          </h1>
          <button class="btn btn-secondary" id="back-btn">
            <i data-lucide="arrow-left"></i>
            Kembali
          </button>
        </div>

        <div class="tx-form-card">
          <!-- Section: Pilih Unit -->
          <div class="tx-form-section">
            <div class="tx-form-section-title">
              <i data-lucide="smartphone"></i>
              Pilih Unit iPhone
            </div>
            <div class="form-group">
              <select class="form-input" id="tx-iphone">
                <option value="">Pilih unit yang tersedia...</option>
                ${readyIphones.map(i => `
                  <option value="${i.id}" ${i.id === selectedIphoneId ? 'selected' : ''}>${i.model} — ${i.warna} (${i.nomor_seri})</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Section: Durasi & Harga -->
          <div class="tx-form-section">
            <div class="tx-form-section-title">
              <i data-lucide="clock"></i>
              Durasi Sewa
            </div>
            <div class="form-group" style="margin-bottom: var(--space-md);">
              <div class="toggle-group">
                <button type="button" class="toggle-option ${selectedJenis === 'jam' ? 'active' : ''}" data-jenis="jam">Per Jam</button>
                <button type="button" class="toggle-option ${selectedJenis === 'hari' ? 'active' : ''}" data-jenis="hari">Per Hari</button>
              </div>
            </div>

            ${selectedIphoneId ? `
              <div class="form-group">
                <label class="form-label">Pilih Durasi</label>
                ${filteredPricing.length > 0 ? `
                  <div class="toggle-group" style="flex-wrap: wrap;">
                    ${filteredPricing.map(p => `
                      <button type="button" class="toggle-option durasi-opt ${String(p.durasi) === String(selectedDurasi) ? 'active' : ''}" data-durasi="${p.durasi}" data-harga="${p.harga}">
                        ${p.durasi} ${selectedJenis === 'jam' ? 'Jam' : 'Hari'} — ${formatRupiah(p.harga)}
                      </button>
                    `).join('')}
                  </div>
                ` : `
                  <p class="text-muted text-sm">Tidak ada harga untuk jenis durasi ini. Tambahkan di halaman Matriks Harga.</p>
                `}
              </div>
            ` : `
              <p class="text-muted text-sm">Pilih unit iPhone terlebih dahulu</p>
            `}

            ${selectedPrice > 0 ? `
              <div class="price-display" style="margin-top: var(--space-md);">
                <div class="price-label">Total Harga</div>
                <div class="price-value">${formatRupiah(selectedPrice)}</div>
              </div>
            ` : ''}
          </div>

          <!-- Section: Data Pelanggan -->
          <div class="tx-form-section">
            <div class="tx-form-section-title">
              <i data-lucide="user"></i>
              Data Pelanggan
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nama Pelanggan</label>
                <input type="text" class="form-input" id="tx-nama" placeholder="Nama lengkap" value="" />
              </div>
              <div class="form-group">
                <label class="form-label">Nomor WhatsApp</label>
                <input type="text" class="form-input" id="tx-wa" placeholder="08xxxxxxxxxx" value="" />
              </div>
            </div>
          </div>

          <!-- Section: Jadwal -->
          <div class="tx-form-section">
            <div class="tx-form-section-title">
              <i data-lucide="calendar"></i>
              Jadwal
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Waktu Mulai</label>
                <input type="datetime-local" class="form-input" id="tx-start" value="" />
              </div>
              <div class="form-group">
                <label class="form-label">Waktu Selesai</label>
                <input type="datetime-local" class="form-input" id="tx-end" value="${autoEnd}" ${selectedDurasi ? '' : ''} />
              </div>
            </div>
          </div>

          <!-- Section: Pembayaran -->
          <div class="tx-form-section">
            <div class="tx-form-section-title">
              <i data-lucide="credit-card"></i>
              Pembayaran
            </div>

            <div class="price-breakdown">
              <div class="price-item">
                <div class="price-item-label">Total Harga</div>
                <div class="price-item-value">${formatRupiah(selectedPrice)}</div>
              </div>
              <div class="price-item">
                <div class="price-item-label">Nominal DP</div>
                <div class="price-item-value" id="dp-display">${formatRupiah(nominal_dp)}</div>
              </div>
              <div class="price-item">
                <div class="price-item-label">Sisa Pelunasan</div>
                <div class="price-item-value" id="sisa-display">${formatRupiah(sisa > 0 ? sisa : 0)}</div>
              </div>
            </div>

            <div class="form-group" style="margin-top: var(--space-md);">
              <label class="form-label">Nominal DP (Rp)</label>
              <input type="number" class="form-input" id="tx-dp" placeholder="0" min="0" max="${selectedPrice}" value="${nominal_dp || ''}" />
            </div>
          </div>

          <!-- Submit -->
          <div class="tx-form-section" style="display: flex; gap: var(--space-sm); justify-content: flex-end;">
            <button class="btn btn-secondary" id="cancel-btn">Batal</button>
            <button class="btn btn-primary" id="submit-tx-btn">
              <i data-lucide="save"></i>
              Simpan Transaksi
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('back-btn')?.addEventListener('click', () => navigate('/transaksi'));
    document.getElementById('cancel-btn')?.addEventListener('click', () => navigate('/transaksi'));

    // iPhone select
    document.getElementById('tx-iphone')?.addEventListener('change', (e) => {
      selectedIphoneId = e.target.value;
      selectedDurasi = '';
      selectedPrice = 0;
      render();
    });

    // Jenis toggle
    document.querySelectorAll('.toggle-option[data-jenis]').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedJenis = opt.dataset.jenis;
        selectedDurasi = '';
        selectedPrice = 0;
        render();
      });
    });

    // Durasi selection
    document.querySelectorAll('.durasi-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedDurasi = opt.dataset.durasi;
        selectedPrice = Number(opt.dataset.harga);
        render();
      });
    });

    // Auto-calc end time when start changes
    document.getElementById('tx-start')?.addEventListener('change', () => {
      const startVal = document.getElementById('tx-start').value;
      if (startVal && selectedDurasi) {
        const start = new Date(startVal);
        if (selectedJenis === 'jam') {
          start.setHours(start.getHours() + Number(selectedDurasi));
        } else {
          start.setDate(start.getDate() + Number(selectedDurasi));
        }
        const endInput = document.getElementById('tx-end');
        if (endInput) endInput.value = formatDateTimeInput(start);
      }
    });

    // DP input
    document.getElementById('tx-dp')?.addEventListener('input', (e) => {
      const dp = Number(e.target.value) || 0;
      const dpDisplay = document.getElementById('dp-display');
      const sisaDisplay = document.getElementById('sisa-display');
      if (dpDisplay) dpDisplay.textContent = formatRupiah(dp);
      if (sisaDisplay) sisaDisplay.textContent = formatRupiah(Math.max(0, selectedPrice - dp));
    });

    // Submit
    document.getElementById('submit-tx-btn')?.addEventListener('click', () => {
      const iphone_id = selectedIphoneId;
      const nama = document.getElementById('tx-nama')?.value.trim();
      const wa = document.getElementById('tx-wa')?.value.trim();
      const startVal = document.getElementById('tx-start')?.value;
      const endVal = document.getElementById('tx-end')?.value;
      const dp = Number(document.getElementById('tx-dp')?.value) || 0;

      // Validation
      if (!iphone_id) { showToast('Pilih unit iPhone', 'warning'); return; }
      if (!selectedDurasi) { showToast('Pilih durasi sewa', 'warning'); return; }
      if (!nama) { showToast('Nama pelanggan wajib diisi', 'warning'); return; }
      if (!wa) { showToast('Nomor WhatsApp wajib diisi', 'warning'); return; }
      if (!startVal) { showToast('Waktu mulai wajib diisi', 'warning'); return; }
      if (!endVal) { showToast('Waktu selesai wajib diisi', 'warning'); return; }

      // Check availability
      if (!store.isIphoneAvailable(iphone_id, startVal, endVal)) {
        showToast('Unit tidak tersedia di jadwal tersebut! Ada konflik dengan transaksi lain.', 'error');
        return;
      }

      const iphone = store.getIphoneById(iphone_id);
      let status_pembayaran = 'menunggu_dp';
      if (dp >= selectedPrice) status_pembayaran = 'lunas';
      else if (dp > 0) status_pembayaran = 'sudah_dp';

      const now = new Date();
      const startDate = new Date(startVal);
      let status_rental = 'booking';
      if (startDate <= now) status_rental = 'aktif_disewa';

      const tx = store.addTransaction({
        user_id: session.id,
        iphone_id,
        nama_pelanggan: nama,
        nomor_whatsapp: wa,
        tanggal_waktu_mulai: startVal,
        tanggal_waktu_selesai: endVal,
        nominal_dp: dp,
        nominal_pelunasan: Math.max(0, selectedPrice - dp),
        total_harga: selectedPrice,
        status_pembayaran,
        status_rental,
      });

      logActivity(`Membuat transaksi baru ${tx.tx_number} untuk ${iphone?.model} — Pelanggan: ${nama}`);
      showToast(`Transaksi ${tx.tx_number} berhasil dibuat!`, 'success');
      navigate('/transaksi');
    });
  }

  render();
}
