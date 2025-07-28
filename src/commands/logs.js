import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('logs')
  .setDescription('Show role removal logs')
  .addIntegerOption(option =>
    option.setName('page')
      .setDescription('Page number (default: 1)')
      .setRequired(false)
      .setMinValue(1))
  .addIntegerOption(option =>
    option.setName('limit')
      .setDescription('Number of logs per page (default: 10, max: 25)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(25))
  .addRoleOption(option =>
    option.setName('role')
      .setDescription('Filter by role')
      .setRequired(false))
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Filter by user')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction, db) {
  const page = interaction.options.getInteger('page') || 1;
  const limit = Math.min(interaction.options.getInteger('limit') || 10, 25);
  const roleFilter = interaction.options.getRole('role');
  const userFilter = interaction.options.getUser('user');
  
  const offset = (page - 1) * limit;
  
  // Build query with filters
  let query = 'SELECT * FROM removal_logs';
  let countQuery = 'SELECT COUNT(*) as total FROM removal_logs';
  const params = [];
  
  if (roleFilter || userFilter) {
    const conditions = [];
    if (roleFilter) {
      conditions.push('role_id = ?');
      params.push(roleFilter.id);
    }
    if (userFilter) {
      conditions.push('user_id = ?');
      params.push(userFilter.id);
    }
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }
  
  query += ' ORDER BY removed_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  // Get total count for pagination
  const totalResult = db.prepare(countQuery).get(...(roleFilter || userFilter ? params.slice(0, -2) : []));
  const total = totalResult.total;
  
  // Get logs
  const logs = db.prepare(query).all(...params);
  
  if (logs.length === 0) {
    let noLogsMessage = 'No removal logs found';
    if (roleFilter || userFilter) {
      noLogsMessage += ' for the specified criteria';
    }
    noLogsMessage += '.';
    return interaction.reply({ 
      content: noLogsMessage, 
      ephemeral: true 
    });
  }
  
  // Build response
  const totalPages = Math.ceil(total / limit);
  let reply = `**Role Removal Logs** (Page ${page}/${totalPages}, Total: ${total})\n\n`;
  
  for (const log of logs) {
    const date = new Date(log.removed_at * 1000).toLocaleString();
    reply += `• <@${log.user_id}> lost <@&${log.role_id}> at ${date}\n`;
  }
  
  // Add pagination info
  if (totalPages > 1) {
    reply += `\n*Use \`/logs page:${page + 1}\` for next page*`;
  }
  
  // Check if message is too long
  if (reply.length > 1900) {
    reply = reply.substring(0, 1900) + '...\n*Message truncated due to length*';
  }
  
  return interaction.reply({ content: reply, ephemeral: true });
} 