// ============================================
// Sewanya iPhone — Sidebar Component
// ============================================

import { store } from '../store.js';
import { navigate } from '../router.js';
import { getTheme, toggleTheme } from '../utils/theme.js';

const NAV_ITEMS = [
  { path: '/dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
  { path: '/jadwal', icon: 'calendar-days', label: 'Jadwal Sewa' },
  { path: '/inventaris', icon: 'smartphone', label: 'Inventaris' },
  { path: '/harga', icon: 'wallet', label: 'Matriks Harga' },
  { path: '/transaksi', icon: 'clipboard-list', label: 'Transaksi' },
  { path: '/laporan', icon: 'file-bar-chart', label: 'Laporan' },
  { path: '/log', icon: 'scroll-text', label: 'Log Aktivitas' },
];

const BOTTOM_ITEMS = [
  { path: '/pengaturan', icon: 'settings', label: 'Pengaturan' },
];

let isCollapsed = false;

export function renderSidebar(container) {
  const session = store.getSession();
  const currentPath = window.location.hash.slice(1) || '/dashboard';

  container.innerHTML = `
    <aside class="sidebar ${isCollapsed ? 'collapsed' : ''}" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="/logo.png" alt="SewaNya iPhone" class="sidebar-logo-img" />
          <span class="logo-text">SewaNya iPhone</span>
        </div>
        <button class="sidebar-toggle" id="sidebar-toggle" title="Toggle Sidebar">
          <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-left'}"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-section-label">Menu</span>
          ${NAV_ITEMS.map(
    (item) => `
            <a href="#${item.path}" class="nav-item ${currentPath.startsWith(item.path) ? 'active' : ''}" data-path="${item.path}">
              <i data-lucide="${item.icon}"></i>
              <span class="nav-label">${item.label}</span>
            </a>
          `
  ).join('')}
        </div>
      </nav>

      <div class="sidebar-footer">
        ${BOTTOM_ITEMS.map(
    (item) => `
          <a href="#${item.path}" class="nav-item ${currentPath === item.path ? 'active' : ''}" data-path="${item.path}">
            <i data-lucide="${item.icon}"></i>
            <span class="nav-label">${item.label}</span>
          </a>
        `
  ).join('')}

        <button class="nav-item theme-toggle-btn" id="theme-toggle-btn" title="Ganti Tema">
          <i data-lucide="${getTheme() === 'light' ? 'moon' : 'sun'}"></i>
          <span class="nav-label">${getTheme() === 'light' ? 'Mode Gelap' : 'Mode Terang'}</span>
        </button>

        <button class="nav-item logout-btn" id="logout-btn">
          <i data-lucide="log-out"></i>
          <span class="nav-label">Logout</span>
        </button>

        <div class="sidebar-user">
          <div class="user-avatar">
            ${session?.nama?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div class="user-info">
            <span class="user-name">${session?.nama || 'User'}</span>
            <span class="user-role">${session?.role === 'owner' ? 'Owner' : 'Karyawan'}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    
    <!-- Mobile hamburger -->
    <button class="mobile-menu-btn" id="mobile-menu-btn">
      <i data-lucide="menu"></i>
    </button>
  `;

  // Reinitialize Lucide icons
  if (window.lucide) lucide.createIcons();

  // Toggle sidebar
  const toggleBtn = document.getElementById('sidebar-toggle');
  toggleBtn?.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar?.classList.toggle('collapsed', isCollapsed);
    mainContent?.classList.toggle('sidebar-collapsed', isCollapsed);
    toggleBtn.innerHTML = `<i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-left'}"></i>`;
    if (window.lucide) lucide.createIcons();
  });

  // Mobile menu
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const overlay = document.getElementById('sidebar-overlay');
  const sidebar = document.getElementById('sidebar');

  mobileBtn?.addEventListener('click', () => {
    sidebar?.classList.add('mobile-open');
    overlay?.classList.add('active');
  });

  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('mobile-open');
    overlay?.classList.remove('active');
  });

  // Close mobile sidebar on nav click
  container.querySelectorAll('.nav-item[data-path]').forEach((item) => {
    item.addEventListener('click', () => {
      sidebar?.classList.remove('mobile-open');
      overlay?.classList.remove('active');
    });
  });

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  themeBtn?.addEventListener('click', () => {
    toggleTheme();
    renderSidebar(container);
  });

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    store.clearSession();
    navigate('/login');
  });
}
