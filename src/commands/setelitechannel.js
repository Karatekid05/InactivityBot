import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('setelitechannel')
  .setDescription('Set the channel for Elite celebration messages')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('Channel for Elite celebration messages')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction, db) {
  const channel = interaction.options.getChannel('channel');
  
  try {
    // Check if channel is a text channel
    if (channel.type !== 0) { // 0 = text channel
      return interaction.reply({ 
        content: 'Please select a text channel for Elite celebration messages.', 
        ephemeral: true 
      });
    }
    
    // Save channel ID to database
    db.prepare('INSERT OR REPLACE INTO bot_config (key, value) VALUES (?, ?)')
      .run('elite_channel_id', channel.id);
    
    await interaction.reply({ 
      content: `✅ Elite celebration messages will now be sent to <#${channel.id}>!`, 
      ephemeral: true 
    });
    
  } catch (error) {
    console.error('Error setting Elite channel:', error);
    await interaction.reply({ 
      content: 'There was an error setting the Elite celebration channel.', 
      ephemeral: true 
    });
  }
} 