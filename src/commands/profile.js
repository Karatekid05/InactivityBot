import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Show inactivity status for yourself or another user')
  .addUserOption(option =>
    option.setName('user').setDescription('User to check (optional)'));

export async function execute(interaction, db) {
  const user = interaction.options.getUser('user') || interaction.user;
  // Get all monitored roles
  const roles = db.prepare('SELECT * FROM monitored_roles').all();
  if (roles.length === 0) {
    return interaction.reply({ content: 'No roles are being monitored.', ephemeral: true });
  }
  // For each role, check if user has it and show time left
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
  }
  let reply = `Inactivity status for <@${user.id}>:\n`;
  let any = false;
  for (const role of roles) {
    if (member.roles.cache.has(role.role_id)) {
      any = true;
      const activity = db.prepare('SELECT last_activity FROM user_activity WHERE user_id = ? AND role_id = ?').get(user.id, role.role_id);
      let last = activity ? activity.last_activity : 0;
      let now = Math.floor(Date.now() / 1000);
      let left = (last + role.inactivity_timeout) - now;
      if (left <= 0) {
        reply += `- <@&${role.role_id}>: **Will be removed soon**\n`;
      } else {
        let hours = Math.floor(left / 3600);
        let mins = Math.floor((left % 3600) / 60);
        if (hours > 0) {
          reply += `- <@&${role.role_id}>: ${hours}h ${mins}m left\n`;
        } else {
          reply += `- <@&${role.role_id}>: ${mins}m left\n`;
        }
      }
    }
  }
  if (!any) reply += 'User has no monitored roles.';
  return interaction.reply({ content: reply, ephemeral: true });
} 