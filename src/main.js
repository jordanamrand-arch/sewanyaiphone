// ============================================
// Sewanya iPhone — Main Entry Point
// ============================================

// Styles
import './styles/index.css';
import './styles/components.css';
import './styles/sidebar.css';
import './styles/login.css';
import './styles/dashboard.css';
import './styles/inventaris.css';
import './styles/harga.css';
import './styles/transaksi.css';
import './styles/log.css';
import './styles/pengaturan.css';

// Core
import { store } from './store.js';
import { route, startRouter, navigate } from './router.js';

// Components
import { renderSidebar } from './components/sidebar.js';

// Pages
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderInventaris } from './pages/inventaris.js';
import { renderHarga } from './pages/harga.js';
import { renderTransaksiList } from './pages/transaksi-list.js';
import { renderTransaksiForm } from './pages/transaksi-form.js';
import { renderTransaksiDetail } from './pages/transaksi-detail.js';
import { renderLog } from './pages/log.js';
import { renderPengaturan } from './pages/pengaturan.js';
import { renderJadwal } from './pages/jadwal.js';
import { renderLaporan } from './pages/laporan.js';

// ============ Initialize ============

// Init store (loads all data from Supabase API)
await store.init();

// ============ Auth Guard ============
function requireAuth(renderFn) {
  return (params) => {
    if (!store.isLoggedIn()) {
      navigate('/login');
      return;
    }
    renderAppShell();
    return renderFn(params);
  };
}

// ============ App Shell ============
function renderAppShell() {
  const app = document.getElementById('app');
  if (app.querySelector('.app-layout')) {
    // Update sidebar active state
    const sidebarContainer = app.querySelector('.sidebar-container');
    if (sidebarContainer) renderSidebar(sidebarContainer);
    return;
  }

  app.innerHTML = `
    <div class="app-layout">
      <div class="sidebar-container"></div>
      <main class="main-content"></main>
    </div>
  `;

  const sidebarContainer = app.querySelector('.sidebar-container');
  renderSidebar(sidebarContainer);
}

// ============ Routes ============
route('/login', () => {
  renderLogin();
});

route('/dashboard', requireAuth(() => {
  return renderDashboard();
}));

route('/inventaris', requireAuth(() => {
  renderInventaris();
}));

route('/harga', requireAuth(() => {
  renderHarga();
}));

route('/transaksi', requireAuth(() => {
  renderTransaksiList();
}));

route('/transaksi/baru', requireAuth(() => {
  renderTransaksiForm();
}));

route('/transaksi/:id', requireAuth((params) => {
  return renderTransaksiDetail(params);
}));

route('/log', requireAuth(() => {
  renderLog();
}));

route('/jadwal', requireAuth(() => {
  renderJadwal();
}));

route('/laporan', requireAuth(() => {
  renderLaporan();
}));

route('/pengaturan', requireAuth(() => {
  renderPengaturan();
}));

// ============ Start ============
startRouter();

// Default redirect
if (!window.location.hash || window.location.hash === '#/') {
  if (store.isLoggedIn()) {
    navigate('/dashboard');
  } else {
    navigate('/login');
  }
}
