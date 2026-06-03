// ============================================
// Sewanya iPhone — Login Page
// ============================================

import { store } from '../store.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';

export function renderLogin() {
  // If already logged in, redirect
  if (store.isLoggedIn()) {
    navigate('/dashboard');
    return;
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <div class="login-bg">
        <div class="login-bg-extra"></div>
      </div>

      <div class="login-card">
        <div class="login-logo">
          <img src="/logo.svg" alt="SewaNya iPhone" class="login-logo-img" />
        </div>

        <form class="login-form" id="login-form">
          <div class="form-group">
            <div class="form-input-icon">
              <i data-lucide="user" class="input-icon"></i>
              <input
                type="text"
                class="form-input"
                id="login-username"
                placeholder="Username"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <div class="form-input-icon">
              <i data-lucide="lock" class="input-icon"></i>
              <input
                type="password"
                class="form-input"
                id="login-password"
                placeholder="Password"
                autocomplete="current-password"
                required
              />
              <i data-lucide="eye" class="input-icon-right" id="toggle-password"></i>
            </div>
          </div>

          <button type="submit" class="btn btn-primary login-btn" id="login-btn">
            <i data-lucide="log-in"></i>
            Masuk
          </button>
        </form>

        <div style="margin-top: var(--space-lg); text-align: center;">
          <p style="font-size: 0.75rem; color: var(--text-muted);">
            Demo: admin / admin123
          </p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Toggle password visibility
  const toggleBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('login-password');
  let showPassword = false;

  toggleBtn?.addEventListener('click', () => {
    showPassword = !showPassword;
    passwordInput.type = showPassword ? 'text' : 'password';
    toggleBtn.setAttribute('data-lucide', showPassword ? 'eye-off' : 'eye');
    if (window.lucide) lucide.createIcons();
  });

  // Form submit
  const form = document.getElementById('login-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      showToast('Silakan isi username dan password', 'warning');
      return;
    }

    const user = await store.login(username, password);
    if (user) {
      showToast(`Selamat datang, ${user.nama}!`, 'success');
      navigate('/dashboard');
    } else {
      showToast('Username atau password salah', 'error');
      document.getElementById('login-password').value = '';
      document.getElementById('login-password').classList.add('error');
      setTimeout(() => {
        document.getElementById('login-password')?.classList.remove('error');
      }, 600);
    }
  });
}
