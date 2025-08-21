import { EmbedBuilder } from 'discord.js';
import { formatDuration, plantEmoji } from '../util/render.js';

/**
 * Build the garden embed showing all veterans for a guild.
 * Users are sorted by time until dry ascending and XP descending.
 * @param {object} config Guild configuration
 * @param {Array<object>} users Array of veterans for this guild
 */
export function buildGardenEmbed(config, users) {
  const rows = users
    .map((v) => {
      const minutesLeft = config.waterDecAmount > 0
        ? (v.waterLevel / config.waterDecAmount) * config.waterDecIntervalMin
        : Infinity;
      return {
        userId: v.userId,
        xp: v.xp,
        coins: v.coins,
        minutesLeft,
        emoji: plantEmoji(v.waterLevel, config.plantMaxWater, config.lowWaterThreshold)
      };
    })
    .sort((a, b) => {
      if (a.minutesLeft === b.minutesLeft) {
        return b.xp - a.xp;
      }
      return a.minutesLeft - b.minutesLeft;
    });

  const lines = rows.map((row, idx) => {
    const rank = String(idx + 1).padStart(2, '0');
    const line1 = `**${rank}. ${row.emoji} <@${row.userId}>**`;
    const time = formatDuration(row.minutesLeft);
    const line2 = `\`TIME LEFT ${time} | 💰 ${row.coins}\``;
    return `${line1}\n${line2}`;
  });

  const embed = new EmbedBuilder()
    .setTitle('🌿 Veteran Garden')
    .setDescription(lines.join('\n'))
    .setFooter({ text: 'Buttons: 💧 Water • 💸 Send • 📅 Daily' });

  return embed;
}