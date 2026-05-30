// ============================================
// Sewanya iPhone — Activity Logger
// ============================================

import { store } from '../store.js';

/**
 * Log an activity to the activity_logs store
 * @param {string} aktivitas - Description of the activity
 */
export function logActivity(aktivitas) {
  const session = store.getSession();
  if (!session) return;

  store.addLog({
    user_id: session.id,
    aktivitas,
    created_at: new Date().toISOString(),
  });
}
