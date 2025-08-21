import { getGuild, saveGuild, getUser, saveUser, getAllUsers } from '../storage/repo.js';

/**
 * Reward a user for sending a message in a reward channel.
 * Awards half of the configured coins/xp (passive gain) if cooldown has passed.
 * @param {object} cfg Guild configuration
 * @param {string} guildId
 * @param {string} userId
 */
export async function rewardActivity(cfg, guildId, userId) {
  const user = await getUser(guildId, userId);
  const now = Date.now();
  if (now - user.lastPlayAt < cfg.cooldownSeconds * 1000) {
    return;
  }
  user.lastPlayAt = now;
  user.coins += Math.floor(cfg.coinsPerWin / 2);
  user.xp += Math.floor(cfg.xpPerWin / 2);
  await saveUser(user);
}

/**
 * Award a full win (coins/xp) to a user, used for game victories.
 */
export async function awardWin(cfg, guildId, userId) {
  const user = await getUser(guildId, userId);
  user.coins += cfg.coinsPerWin;
  user.xp += cfg.xpPerWin;
  await saveUser(user);
}

/**
 * Claim a daily reward.  Respects one claim per UTC day and increments streak.
 * Returns an object describing the result.
 */
export async function claimDaily(cfg, guildId, userId) {
  const user = await getUser(guildId, userId);
  const today = new Date().toISOString().split('T')[0];
  if (user.lastDaily === today) {
    return { ok: false, message: 'You have already claimed your daily reward today.' };
  }
  // Reset streak if previous daily was more than 1 day ago
  if (user.lastDaily && new Date(user.lastDaily) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) {
    user.dailyStreak = 0;
  }
  user.lastDaily = today;
  user.dailyStreak += 1;
  const bonus = user.dailyStreak * 2; // streak bonus coins
  user.coins += cfg.coinsPerWin + bonus;
  user.xp += cfg.xpPerWin + bonus;
  await saveUser(user);
  return { ok: true, streak: user.dailyStreak, bonus };
}

/**
 * Transfer coins from one user to another.  Returns an object describing the result.
 */
export async function sendCoins(guildId, fromUserId, toUserId, amount) {
  if (amount <= 0) {
    return { ok: false, message: 'Amount must be positive.' };
  }
  const sender = await getUser(guildId, fromUserId);
  const recipient = await getUser(guildId, toUserId);
  if (sender.coins < amount) {
    return { ok: false, message: 'Insufficient coins.' };
  }
  sender.coins -= amount;
  recipient.coins += amount;
  await saveUser(sender);
  await saveUser(recipient);
  return { ok: true };
}