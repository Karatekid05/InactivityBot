import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('removerole')
  .setDescription('Stop monitoring a role for inactivity')
  .addRoleOption(option =>
    option.setName('role').setDescription('Role to stop monitoring').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction, db) {
  const role = interaction.options.getRole('role');
  const exists = db.prepare('SELECT 1 FROM monitored_roles WHERE role_id = ?').get(role.id);
  if (!exists) {
    return interaction.reply({ content: 'This role is not being monitored.', ephemeral: true });
  }
  db.prepare('DELETE FROM monitored_roles WHERE role_id = ?').run(role.id);
  return interaction.reply({ content: `Role ${role.name} is no longer being monitored.`, ephemeral: true });
} 