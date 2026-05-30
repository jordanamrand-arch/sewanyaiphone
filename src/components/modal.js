// ============================================
// Sewanya iPhone — Modal Component
// ============================================

/**
 * Show a modal dialog
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.body - HTML content
 * @param {string} [options.submitLabel='Simpan']
 * @param {string} [options.cancelLabel='Batal']
 * @param {Function} [options.onSubmit]
 * @param {Function} [options.onClose]
 * @param {boolean} [options.hideFooter=false]
 */
export function showModal({ title, body, submitLabel = 'Simpan', cancelLabel = 'Batal', onSubmit, onClose, hideFooter = false }) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="btn-icon btn-ghost modal-close-btn" id="modal-close-btn">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-body" id="modal-body">
          ${body}
        </div>
        ${!hideFooter ? `
          <div class="modal-footer">
            <button class="btn btn-secondary" id="modal-cancel-btn">${cancelLabel}</button>
            <button class="btn btn-primary" id="modal-submit-btn">${submitLabel}</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  const close = () => {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.style.animation = 'fadeOut 0.2s forwards';
      setTimeout(() => {
        container.innerHTML = '';
        if (onClose) onClose();
      }, 200);
    }
  };

  // Close button
  document.getElementById('modal-close-btn')?.addEventListener('click', close);
  document.getElementById('modal-cancel-btn')?.addEventListener('click', close);

  // Click overlay to close
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') close();
  });

  // Submit
  document.getElementById('modal-submit-btn')?.addEventListener('click', () => {
    if (onSubmit) onSubmit(close);
  });

  // ESC to close
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  return { close, getBody: () => document.getElementById('modal-body') };
}

/**
 * Close any open modal
 */
export function closeModal() {
  const container = document.getElementById('modal-container');
  if (container) container.innerHTML = '';
}
