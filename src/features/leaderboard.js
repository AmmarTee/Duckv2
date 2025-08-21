import { EmbedBuilder } from 'discord.js';
import { renderXpBar } from '../util/render.js';

/**
 * Build a leaderboard embed showing the top 5 veterans in a guild.
 * Sorted by XP descending, then age ascending.
 * @param {Array<object>} users
 */
export function buildLeaderboardEmbed(users) {
  const now = Date.now();
  const sorted = [...users].sort((a, b) => {
    if (b.xp === a.xp) {
      return a.plantStartTs - b.plantStartTs;
    }
    return b.xp - a.xp;
  }).slice(0, 5);

  const lines = sorted.map((v, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
    const level = Math.floor(v.xp / 100) + 1;
    const xpBar = renderXpBar(v.xp % 100, 100);
    const ageMs = now - v.plantStartTs;
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000) * 10) / 10; // one decimal
    const line1 = `**${medal} <@${v.userId}>** L${level}`;
    const line2 = `\`XP [${xpBar}] ${v.xp} | AGE ${ageDays}d | 💰 ${v.coins}\``;
    return `${line1}\n${line2}`;
  });

  const embed = new EmbedBuilder()
    .setTitle('🏆 Top Veterans')
    .setDescription(lines.join('\n'))
    .setFooter({ text: 'Press the button to refresh (1/day per veteran).' });

  return embed;
}