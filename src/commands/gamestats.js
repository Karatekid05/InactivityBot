import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('gamestats')
  .setDescription('Show gamification system statistics');

export async function execute(interaction, db) {
  try {
    // Get statistics from database
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM gamification_activity').get();
    const eliteUsers = db.prepare('SELECT COUNT(*) as count FROM gamification_activity WHERE has_elite_role = 1').get();
    const purgedUsers = db.prepare('SELECT COUNT(*) as count FROM gamification_activity WHERE has_purged_role = 1').get();
    
    // Get recent activity (last 24 hours)
    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - (24 * 60 * 60);
    const recentActivity = db.prepare('SELECT COUNT(*) as count FROM gamification_activity WHERE last_message_time > ?').get(dayAgo);
    
    // Get users who will become purged soon (in next 12 hours)
    const becomingPurged = db.prepare(`
      SELECT COUNT(*) as count FROM gamification_activity 
      WHERE has_elite_role = 1 AND last_message_time < ?
    `).get(now - (60 * 60 * 60)); // 60 hours ago (12 hours before 72h timeout)
    
    const embed = {
      color: 0x00ff00,
      title: '🎮 Elite Gamification System Statistics',
      fields: [
        {
          name: '📊 Total Users Tracked',
          value: `${totalUsers.count}`,
          inline: true
        },
        {
          name: '👑 Elite Users',
          value: `${eliteUsers.count}`,
          inline: true
        },
        {
          name: '💀 Purged Users',
          value: `${purgedUsers.count}`,
          inline: true
        },
        {
          name: '💬 Active in Last 24h',
          value: `${recentActivity.count}`,
          inline: true
        },
        {
          name: '⚠️ Becoming Purged Soon',
          value: `${becomingPurged.count}`,
          inline: true
        },
        {
          name: '🎲 Chances',
          value: 'Anyone: 1/500 (0.2%)\nPurged: 1/250 (0.4%)',
          inline: true
        }
      ],
      footer: {
        text: 'System monitors all messages and assigns Elite role randomly'
      },
      timestamp: new Date().toISOString()
    };
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
    
  } catch (error) {
    console.error('Error in gamestats command:', error);
    await interaction.reply({ 
      content: 'There was an error fetching gamification statistics.', 
      ephemeral: true 
    });
  }
} 