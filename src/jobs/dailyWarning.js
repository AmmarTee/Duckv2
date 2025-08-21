import { getGuild, saveGuild, getUser, getAllUsers } from '../storage/repo.js';

/**
 * Start the daily warning job.  Checks at regular intervals whether it’s
 * time to send a low water reminder to reward channels.  Each guild is
 * evaluated independently using its configured dailyWarningHourLocal and
 * lowWaterThreshold.
 * @param {import('discord.js').Client} client
 */
export default function startDailyWarningJob(client) {
  // Run every 10 minutes
  setInterval(async () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    for (const guild of client.guilds.cache.values()) {
      const cfg = await getGuild(guild.id);
      if (!cfg.rewardChannelIds || cfg.rewardChannelIds.length === 0) continue;
      if (currentDate === cfg._lastWarningDate) continue;
      if (currentHour !== cfg.dailyWarningHourLocal) continue;
      const users = await getAllUsers(guild.id);
      const low = users.filter((u) => u.waterLevel <= cfg.lowWaterThreshold);
      const message = low.length > 0
        ? '🌧️ Daily Water Warning: some plants are thirsty! Use /duck garden water to refill.'
        : '🌿 Daily Garden Reminder: keep your plant hydrated and earn coins!';
      for (const channelId of cfg.rewardChannelIds) {
        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;
        try {
          await channel.send(message);
        } catch (_) {}
      }
      cfg._lastWarningDate = currentDate;
      await saveGuild(cfg);
    }
  }, 10 * 60 * 1000);
}