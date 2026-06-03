// ============================================
// Sewanya iPhone — Theme Manager
// ============================================

const STORAGE_KEY = 'sewanya-theme';

/**
 * Get current theme ('dark' or 'light')
 */
export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

/**
 * Apply a theme to the document
 * @param {'dark'|'light'} theme
 */
export function setTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Toggle between dark and light themes
 */
export function toggleTheme() {
  const current = getTheme();
  setTheme(current === 'light' ? 'dark' : 'light');
}

/**
 * Initialize theme from localStorage (call once on app start)
 */
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light') {
    setTheme('light');
  } else {
    setTheme('dark');
  }
}
