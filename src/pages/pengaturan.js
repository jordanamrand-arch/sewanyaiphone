// ============================================
// Sewanya iPhone — Pengaturan Page
// ============================================

import { store } from '../store.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { showConfirm } from '../components/confirm-dialog.js';
import { logActivity } from '../utils/activity-logger.js';

export function renderPengaturan() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  const session = store.getSession();
  let activeTab = 'profil';

  function render() {
    mainContent.innerHTML = `
      <div class="page-enter settings-container">
        <div class="page-header">
          <h1>
            <i data-lucide="settings"></i>
            Pengaturan
          </h1>
        </div>

        <div class="settings-tabs">
          <button class="settings-tab ${activeTab === 'profil' ? 'active' : ''}" data-tab="profil">Profil</button>
          ${session?.role === 'owner' ? `
            <button class="settings-tab ${activeTab === 'users' ? 'active' : ''}" data-tab="users">Manajemen User</button>
          ` : ''}
          <button class="settings-tab ${activeTab === 'tentang' ? 'active' : ''}" data-tab="tentang">Tentang</button>
        </div>

        <div class="settings-section">
          ${activeTab === 'profil' ? renderProfil() : ''}
          ${activeTab === 'users' ? renderUsers() : ''}
          ${activeTab === 'tentang' ? renderTentang() : ''}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    bindEvents();
  }

  function renderProfil() {
    const currentUser = store.getUserById(session.id);
    return `
      <h3 class="settings-section-title">Edit Profil</h3>
      <form id="profil-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Nama</label>
          <input type="text" class="form-input" id="profil-nama" value="${currentUser?.nama || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" class="form-input" id="profil-username" value="${currentUser?.username || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Password Baru (kosongkan jika tidak diubah)</label>
          <input type="password" class="form-input" id="profil-password" placeholder="••••••••" />
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary">
            <i data-lucide="save"></i>
            Simpan Profil
          </button>
        </div>
      </form>
    `;
  }

  function renderUsers() {
    const users = store.getUsers();
    return `
      <h3 class="settings-section-title">Manajemen User</h3>
      <div class="user-list">
        ${users.map(u => `
          <div class="user-list-item">
            <div class="user-list-info">
              <div class="user-list-avatar">${u.nama.charAt(0).toUpperCase()}</div>
              <div class="user-list-details">
                <span class="user-list-name">${u.nama}</span>
                <span class="user-list-role">${u.role} — @${u.username}</span>
              </div>
            </div>
            <div class="user-list-actions">
              <button class="btn btn-ghost btn-sm edit-user-btn" data-id="${u.id}">
                <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
              </button>
              ${u.id !== session.id ? `
                <button class="btn btn-ghost btn-sm delete-user-btn" data-id="${u.id}">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--status-terlambat);"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary" id="add-user-btn">
        <i data-lucide="user-plus"></i>
        Tambah User
      </button>
    `;
  }

  function renderTentang() {
    return `
      <h3 class="settings-section-title">Tentang Aplikasi</h3>
      <div class="about-info">
        <div class="about-row">
          <span class="label">Nama Aplikasi</span>
          <span class="value">Sewanya iPhone</span>
        </div>
        <div class="about-row">
          <span class="label">Versi</span>
          <span class="value">1.0.0</span>
        </div>
        <div class="about-row">
          <span class="label">Dibuat dengan</span>
          <span class="value">Vite + Vanilla JS</span>
        </div>
        <div class="about-row">
          <span class="label">Penyimpanan</span>
          <span class="value">LocalStorage (Browser)</span>
        </div>
        <div class="about-row" style="border-bottom: none;">
          <span class="label">Deskripsi</span>
          <span class="value">Sistem Manajemen Sewa iPhone</span>
        </div>
      </div>
      <div style="margin-top: var(--space-lg);">
        <button class="btn btn-danger" id="reset-data-btn">
          <i data-lucide="rotate-ccw"></i>
          Reset Semua Data
        </button>
      </div>
    `;
  }

  function bindEvents() {
    // Tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        render();
      });
    });

    // Profil form
    document.getElementById('profil-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nama = document.getElementById('profil-nama').value.trim();
      const username = document.getElementById('profil-username').value.trim();
      const password = document.getElementById('profil-password').value;

      if (!nama || !username) {
        showToast('Nama dan username wajib diisi', 'warning');
        return;
      }

      const updates = { nama, username };
      if (password) updates.password = password;

      store.updateUser(session.id, updates);
      logActivity('Memperbarui profil pengguna');
      showToast('Profil berhasil diperbarui', 'success');
      render();
    });

    // Add user
    document.getElementById('add-user-btn')?.addEventListener('click', () => {
      openUserForm();
    });

    // Edit user
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const user = store.getUserById(btn.dataset.id);
        if (user) openUserForm(user);
      });
    });

    // Delete user
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const user = store.getUserById(btn.dataset.id);
        if (!user) return;
        const confirmed = await showConfirm({
          title: 'Hapus User',
          message: `Hapus user "${user.nama}" (${user.username})? Aksi ini tidak bisa dibatalkan.`,
        });
        if (confirmed) {
          store.deleteUser(user.id);
          logActivity(`Menghapus user: ${user.nama}`);
          showToast('User berhasil dihapus', 'success');
          render();
        }
      });
    });

    // Reset data
    document.getElementById('reset-data-btn')?.addEventListener('click', async () => {
      const confirmed = await showConfirm({
        title: 'Reset Semua Data',
        message: 'PERINGATAN: Semua data akan dihapus dan dikembalikan ke data demo awal. Apakah Anda yakin?',
      });
      if (confirmed) {
        store.resetAll();
        store.init();
        showToast('Data berhasil direset ke demo', 'success');
        window.location.reload();
      }
    });
  }

  function openUserForm(editing = null) {
    const isEdit = !!editing;
    const body = `
      <div class="form-group">
        <label class="form-label">Nama</label>
        <input type="text" class="form-input" id="modal-user-nama" value="${editing?.nama || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Username</label>
        <input type="text" class="form-input" id="modal-user-username" value="${editing?.username || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">${isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}</label>
        <input type="password" class="form-input" id="modal-user-password" placeholder="••••••••" />
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <div class="toggle-group">
          <button type="button" class="toggle-option ${!editing || editing.role === 'karyawan' ? 'active' : ''}" data-role="karyawan">Karyawan</button>
          <button type="button" class="toggle-option ${editing?.role === 'owner' ? 'active' : ''}" data-role="owner">Owner</button>
        </div>
      </div>
    `;

    showModal({
      title: isEdit ? 'Edit User' : 'Tambah User Baru',
      body,
      onSubmit: (close) => {
        const nama = document.getElementById('modal-user-nama').value.trim();
        const username = document.getElementById('modal-user-username').value.trim();
        const password = document.getElementById('modal-user-password').value;
        const activeRole = document.querySelector('.toggle-option.active');
        const role = activeRole?.dataset.role || 'karyawan';

        if (!nama || !username) {
          showToast('Nama dan username wajib diisi', 'warning');
          return;
        }
        if (!isEdit && !password) {
          showToast('Password wajib diisi', 'warning');
          return;
        }

        const data = { nama, username, role };
        if (password) data.password = password;

        if (isEdit) {
          store.updateUser(editing.id, data);
          logActivity(`Mengubah data user: ${nama}`);
          showToast('User berhasil diperbarui', 'success');
        } else {
          store.addUser(data);
          logActivity(`Menambahkan user baru: ${nama} (${role})`);
          showToast('User baru berhasil ditambahkan', 'success');
        }

        close();
        render();
      },
    });

    // Toggle
    document.querySelectorAll('.toggle-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.toggle-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
      });
    });
  }

  render();
}
