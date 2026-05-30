// ============================================
// Sewanya iPhone — Hash-based SPA Router
// ============================================

const routes = {};
let currentCleanup = null;

/**
 * Register a route
 * @param {string} path - e.g. '/dashboard', '/transaksi/:id'
 * @param {Function} handler - (params) => void
 */
export function route(path, handler) {
  routes[path] = handler;
}

/**
 * Navigate to a route
 * @param {string} path
 */
export function navigate(path) {
  window.location.hash = `#${path}`;
}

/**
 * Get current hash path
 */
function getHash() {
  return window.location.hash.slice(1) || '/login';
}

/**
 * Match route with params support
 * @param {string} pattern - e.g. '/transaksi/:id'
 * @param {string} path - e.g. '/transaksi/tx-1'
 * @returns {Object|null} params or null
 */
function matchRoute(pattern, path) {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

/**
 * Handle hash change
 */
function handleRoute() {
  const path = getHash();

  // Run cleanup from previous page
  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  // Try exact match first
  if (routes[path]) {
    const result = routes[path]({});
    if (typeof result === 'function') currentCleanup = result;
    return;
  }

  // Try parameterized routes
  for (const [pattern, handler] of Object.entries(routes)) {
    const params = matchRoute(pattern, path);
    if (params) {
      const result = handler(params);
      if (typeof result === 'function') currentCleanup = result;
      return;
    }
  }

  // 404 - redirect to dashboard
  navigate('/dashboard');
}

/**
 * Start the router
 */
export function startRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

/**
 * Set cleanup for current page (intervals, event listeners, etc.)
 */
export function setCleanup(fn) {
  currentCleanup = fn;
}
