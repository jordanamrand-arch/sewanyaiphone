// ============================================
// Sewanya iPhone — Transaksi Form (Baru) Page
// ============================================

import { store } from '../store.js';
import { formatRupiah, formatDateTimeInput, toLocalISOString } from '../utils/format.js';
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
  let diskonTipe = 'nominal'; // 'nominal' or 'persen'
  let diskonNilai = 0;

  function getDiscountAmount() {
    if (!diskonNilai || diskonNilai <= 0 || selectedPrice <= 0) return 0;
    if (diskonTipe === 'persen') {
      const persen = Math.min(diskonNilai, 100);
      return Math.round(selectedPrice * persen / 100);
    }
    return Math.min(diskonNilai, selectedPrice);
  }

  function getFinalPrice() {
    return Math.max(0, selectedPrice - getDiscountAmount());
  }

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

    const finalPrice = getFinalPrice();
    const discountAmount = getDiscountAmount();
    const nominal_dp = Number(document.getElementById('tx-dp')?.value) || 0;
    const sisa = finalPrice - nominal_dp;

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
                <div class="price-label">Harga Dasar</div>
                <div class="price-value">${formatRupiah(selectedPrice)}</div>
              </div>
            ` : ''}
          </div>

          <!-- Section: Diskon -->
          ${selectedPrice > 0 ? `
          <div class="tx-form-section">
            <div class="tx-form-section-title">
              <i data-lucide="percent"></i>
              Diskon
            </div>
            <div class="discount-section">
              <div class="discount-type-toggle">
                <button type="button" class="toggle-option discount-type-opt ${diskonTipe === 'nominal' ? 'active' : ''}" data-diskon-tipe="nominal">
                  <i data-lucide="banknote" style="width: 16px; height: 16px;"></i>
                  Potongan Harga (Rp)
                </button>
                <button type="button" class="toggle-option discount-type-opt ${diskonTipe === 'persen' ? 'active' : ''}" data-diskon-tipe="persen">
                  <i data-lucide="percent" style="width: 16px; height: 16px;"></i>
                  Persentase (%)
                </button>
              </div>

              <div class="discount-input-row">
                <div class="form-group discount-input-group">
                  <label class="form-label">${diskonTipe === 'nominal' ? 'Potongan Harga (Rp)' : 'Persentase Diskon (%)'}</label>
                  <div class="discount-input-wrapper">
                    <span class="discount-input-prefix">${diskonTipe === 'nominal' ? 'Rp' : '%'}</span>
                    <input type="number" class="form-input discount-input" id="tx-diskon" placeholder="0" min="0" ${diskonTipe === 'persen' ? 'max="100"' : `max="${selectedPrice}"`} value="${diskonNilai || ''}" />
                  </div>
                </div>

                ${discountAmount > 0 ? `
                <div class="discount-preview">
                  <div class="discount-preview-item">
                    <span class="discount-preview-label">Potongan</span>
                    <span class="discount-preview-value discount-amount">-${formatRupiah(discountAmount)}</span>
                  </div>
                  <div class="discount-preview-item">
                    <span class="discount-preview-label">Harga Setelah Diskon</span>
                    <span class="discount-preview-value discount-final">${formatRupiah(finalPrice)}</span>
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          ` : ''}

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
                <div class="price-item-label">Harga Dasar</div>
                <div class="price-item-value">${formatRupiah(selectedPrice)}</div>
              </div>
              ${discountAmount > 0 ? `
              <div class="price-item">
                <div class="price-item-label">Diskon ${diskonTipe === 'persen' ? `(${diskonNilai}%)` : ''}</div>
                <div class="price-item-value discount-amount">-${formatRupiah(discountAmount)}</div>
              </div>
              ` : ''}
              <div class="price-item">
                <div class="price-item-label">${discountAmount > 0 ? 'Total Bayar' : 'Total Harga'}</div>
                <div class="price-item-value" style="font-weight: 700; ${discountAmount > 0 ? 'background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;' : ''}">${formatRupiah(finalPrice)}</div>
              </div>
            </div>

            <div class="price-breakdown" style="margin-top: var(--space-sm);">
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
              <input type="number" class="form-input" id="tx-dp" placeholder="0" min="0" max="${finalPrice}" value="${nominal_dp || ''}" />
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
      diskonNilai = 0;
      render();
    });

    // Jenis toggle
    document.querySelectorAll('.toggle-option[data-jenis]').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedJenis = opt.dataset.jenis;
        selectedDurasi = '';
        selectedPrice = 0;
        diskonNilai = 0;
        render();
      });
    });

    // Durasi selection
    document.querySelectorAll('.durasi-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedDurasi = opt.dataset.durasi;
        selectedPrice = Number(opt.dataset.harga);
        diskonNilai = 0;
        render();
      });
    });

    // Discount type toggle
    document.querySelectorAll('.discount-type-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        diskonTipe = opt.dataset.diskonTipe;
        diskonNilai = 0;
        render();
      });
    });

    // Discount value input
    document.getElementById('tx-diskon')?.addEventListener('input', (e) => {
      diskonNilai = Number(e.target.value) || 0;
      // Clamp persen to 100
      if (diskonTipe === 'persen' && diskonNilai > 100) {
        diskonNilai = 100;
        e.target.value = '100';
      }
      // Clamp nominal to selectedPrice
      if (diskonTipe === 'nominal' && diskonNilai > selectedPrice) {
        diskonNilai = selectedPrice;
        e.target.value = String(selectedPrice);
      }

      // Live-update preview without full re-render
      const discountAmt = getDiscountAmount();
      const final = getFinalPrice();
      const dp = Number(document.getElementById('tx-dp')?.value) || 0;

      // Update discount preview
      const previewAmt = document.querySelector('.discount-preview-value.discount-amount');
      const previewFinal = document.querySelector('.discount-preview-value.discount-final');
      if (previewAmt) previewAmt.textContent = `-${formatRupiah(discountAmt)}`;
      if (previewFinal) previewFinal.textContent = formatRupiah(final);

      // Update payment breakdown
      const dpDisplay = document.getElementById('dp-display');
      const sisaDisplay = document.getElementById('sisa-display');
      if (dpDisplay) dpDisplay.textContent = formatRupiah(dp);
      if (sisaDisplay) sisaDisplay.textContent = formatRupiah(Math.max(0, final - dp));

      // If discount just appeared/disappeared, do full re-render
      if ((discountAmt > 0 && !previewAmt) || (discountAmt === 0 && previewAmt)) {
        render();
      }
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
      const final = getFinalPrice();
      const dpDisplay = document.getElementById('dp-display');
      const sisaDisplay = document.getElementById('sisa-display');
      if (dpDisplay) dpDisplay.textContent = formatRupiah(dp);
      if (sisaDisplay) sisaDisplay.textContent = formatRupiah(Math.max(0, final - dp));
    });

    // Submit
    document.getElementById('submit-tx-btn')?.addEventListener('click', () => {
      const iphone_id = selectedIphoneId;
      const nama = document.getElementById('tx-nama')?.value.trim();
      const wa = document.getElementById('tx-wa')?.value.trim();
      const startVal = document.getElementById('tx-start')?.value;
      const endVal = document.getElementById('tx-end')?.value;
      const dp = Number(document.getElementById('tx-dp')?.value) || 0;
      const finalPrice = getFinalPrice();
      const discountAmount = getDiscountAmount();

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
      if (dp >= finalPrice) status_pembayaran = 'lunas';
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
        tanggal_waktu_mulai: toLocalISOString(startVal),
        tanggal_waktu_selesai: toLocalISOString(endVal),
        nominal_dp: dp,
        nominal_pelunasan: Math.max(0, finalPrice - dp),
        total_harga: finalPrice,
        diskon_tipe: discountAmount > 0 ? diskonTipe : null,
        diskon_nilai: diskonNilai,
        diskon_nominal: discountAmount,
        status_pembayaran,
        status_rental,
      });

      const diskonInfo = discountAmount > 0 ? ` (Diskon ${diskonTipe === 'persen' ? diskonNilai + '%' : formatRupiah(discountAmount)})` : '';
      logActivity(`Membuat transaksi baru ${tx.tx_number} untuk ${iphone?.model} — Pelanggan: ${nama}${diskonInfo}`);
      showToast(`Transaksi ${tx.tx_number} berhasil dibuat!`, 'success');
      navigate('/transaksi');
    });
  }

  render();
}

