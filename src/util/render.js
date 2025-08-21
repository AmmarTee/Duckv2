import { time } from 'discord.js';

/**
 * Render a human‑friendly duration given minutes left until dry.
 * Returns strings such as "dead", "<h>h <m>m", "<m>m".
 * @param {number} minutesLeft
 */
export function formatDuration(minutesLeft) {
  if (minutesLeft <= 0) return 'dead';
  const hours = Math.floor(minutesLeft / 60);
  const minutes = Math.floor(minutesLeft % 60);
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

/**
 * Render an XP bar using Unicode block characters.  The bar is 10 units wide.
 * @param {number} xp
 * @param {number} maxXp
 */
export function renderXpBar(xp, maxXp = 100) {
  const size = 10;
  const ratio = Math.min(1, xp / maxXp);
  const filled = Math.round(ratio * size);
  const empty = size - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

/**
 * Pick an emoji based on water level relative to max.
 * @param {number} waterLevel
 * @param {number} max
 * @param {number} lowThreshold
 */
export function plantEmoji(waterLevel, max, lowThreshold) {
  if (waterLevel <= 0) return '💀';
  if (waterLevel <= lowThreshold) return '🥀';
  const ratio = waterLevel / max;
  if (ratio < 0.25) return '🌱';
  if (ratio < 0.5) return '🌿';
  if (ratio < 0.75) return '🪴';
  return '🌳';
}