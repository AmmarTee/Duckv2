// Simple in‑memory rate limiter.  Not persisted across restarts.

const timestamps = new Map();

/**
 * Check whether a key (typically a user ID) is allowed to perform an action again.
 * If allowed, updates the timestamp to now.  If not, returns false.
 * @param {string} key
 * @param {number} delaySeconds Minimum delay between actions for this key
 */
export function consume(key, delaySeconds) {
  const now = Date.now();
  const last = timestamps.get(key) || 0;
  if (now - last < delaySeconds * 1000) {
    return false;
  }
  timestamps.set(key, now);
  return true;
}