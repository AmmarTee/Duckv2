import { token } from './config.js';
import { createClient } from './client.js';
import { data as commandData, handle as handleCommand } from './interactions/commands.js';
import { handleComponent } from './interactions/components.js';
import startDegradeJob from './jobs/degrade.js';
import startDailyWarningJob from './jobs/dailyWarning.js';
import startPanelKeepaliveJob from './jobs/panelKeepalive.js';
import { getGuild } from './storage/repo.js';
import { rewardActivity } from './features/economy.js';
import logger from './logging.js';

const client = createClient();

client.on('ready', () => {
  logger.info('Duck Bot is online', { user: client.user.tag });
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'duck') {
      await handleCommand(interaction);
    } else if (interaction.isButton()) {
      await handleComponent(interaction);
    }
  } catch (e) {
    logger.error('Error handling interaction', { error: e.message });
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'An error occurred while processing your request.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
      }
    } catch (_) {}
  }
});

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot || !message.guild) return;
    const cfg = await getGuild(message.guild.id);
    if (!cfg.rewardChannelIds.includes(message.channel.id)) return;
    await rewardActivity(cfg, message.guild.id, message.author.id);
  } catch (e) {
    logger.error('Error handling messageCreate', { error: e.message });
  }
});

// Start background jobs
startDegradeJob(client);
startDailyWarningJob(client);
startPanelKeepaliveJob(client);

// Login
client.login(token).catch((e) => {
  logger.error('Failed to login', { error: e.message });
});