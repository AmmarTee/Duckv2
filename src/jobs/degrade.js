import { getGuild, saveGuild, getUser, saveUser, getAllUsers, getAllUsersAllGuilds } from '../storage/repo.js';
import { buildGardenEmbed } from '../features/garden.js';

/**
 * Start the water degradation job.  Runs every minute, checks each guild’s
 * configuration and reduces water levels accordingly.  Refreshes the garden
 * panel if necessary.
 * @param {import('discord.js').Client} client
 */
export default function startDegradeJob(client) {
  setInterval(async () => {
    const now = Date.now();
    // Preload all users to know which guilds exist
    const allUsers = await getAllUsersAllGuilds();
    const guildIds = new Set(allUsers.map((u) => u.guildId));
    for (const guildId of guildIds) {
      const cfg = await getGuild(guildId);
      const intervalMs = cfg.waterDecIntervalMin * 60 * 1000;
      if (now - (cfg._lastDegradeAt || 0) >= intervalMs) {
        const users = await getAllUsers(guildId);
        let changed = false;
        for (const u of users) {
          const before = u.waterLevel;
          u.waterLevel = Math.max(0, u.waterLevel - cfg.waterDecAmount);
          if (u.waterLevel !== before) changed = true;
          await saveUser(u);
        }
        cfg._lastDegradeAt = now;
        await saveGuild(cfg);
        if (changed && cfg.gardenChannelId && cfg.gardenMessageId) {
          const guild = client.guilds.cache.get(guildId);
          if (!guild) continue;
          const channel = guild.channels.cache.get(cfg.gardenChannelId);
          if (!channel) continue;
          try {
            const message = await channel.messages.fetch(cfg.gardenMessageId);
            const embed = buildGardenEmbed(cfg, users);
            await message.edit({ embeds: [embed] });
          } catch (_) {}
        }
      }
    }
  }, 60 * 1000);
}