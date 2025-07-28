import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription('Set the channel where purge messages will be sent')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('Channel for purge messages')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction, db) {
  const channel = interaction.options.getChannel('channel');
  
  // Store channel ID in database
  db.prepare('INSERT OR REPLACE INTO bot_config (key, value) VALUES (?, ?)')
    .run('purge_channel_id', channel.id);
  
  return interaction.reply({ 
    content: `Purge messages will now be sent to ${channel}!`, 
    ephemeral: true 
  });
} 