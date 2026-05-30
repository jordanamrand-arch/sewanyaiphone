// ============================================
// Sewanya iPhone — Jadwal Sewa (Gantt Chart)
// ============================================

import { store } from '../store.js';
import { navigate } from '../router.js';

export function renderJadwal() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  const iphones = store.getIphones();
  const transactions = store.getTransactions().filter(t => 
    t.status_rental === 'aktif_disewa' || 
    t.status_rental === 'booking' || 
    t.status_rental === 'terlambat'
  );

  // Define date range: from 3 days ago to 14 days ahead
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dates = [];
  for (let i = -3; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  mainContent.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <h1>
          <i data-lucide="calendar-days"></i>
          Jadwal Sewa
        </h1>
        <p class="text-muted">Visualisasi jadwal penyewaan dan ketersediaan unit</p>
      </div>

      <div class="jadwal-controls" style="margin-top: var(--space-xl);">
        <div class="jadwal-legend">
          <div class="legend-item">
            <div class="legend-color" style="background: #3b82f6;"></div> Aktif
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: #a78bfa;"></div> Booking
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: #ef4444;"></div> Terlambat
          </div>
        </div>
      </div>

      <div class="jadwal-container">
        <table class="jadwal-table">
          <thead>
            <tr>
              <th style="min-width: 150px;">Unit iPhone</th>
              ${dates.map(d => `
                <th style="min-width: 50px; ${d.getTime() === today.getTime() ? 'background: rgba(59, 130, 246, 0.1); color: #3b82f6;' : ''}">
                  ${d.getDate()}<br>
                  <span style="font-size: 0.65rem; opacity: 0.7;">
                    ${d.toLocaleDateString('id-ID', { weekday: 'short' })}
                  </span>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${iphones.map(iphone => {
              // Get transactions for this iphone
              const txs = transactions.filter(t => t.iphone_id === iphone.id);
              
              return `
                <tr>
                  <td class="iphone-name">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <i data-lucide="smartphone" style="width: 14px; height: 14px;"></i>
                      ${iphone.model}
                    </div>
                  </td>
                  ${dates.map(d => {
                    const nextD = new Date(d);
                    nextD.setDate(nextD.getDate() + 1);
                    
                    // Find if any transaction overlaps with this date
                    const overlappingTx = txs.find(t => {
                      const start = new Date(t.tanggal_waktu_mulai);
                      const end = new Date(t.tanggal_waktu_selesai);
                      return start < nextD && end > d;
                    });

                    let blockHtml = '';
                    if (overlappingTx) {
                      // Only render block label on the start day or if it's the first day of our view
                      const isStartDay = new Date(overlappingTx.tanggal_waktu_mulai) >= d && new Date(overlappingTx.tanggal_waktu_mulai) < nextD;
                      const isFirstViewDay = d.getTime() === dates[0].getTime();
                      
                      const label = isStartDay || isFirstViewDay ? overlappingTx.nama_pelanggan : '';
                      
                      blockHtml = `
                        <div class="jadwal-block ${overlappingTx.status_rental}" 
                             title="${overlappingTx.tx_number} - ${overlappingTx.nama_pelanggan}"
                             onclick="window.location.hash='#/transaksi/${overlappingTx.id}'">
                          ${label}
                        </div>
                      `;
                    }

                    return `
                      <td class="jadwal-cell ${d.getTime() === today.getTime() ? 'today' : ''}" style="${d.getTime() === today.getTime() ? 'background: rgba(59, 130, 246, 0.02);' : ''}">
                        ${blockHtml}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}
