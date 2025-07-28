import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { parseDuration } from '../utils/time.js';

export const data = new SlashCommandBuilder()
  .setName('setrole')
  .setDescription('Monitor a role for inactivity')
  .addRoleOption(option =>
    option.setName('role').setDescription('Role to monitor').setRequired(true))
  .addStringOption(option =>
    option.setName('time').setDescription('Inactivity timeout (e.g. 30m, 2h, 1d, 1d12h30m)').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction, db) {
  const role = interaction.options.getRole('role');
  const timeStr = interaction.options.getString('time');
  const timeout = parseDuration(timeStr);
  if (!timeout) {
    return interaction.reply({ content: 'Invalid time format. Use e.g. 30m, 2h, 1d, 1d12h30m.', ephemeral: true });
  }
  // Check if already monitored
  const exists = db.prepare('SELECT 1 FROM monitored_roles WHERE role_id = ?').get(role.id);
  if (exists) {
    db.prepare('UPDATE monitored_roles SET inactivity_timeout = ? WHERE role_id = ?').run(timeout, role.id);
    return interaction.reply({ content: `Role ${role.name} updated with new timeout (${timeStr}).`, ephemeral: true });
  } else {
    db.prepare('INSERT INTO monitored_roles (role_id, inactivity_timeout) VALUES (?, ?)').run(role.id, timeout);
    return interaction.reply({ content: `Role ${role.name} is now being monitored for inactivity (${timeStr}).`, ephemeral: true });
  }
} 