import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('logstats')
  .setDescription('Show statistics about role removal logs')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction, db) {
  try {
    // Get total logs count
    const totalLogs = db.prepare('SELECT COUNT(*) as count FROM removal_logs').get().count;
    
    // Get most active roles (top 5)
    const topRoles = db.prepare(`
      SELECT role_id, COUNT(*) as count 
      FROM removal_logs 
      GROUP BY role_id 
      ORDER BY count DESC 
      LIMIT 5
    `).all();
    
    // Get most active users (top 5)
    const topUsers = db.prepare(`
      SELECT user_id, COUNT(*) as count 
      FROM removal_logs 
      GROUP BY user_id 
      ORDER BY count DESC 
      LIMIT 5
    `).all();
    
    // Get recent activity (last 24 hours)
    const last24h = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
    const recentLogs = db.prepare('SELECT COUNT(*) as count FROM removal_logs WHERE removed_at > ?').get(last24h).count;
    
    let reply = `**📊 Log Statistics**\n\n`;
    reply += `**Total Logs:** ${totalLogs}\n`;
    reply += `**Last 24h:** ${recentLogs} removals\n\n`;
    
    if (topRoles.length > 0) {
      reply += `**🔴 Most Removed Roles:**\n`;
      for (const role of topRoles) {
        reply += `• <@&${role.role_id}>: ${role.count} removals\n`;
      }
      reply += `\n`;
    }
    
    if (topUsers.length > 0) {
      reply += `**👤 Most Inactive Users:**\n`;
      for (const user of topUsers) {
        reply += `• <@${user.user_id}>: ${user.count} role losses\n`;
      }
    }
    
    reply += `\n*Use \`/logs\` to view detailed logs with filtering options.*`;
    
    return interaction.reply({ content: reply, ephemeral: true });
    
  } catch (error) {
    console.error('Error getting log stats:', error);
    return interaction.reply({ 
      content: 'Error retrieving log statistics.', 
      ephemeral: true 
    });
  }
} 