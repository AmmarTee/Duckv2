import { getGuild, saveGuild, getUser, saveUser, getAllUsers } from '../storage/repo.js';
import { buildGardenEmbed } from '../features/garden.js';
import { buildLeaderboardEmbed } from '../features/leaderboard.js';
import { claimDaily } from '../features/economy.js';

/**
 * Handle component interactions such as buttons.
 * @param {import('discord.js').Interaction} interaction
 */
export async function handleComponent(interaction) {
  if (!interaction.isButton()) return;
  const [scope, action] = interaction.customId.split(':');
  const guildId = interaction.guildId;
  const cfg = await getGuild(guildId);
  if (scope === 'garden') {
    // Ensure channel configured
    if (!cfg.gardenChannelId || cfg.gardenMessageId !== interaction.message.id) {
      await interaction.reply({ content: 'This garden panel is out of date.', ephemeral: true });
      return;
    }
    if (action === 'water') {
      const user = await getUser(guildId, interaction.user.id);
      if (user.coins < cfg.waterCost) {
        await interaction.reply({ content: `You need ${cfg.waterCost} coins to water your plant.`, ephemeral: true });
        return;
      }
      user.coins -= cfg.waterCost;
      user.waterLevel = cfg.plantMaxWater;
      await saveUser(user);
      await interaction.reply({ content: `You watered your plant for ${cfg.waterCost} coins.`, ephemeral: true });
      // Refresh panel
      const channel = interaction.channel;
      const users = await getAllUsers(guildId);
      const embed = buildGardenEmbed(cfg, users);
      await interaction.message.edit({ embeds: [embed] });
    } else if (action === 'daily') {
      const result = await claimDaily(cfg, guildId, interaction.user.id);
      if (result.ok) {
        await interaction.reply({ content: `You claimed your daily reward! Streak: ${result.streak}, bonus: ${result.bonus} coins/xp.`, ephemeral: true });
      } else {
        await interaction.reply({ content: result.message, ephemeral: true });
      }
    }
  } else if (scope === 'lb' && action === 'refresh') {
    // Limit refresh to once per day per user
    const user = await getUser(guildId, interaction.user.id);
    const today = new Date().toISOString().split('T')[0];
    if (user.lastLbRefresh === today) {
      await interaction.reply({ content: 'You have already refreshed the leaderboard today.', ephemeral: true });
      return;
    }
    user.lastLbRefresh = today;
    await saveUser(user);
    const users = await getAllUsers(guildId);
    const embed = buildLeaderboardEmbed(users);
    await interaction.message.edit({ embeds: [embed] });
    await interaction.reply({ content: 'Leaderboard refreshed!', ephemeral: true });
  }
}