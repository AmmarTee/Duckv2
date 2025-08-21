import { awardWin } from '../economy.js';
import * as unscramble from './unscramble.js';
import * as fill from './fill.js';
import * as math from './math.js';

const modes = { unscramble, fill, math };

// Active loop per channel (prevents overlap and lets us stop)
const loops = new Map(); // channelId -> { running: true }

function pickRandomMode() {
  const keys = Object.keys(modes);
  return keys[Math.floor(Math.random() * keys.length)];
}

function nextDelayMs(cfg) {
  const min = Math.max(1, Number(cfg.gameDelayMinSec || 10));
  const max = Math.max(min, Number(cfg.gameDelayMaxSec || 30));
  const sec = Math.floor(Math.random() * (max - min + 1)) + min;
  return sec * 1000;
}

/**
 * Start or continue a game loop in the channel. It posts a game, accepts answers
 * ONLY via replies to the game message, finishes (win/timeout), then schedules
 * another random game if cfg.gamesAutoChain is true and the loop is still running.
 */
export async function startGameLoop(mode, interaction, cfg) {
  const channel = interaction.channel;
  const channelId = channel.id;

  // If already running, just acknowledge
  if (loops.get(channelId)?.running) {
    await interaction.reply({ content: 'A game loop is already running in this channel.', ephemeral: true });
    return;
  }

  // Mark loop running
  loops.set(channelId, { running: true });

  // Acknowledge starter (ephemeral)
  await interaction.reply({ content: `Starting games here. First mode: **${mode}**. Reply to the game message with your answer.`, ephemeral: true });

  // Kick off the first round with requested mode
  runOneRound(mode, interaction, cfg).catch(() => {});
}

export async function stopGameLoop(channelId) {
  const loop = loops.get(channelId);
  if (!loop) return false;
  loop.running = false;
  loops.delete(channelId);
  return true;
}

async function runOneRound(initialMode, interaction, cfg) {
  const channel = interaction.channel;
  const channelId = channel.id;
  const guildId = interaction.guildId;
  const client = interaction.client;

  const loop = loops.get(channelId);
  if (!loop?.running) return;

  // Choose mode (first round uses starter’s pick; subsequent rounds random)
  let mode = initialMode;
  if (!modes[mode]) mode = pickRandomMode();

  // Build puzzle
  const puzzle = modes[mode].make(); // { type, prompt, answer }
  const gameMsg = await channel.send({
    content: `🎮 **${mode.toUpperCase()}** — Reply to **this message** with your answer.\n${puzzle.prompt}`
  });

  // Collector: ONLY accept replies to this game message
  const filter = (m) => {
    if (m.author.bot) return false;
    if (m.channelId !== channelId) return false;
    const refId = m.reference?.messageId;
    if (!refId) return false;
    if (refId !== gameMsg.id) return false;
    return true;
  };

  const collector = channel.createMessageCollector({ filter, time: 30_000 });

  let solved = false;
  collector.on('collect', async (m) => {
    // Check correctness (case-insensitive trim)
    const guess = String(m.content || '').trim().toLowerCase();
    const answer = String(puzzle.answer || '').trim().toLowerCase();
    if (guess === answer) {
      solved = true;
      collector.stop('solved');
      await awardWin(cfg, guildId, m.author.id); // coins/xp per win
      await channel.send(`✅ Correct by ${m.author}! (+${cfg.coinsPerWin} coins / +${cfg.xpPerWin} XP)`);
    } else {
      // ignore wrong replies; collector stays open
    }
  });

  collector.on('end', async (_, reason) => {
    if (!solved) {
      await channel.send(`⏱️ Time’s up. Correct answer: **${puzzle.answer}**`);
    }

    // Chain next round if enabled and loop still running
    const still = loops.get(channelId)?.running;
    if (cfg.gamesAutoChain && still && cfg.gamesEnabled) {
      setTimeout(() => {
        // next rounds are random
        runOneRound(pickRandomMode(), interaction, cfg).catch(() => {});
      }, nextDelayMs(cfg));
    } else {
      // mark loop stopped (no more chaining)
      loops.delete(channelId);
    }
  });
}
