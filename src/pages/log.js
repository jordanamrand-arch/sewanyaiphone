// ============================================
// Sewanya iPhone — Log Aktivitas Page
// ============================================

import { store } from '../store.js';
import { formatDateTime } from '../utils/format.js';

export function renderLog() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  let filterUser = 'semua';

  function render() {
    let logs = store.getLogs().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const users = store.getUsers();

    if (filterUser !== 'semua') {
      logs = logs.filter(l => l.user_id === filterUser);
    }

    // Group by date
    const grouped = {};
    logs.forEach(log => {
      const dateKey = new Date(log.created_at).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(log);
    });

    mainContent.innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <h1>
            <i data-lucide="scroll-text"></i>
            Log Aktivitas
          </h1>
        </div>

        <div class="log-filters">
          <div class="form-group log-filter-select">
            <label class="form-label">Filter User</label>
            <select class="form-input" id="log-user-filter">
              <option value="semua">Semua User</option>
              ${users.map(u => `
                <option value="${u.id}" ${u.id === filterUser ? 'selected' : ''}>${u.nama} (${u.role})</option>
              `).join('')}
            </select>
          </div>
        </div>

        ${Object.keys(grouped).length > 0 ? `
          <div class="log-timeline">
            ${Object.entries(grouped).map(([dateKey, entries]) => `
              <div class="log-date-group">
                <div class="log-date-header">
                  <i data-lucide="calendar"></i>
                  ${dateKey}
                </div>
                <div class="log-entries">
                  ${entries.map(log => {
      const logUser = store.getUserById(log.user_id);
      const time = new Date(log.created_at).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `
                      <div class="log-entry">
                        <div class="log-entry-header">
                          <span class="log-entry-user">
                            <i data-lucide="user"></i>
                            ${logUser?.nama || 'System'}
                            <span class="badge badge-${logUser?.role === 'owner' ? 'aktif' : 'booking'}" style="font-size: 0.65rem;">${logUser?.role || 'system'}</span>
                          </span>
                          <span class="log-entry-time">${time}</span>
                        </div>
                        <p class="log-entry-text">${log.aktivitas || ''}</p>
                      </div>
                    `;
    }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <i data-lucide="scroll-text" class="empty-state-icon"></i>
            <p class="empty-state-title">Tidak ada log aktivitas</p>
            <p class="empty-state-desc">Aktivitas akan tercatat saat Anda mulai menggunakan sistem</p>
          </div>
        `}
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    document.getElementById('log-user-filter')?.addEventListener('change', (e) => {
      filterUser = e.target.value;
      render();
    });
  }

  render();
}
