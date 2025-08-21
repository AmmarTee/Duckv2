import { PermissionFlagsBits } from 'discord.js';

/**
 * Determine if a guild member is an administrator or has Manage Guild permissions.
 * @param {import('discord.js').GuildMember} member
 */
export function isAdmin(member) {
  if (!member) return false;
  const perms = member.permissions;
  return perms.has(PermissionFlagsBits.Administrator) || perms.has(PermissionFlagsBits.ManageGuild);
}

/**
 * If the interacting user is not an admin, send an error reply and return false.
 */
export async function requireAdmin(interaction) {
  const member = interaction.member;
  if (!isAdmin(member)) {
    await interaction.reply({
      content: 'You must be an administrator to use this command.',
      ephemeral: true
    });
    return false;
  }
  return true;
}