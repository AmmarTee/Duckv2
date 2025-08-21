import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { getGuild, saveGuild, getUser, saveUser, getAllUsers } from '../storage/repo.js';
import { buildGardenEmbed } from '../features/garden.js';
import { buildLeaderboardEmbed } from '../features/leaderboard.js';
import { claimDaily, sendCoins } from '../features/economy.js';
import { playGame } from '../features/games/engine.js';
import { requireAdmin } from '../util/perms.js';

// Define slash command data for registration
export const data = new SlashCommandBuilder()
  .setName('duck')
  .setDescription('Interact with the Duck garden and games')
  // config group
  .addSubcommandGroup(group => group
    .setName('config')
    .setDescription('Configure guild settings')
    .addSubcommand(sub => sub
      .setName('set-garden')
      .setDescription('Set the garden channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('Text channel for the garden panel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(sub => sub
      .setName('set-leaderboard')
      .setDescription('Set the leaderboard channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('Text channel for the leaderboard panel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(sub => sub
      .setName('add-reward')
      .setDescription('Add a reward channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('Text channel to grant passive rewards').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(sub => sub
      .setName('remove-reward')
      .setDescription('Remove a reward channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('Text channel to stop rewarding').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('List current configuration'))
  )
  // garden group
  .addSubcommandGroup(group => group
    .setName('garden')
    .setDescription('Interact with the garden')
    .addSubcommand(sub => sub
      .setName('post')
      .setDescription('Create or refresh the garden panel'))
    .addSubcommand(sub => sub
      .setName('water')
      .setDescription('Water your plant if you have enough coins'))
  )
  // coins group
  .addSubcommandGroup(group => group
    .setName('coins')
    .setDescription('Manage your coins')
    .addSubcommand(sub => sub
      .setName('send')
      .setDescription('Send coins to another user')
      .addUserOption(opt => opt.setName('to').setDescription('Recipient').setRequired(true))
      .addIntegerOption(opt => opt.setName('amount').setDescription('Coins to send').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('daily')
      .setDescription('Claim your daily reward'))
  )
  // play group
  .addSubcommandGroup(group => group
    .setName('play')
    .setDescription('Play a mini game')
    .addSubcommand(sub => sub
      .setName('unscramble')
      .setDescription('Unscramble a word'))
    .addSubcommand(sub => sub
      .setName('fill')
      .setDescription('Fill in the blank'))
    .addSubcommand(sub => sub
      .setName('math')
      .setDescription('Answer a quick math problem'))
  )
  // leaderboard group
  .addSubcommandGroup(group => group
    .setName('leaderboard')
    .setDescription('Leaderboard functions')
    .addSubcommand(sub => sub
      .setName('post')
      .setDescription('Create or refresh the leaderboard panel'))
  )
  // about (no group)
  .addSubcommand(sub => sub
    .setName('about')
    .setDescription('Learn about the bot'));

/**
 * Dispatch interactions for the /duck command.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function handle(interaction) {
  const guildId = interaction.guildId;
  const cfg = await getGuild(guildId);
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();

  // CONFIG commands
  if (group === 'config') {
    if (!(await requireAdmin(interaction))) return;
    if (sub === 'set-garden') {
      const channel = interaction.options.getChannel('channel');
      cfg.gardenChannelId = channel.id;
      await saveGuild(cfg);
      await interaction.reply({ content: `Garden channel set to ${channel}.`, ephemeral: true });
    } else if (sub === 'set-leaderboard') {
      const channel = interaction.options.getChannel('channel');
      cfg.leaderboardChannelId = channel.id;
      await saveGuild(cfg);
      await interaction.reply({ content: `Leaderboard channel set to ${channel}.`, ephemeral: true });
    } else if (sub === 'add-reward') {
      const channel = interaction.options.getChannel('channel');
      if (!cfg.rewardChannelIds.includes(channel.id)) {
        cfg.rewardChannelIds.push(channel.id);
        await saveGuild(cfg);
      }
      await interaction.reply({ content: `${channel} added to reward channels.`, ephemeral: true });
    } else if (sub === 'remove-reward') {
      const channel = interaction.options.getChannel('channel');
      cfg.rewardChannelIds = cfg.rewardChannelIds.filter((id) => id !== channel.id);
      await saveGuild(cfg);
      await interaction.reply({ content: `${channel} removed from reward channels.`, ephemeral: true });
    } else if (sub === 'list') {
      const lines = [];
      lines.push(`Garden channel: ${cfg.gardenChannelId ? `<#${cfg.gardenChannelId}>` : 'not set'}`);
      lines.push(`Leaderboard channel: ${cfg.leaderboardChannelId ? `<#${cfg.leaderboardChannelId}>` : 'not set'}`);
      lines.push(`Reward channels: ${cfg.rewardChannelIds.map((id) => `<#${id}>`).join(', ') || 'none'}`);
      lines.push(`Water cost: ${cfg.waterCost}`);
      lines.push(`Plant max water: ${cfg.plantMaxWater}`);
      lines.push(`Water decay: ${cfg.waterDecAmount} every ${cfg.waterDecIntervalMin} min`);
      lines.push(`Coins per win: ${cfg.coinsPerWin}`);
      lines.push(`XP per win: ${cfg.xpPerWin}`);
      lines.push(`Cooldown: ${cfg.cooldownSeconds}s`);
      lines.push(`Daily warning hour: ${cfg.dailyWarningHourLocal}`);
      lines.push(`Low water threshold: ${cfg.lowWaterThreshold}`);
      lines.push(`Games enabled: ${cfg.gamesEnabled}`);
      await interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }
    return;
  }
  // GARDEN commands
  if (group === 'garden') {
    if (sub === 'post') {
      if (!cfg.gardenChannelId) {
        await interaction.reply({ content: 'Garden channel is not configured. Use /duck config set-garden.', ephemeral: true });
        return;
      }
      const channel = interaction.guild.channels.cache.get(cfg.gardenChannelId);
      if (!channel) {
        await interaction.reply({ content: 'Garden channel no longer exists.', ephemeral: true });
        return;
      }
      const users = await getAllUsers(guildId);
      const embed = buildGardenEmbed(cfg, users);
      let message;
      try {
        if (cfg.gardenMessageId) {
          message = await channel.messages.fetch(cfg.gardenMessageId);
          await message.edit({ embeds: [embed] });
        } else {
          message = await channel.send({ embeds: [embed] });
          try {
            await message.pin();
          } catch (_) {}
          cfg.gardenMessageId = message.id;
          await saveGuild(cfg);
        }
        await interaction.reply({ content: 'Garden panel posted.', ephemeral: true });
      } catch (e) {
        await interaction.reply({ content: 'Failed to post garden panel. Check my permissions.', ephemeral: true });
      }
    } else if (sub === 'water') {
      const user = await getUser(guildId, interaction.user.id);
      if (user.coins < cfg.waterCost) {
        await interaction.reply({ content: `You need ${cfg.waterCost} coins to water your plant.`, ephemeral: true });
        return;
      }
      user.coins -= cfg.waterCost;
      user.waterLevel = cfg.plantMaxWater;
      await saveUser(user);
      await interaction.reply({ content: `You watered your plant for ${cfg.waterCost} coins. It is now fully hydrated!`, ephemeral: true });
      // Refresh panel if configured
      if (cfg.gardenChannelId && cfg.gardenMessageId) {
        const channel = interaction.guild.channels.cache.get(cfg.gardenChannelId);
        try {
          const message = await channel.messages.fetch(cfg.gardenMessageId);
          const users = await getAllUsers(guildId);
          const embed = buildGardenEmbed(cfg, users);
          await message.edit({ embeds: [embed] });
        } catch (_) {}
      }
    }
    return;
  }
  // COINS commands
  if (group === 'coins') {
    if (sub === 'send') {
      const recipient = interaction.options.getUser('to');
      const amount = interaction.options.getInteger('amount');
      const result = await sendCoins(guildId, interaction.user.id, recipient.id, amount);
      if (result.ok) {
        await interaction.reply({ content: `Sent ${amount} coins to ${recipient}.`, ephemeral: true });
      } else {
        await interaction.reply({ content: result.message, ephemeral: true });
      }
      // Refresh garden panel
      if (cfg.gardenChannelId && cfg.gardenMessageId) {
        const channel = interaction.guild.channels.cache.get(cfg.gardenChannelId);
        try {
          const message = await channel.messages.fetch(cfg.gardenMessageId);
          const users = await getAllUsers(guildId);
          const embed = buildGardenEmbed(cfg, users);
          await message.edit({ embeds: [embed] });
        } catch (_) {}
      }
    } else if (sub === 'daily') {
      const res = await claimDaily(cfg, guildId, interaction.user.id);
      if (res.ok) {
        await interaction.reply({ content: `You claimed your daily reward! Streak: ${res.streak}, bonus: ${res.bonus} coins/xp.`, ephemeral: true });
      } else {
        await interaction.reply({ content: res.message, ephemeral: true });
      }
    }
    return;
  }
  // PLAY commands
  if (group === 'play') {
    if (!cfg.gamesEnabled) {
      await interaction.reply({ content: 'Games are disabled by an administrator.', ephemeral: true });
      return;
    }
    await playGame(sub, interaction, cfg);
    return;
  }
  // LEADERBOARD commands
  if (group === 'leaderboard') {
    if (sub === 'post') {
      if (!cfg.leaderboardChannelId) {
        await interaction.reply({ content: 'Leaderboard channel is not configured. Use /duck config set-leaderboard.', ephemeral: true });
        return;
      }
      const channel = interaction.guild.channels.cache.get(cfg.leaderboardChannelId);
      if (!channel) {
        await interaction.reply({ content: 'Leaderboard channel no longer exists.', ephemeral: true });
        return;
      }
      const users = await getAllUsers(guildId);
      const embed = buildLeaderboardEmbed(users);
      let message;
      try {
        if (cfg.leaderboardMessageId) {
          message = await channel.messages.fetch(cfg.leaderboardMessageId);
          await message.edit({ embeds: [embed] });
        } else {
          message = await channel.send({ embeds: [embed] });
          try {
            await message.pin();
          } catch (_) {}
          cfg.leaderboardMessageId = message.id;
          await saveGuild(cfg);
        }
        await interaction.reply({ content: 'Leaderboard posted.', ephemeral: true });
      } catch (e) {
        await interaction.reply({ content: 'Failed to post leaderboard.', ephemeral: true });
      }
    }
    return;
  }
  // ABOUT command (no group)
  if (sub === 'about') {
    const lines = [];
    lines.push('Duck is your playful garden keeper. Chat, solve tiny puzzles, earn coins, and keep your plant happy.');
    lines.push('Duck never penalises roles—this garden’s about gentle, daily momentum.');
    lines.push('Configure me anywhere with `/duck config …`, then try `/duck play unscramble` to get started. Quack 🦆');
    await interaction.reply({ content: lines.join('\n'), ephemeral: true });
    return;
  }
}