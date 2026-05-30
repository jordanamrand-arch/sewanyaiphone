// ============================================
// Sewanya iPhone — Confirm Dialog Component
// ============================================

/**
 * Show a confirm dialog
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.confirmLabel='Hapus']
 * @param {string} [options.cancelLabel='Batal']
 * @param {boolean} [options.danger=true]
 * @returns {Promise<boolean>}
 */
export function showConfirm({
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  danger = true,
}) {
  return new Promise((resolve) => {
    const container = document.getElementById('confirm-container');
    if (!container) return resolve(false);

    container.innerHTML = `
      <div class="confirm-overlay" id="confirm-overlay">
        <div class="confirm-box">
          <div class="confirm-icon">
            <i data-lucide="alert-triangle"></i>
          </div>
          <h3 class="confirm-title">${title}</h3>
          <p class="confirm-message">${message}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" id="confirm-cancel">${cancelLabel}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmLabel}</button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    const close = (result) => {
      const overlay = document.getElementById('confirm-overlay');
      if (overlay) {
        overlay.style.animation = 'fadeOut 0.2s forwards';
        setTimeout(() => {
          container.innerHTML = '';
          resolve(result);
        }, 200);
      }
    };

    document.getElementById('confirm-cancel')?.addEventListener('click', () => close(false));
    document.getElementById('confirm-ok')?.addEventListener('click', () => close(true));
    document.getElementById('confirm-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'confirm-overlay') close(false);
    });
  });
}
