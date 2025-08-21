import path from 'path';
import { load, save } from './jsonStore.js';

const dataDir = path.resolve('data');
const guildsFile = path.join(dataDir, 'guilds.json');
const usersFile = path.join(dataDir, 'users.json');

let guilds;
let users;

async function init() {
  if (!guilds) {
    guilds = await load(guildsFile, {});
  }
  if (!users) {
    users = await load(usersFile, {});
  }
}

/**
 * Get or create configuration for a guild.
 * @param {string} guildId
 */
export async function getGuild(guildId) {
  await init();
  if (!guilds[guildId]) {
    guilds[guildId] = {
      guildId,
      gardenChannelId: null,
      gardenMessageId: null,
      leaderboardChannelId: null,
      leaderboardMessageId: null,
      rewardChannelIds: [],
      waterCost: 10,
      plantMaxWater: 100,
      waterDecIntervalMin: 60,
      waterDecAmount: 1,
      coinsPerWin: 20,
      xpPerWin: 10,
      cooldownSeconds: 30,
      dailyWarningHourLocal: 20,
      lowWaterThreshold: 20,
      gamesEnabled: true,
      _lastDegradeAt: Date.now(),
      _lastWarningDate: new Date().toISOString().split('T')[0],
      gamesAutoChain: true,
      gameDelayMinSec: 10,
      gameDelayMaxSec: 30
    };
  }
  return guilds[guildId];
}

export async function saveGuild(config) {
  await init();
  guilds[config.guildId] = config;
  await save(guildsFile, guilds);
}

/**
 * Get or create a veteran user entry.
 * @param {string} guildId
 * @param {string} userId
 */
export async function getUser(guildId, userId) {
  await init();
  const key = `${guildId}:${userId}`;
  if (!users[key]) {
    const cfg = await getGuild(guildId);
    users[key] = {
      guildId,
      userId,
      coins: 0,
      xp: 0,
      plantStartTs: Date.now(),
      waterLevel: cfg.plantMaxWater,
      lastPlayAt: 0,
      lastDaily: '',
      dailyStreak: 0,
      lastLbRefresh: ''
    };
  }
  return users[key];
}

export async function saveUser(veteran) {
  await init();
  const key = `${veteran.guildId}:${veteran.userId}`;
  users[key] = veteran;
  await save(usersFile, users);
}

export async function getAllUsers(guildId) {
  await init();
  return Object.values(users).filter((u) => u.guildId === guildId);
}

export async function getAllUsersAllGuilds() {
  await init();
  return Object.values(users);
}