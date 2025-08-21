import { getGuild, saveGuild } from '../storage/repo.js';

/**
 * Ensures that garden and leaderboard panels remain pinned and exist.
 * Runs periodically to detect manual unpinning or deletion.
 * @param {import('discord.js').Client} client
 */
export default function startPanelKeepaliveJob(client) {
  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      const cfg = await getGuild(guild.id);
      // Check garden panel
      if (cfg.gardenChannelId && cfg.gardenMessageId) {
        const channel = guild.channels.cache.get(cfg.gardenChannelId);
        if (channel) {
          try {
            const message = await channel.messages.fetch(cfg.gardenMessageId);
            if (!message.pinned) {
              try {
                await message.pin();
              } catch (_) {}
            }
          } catch (e) {
            // Message deleted; clear message ID so it can be recreated
            cfg.gardenMessageId = null;
            await saveGuild(cfg);
          }
        }
      }
      // Check leaderboard panel
      if (cfg.leaderboardChannelId && cfg.leaderboardMessageId) {
        const channel = guild.channels.cache.get(cfg.leaderboardChannelId);
        if (channel) {
          try {
            const message = await channel.messages.fetch(cfg.leaderboardMessageId);
            if (!message.pinned) {
              try {
                await message.pin();
              } catch (_) {}
            }
          } catch (e) {
            cfg.leaderboardMessageId = null;
            await saveGuild(cfg);
          }
        }
      }
    }
  }, 30 * 60 * 1000);
}