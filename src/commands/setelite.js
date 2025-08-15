import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('setelite')
  .setDescription('Configure the Elite role and (optional) channel for celebration messages')
  .addRoleOption(option =>
    option.setName('role').setDescription('Elite role').setRequired(true))
  .addChannelOption(option =>
    option.setName('channel').setDescription('Channel to post Elite welcome messages').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction, db) {
  const role = interaction.options.getRole('role');
  const channel = interaction.options.getChannel('channel');

  db.prepare('INSERT OR REPLACE INTO bot_config (key, value) VALUES (?, ?)').run('elite_role_id', role.id);
  if (channel) {
    db.prepare('INSERT OR REPLACE INTO bot_config (key, value) VALUES (?, ?)').run('elite_channel_id', channel.id);
  }

  return interaction.reply({ content: `Elite role set to ${role} ${channel ? `and channel set to ${channel}` : ''}.`, ephemeral: true });
}
