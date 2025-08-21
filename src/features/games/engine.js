import { awardWin } from '../economy.js';
import * as unscramble from './unscramble.js';
import * as fill from './fill.js';
import * as math from './math.js';

const modes = {
  unscramble,
  fill,
  math
};

// Active game sessions keyed by guildId:userId
const activeGames = new Map();

/**
 * Initiates a game session for the given mode.  Sends the puzzle prompt and
 * waits for the user to reply with the answer.  Rewards the user on success.
 * @param {string} mode The game mode (unscramble|fill|math)
 * @param {import('discord.js').ChatInputCommandInteraction} interaction The slash command interaction
 * @param {object} cfg Guild configuration
 */
export async function playGame(mode, interaction, cfg) {
  const key = `${interaction.guildId}:${interaction.user.id}`;
  if (activeGames.has(key)) {
    await interaction.reply({ content: 'You already have an active game.  Answer it before starting a new one.', ephemeral: true });
    return;
  }
  const generator = modes[mode];
  if (!generator || typeof generator.make !== 'function') {
    await interaction.reply({ content: 'Unknown game mode.', ephemeral: true });
    return;
  }
  const puzzle = generator.make();
  activeGames.set(key, { answer: puzzle.answer.toLowerCase() });
  await interaction.reply({ content: puzzle.prompt, fetchReply: true });
  // Collect the next message from the same user in the channel
  const filter = (m) => m.author.id === interaction.user.id;
  const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
  collector.on('collect', async (message) => {
    const guess = message.content.trim().toLowerCase();
    const expected = puzzle.answer.toLowerCase();
    if (guess === expected) {
      await message.reply(`✅ Correct! You earn ${cfg.coinsPerWin} coins and ${cfg.xpPerWin} XP.`);
      await awardWin(cfg, interaction.guildId, interaction.user.id);
    } else {
      await message.reply(`❌ Wrong answer! The correct answer was **${puzzle.answer}**.`);
    }
    activeGames.delete(key);
  });
  collector.on('end', async (_, reason) => {
    if (reason === 'time' && activeGames.has(key)) {
      await interaction.followUp({ content: `⏱️ Time's up! The correct answer was **${puzzle.answer}**.`, ephemeral: true });
      activeGames.delete(key);
    }
  });
}