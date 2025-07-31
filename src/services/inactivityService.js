import { Events, AttachmentBuilder } from 'discord.js';
import { getRandomPurgeMessageAndGif } from '../utils/messages.js';
import { readFileSync } from 'fs';
import { join } from 'path';

export function startInactivityService(client, db) {
  // Função para sincronizar o banco de dados com usuários que têm roles monitorados
  async function syncDatabaseWithRoles() {
    console.log('Starting database sync with monitored roles...');
    
    try {
      const roles = db.prepare('SELECT * FROM monitored_roles').all();
      
      for (const guild of client.guilds.cache.values()) {
        try {
          console.log(`Syncing guild: ${guild.name}`);
          
          for (const role of roles) {
            const guildRole = guild.roles.cache.get(role.role_id);
            if (!guildRole) continue;
            
            console.log(`Syncing role: ${guildRole.name} in ${guild.name}`);
            
            // Get role members (this is more efficient than fetching all guild members)
            const roleMembers = guildRole.members;
            const now = Math.floor(Date.now() / 1000);
            
            for (const member of roleMembers.values()) {
              if (member.user.bot) continue;
              
              // Check if user already has activity record
              const existing = db.prepare('SELECT 1 FROM user_activity WHERE user_id = ? AND role_id = ?').get(member.id, role.role_id);
              
              if (!existing) {
                // Add new user to activity tracking
                db.prepare('INSERT INTO user_activity (user_id, role_id, last_activity) VALUES (?, ?, ?)')
                  .run(member.id, role.role_id, now);
                console.log(`Added user ${member.user.tag} to activity tracking for role ${guildRole.name}`);
              }
            }
          }
        } catch (guildError) {
          console.error(`Error syncing guild ${guild.name}:`, guildError.message);
        }
      }
      
      console.log('Database sync completed!');
    } catch (error) {
      console.error('Error during database sync:', error);
    }
  }

  // Atualiza atividade ao enviar mensagem
  client.on(Events.MessageCreate, message => {
    if (!message.guild || message.author.bot) return;
    const member = message.member;
    if (!member) return;
    // Para cada role monitorado que o membro tem, atualiza atividade
    const roles = db.prepare('SELECT role_id FROM monitored_roles').all();
    const now = Math.floor(Date.now() / 1000);
    for (const role of roles) {
      if (member.roles.cache.has(role.role_id)) {
        db.prepare('INSERT OR REPLACE INTO user_activity (user_id, role_id, last_activity) VALUES (?, ?, ?)')
          .run(member.id, role.role_id, now);
      }
    }
  });

  // Handler para quando usuários recebem roles monitorados
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
      const roles = db.prepare('SELECT * FROM monitored_roles').all();
      const now = Math.floor(Date.now() / 1000);
      
      for (const role of roles) {
        // Check if user gained a monitored role
        if (!oldMember.roles.cache.has(role.role_id) && newMember.roles.cache.has(role.role_id)) {
          console.log(`User ${newMember.user.tag} gained monitored role ${role.role_id}`);
          
          // Add user to activity tracking
          db.prepare('INSERT OR REPLACE INTO user_activity (user_id, role_id, last_activity) VALUES (?, ?, ?)')
            .run(newMember.id, role.role_id, now);
        }
        
        // Check if user lost a monitored role
        if (oldMember.roles.cache.has(role.role_id) && !newMember.roles.cache.has(role.role_id)) {
          console.log(`User ${newMember.user.tag} lost monitored role ${role.role_id}`);
          
          // Remove user from activity tracking
          db.prepare('DELETE FROM user_activity WHERE user_id = ? AND role_id = ?').run(newMember.id, role.role_id);
        }
      }
    } catch (error) {
      console.error('Error handling member role update:', error);
    }
  });

  // Checagem periódica para remover cargos - OTIMIZADA para servidores grandes
  setInterval(async () => {
    try {
      const roles = db.prepare('SELECT * FROM monitored_roles').all();
      
      for (const guild of client.guilds.cache.values()) {
        try {
          for (const role of roles) {
            try {
              // Check if role exists in this guild
              const guildRole = guild.roles.cache.get(role.role_id);
              if (!guildRole) {
                console.log(`Role ${role.role_id} not found in guild ${guild.name}, skipping`);
                continue;
              }

              // ESTRATÉGIA OTIMIZADA: Buscar apenas usuários que têm o role específico
              // Isso é muito mais eficiente que buscar todos os 50k membros
              const usersWithRole = db.prepare('SELECT user_id FROM user_activity WHERE role_id = ?').all(role.role_id);
              
              console.log(`Checking ${usersWithRole.length} users with role ${guildRole.name} in guild ${guild.name}`);

              for (const userData of usersWithRole) {
                try {
                  // Fetch individual member instead of all members
                  const member = await guild.members.fetch(userData.user_id).catch(() => null);
                  
                  if (!member) {
                    // User left the server, clean up database
                    db.prepare('DELETE FROM user_activity WHERE user_id = ? AND role_id = ?').run(userData.user_id, role.role_id);
                    console.log(`Cleaned up user ${userData.user_id} who left the server`);
                    continue;
                  }

                  if (member.user.bot) continue;
                  
                  // Double check if user still has the role
                  if (!member.roles.cache.has(role.role_id)) {
                    // User lost the role through other means, clean up database
                    db.prepare('DELETE FROM user_activity WHERE user_id = ? AND role_id = ?').run(userData.user_id, role.role_id);
                    console.log(`Cleaned up user ${member.user.tag} who no longer has role ${guildRole.name}`);
                    continue;
                  }

                  const activity = db.prepare('SELECT last_activity FROM user_activity WHERE user_id = ? AND role_id = ?').get(member.id, role.role_id);
                  let last = activity ? activity.last_activity : 0;
                  let now = Math.floor(Date.now() / 1000);
                  
                  if (last + role.inactivity_timeout < now) {
                    // Remove role
                    try {
                      await member.roles.remove(role.role_id, 'Inactivity');
                      db.prepare('INSERT INTO removal_logs (user_id, role_id, removed_at) VALUES (?, ?, ?)')
                        .run(member.id, role.role_id, now);
                      
                      // Clean up user_activity entry
                      db.prepare('DELETE FROM user_activity WHERE user_id = ? AND role_id = ?').run(member.id, role.role_id);
                      
                      console.log(`Removed role ${guildRole.name} from user ${member.user.tag} due to inactivity`);
                      
                      // Send purge message to configured channel
                      await sendPurgeMessage(guild, member, guildRole, db);
                    } catch (roleRemoveError) {
                      console.error(`Failed to remove role ${guildRole.name} from user ${member.user.tag}:`, roleRemoveError.message);
                    }
                  }
                } catch (memberError) {
                  console.error(`Error processing user ${userData.user_id} in guild ${guild.name}:`, memberError.message);
                }
              }
            } catch (roleError) {
              console.error(`Error processing role ${role.role_id} in guild ${guild.name}:`, roleError.message);
            }
          }
        } catch (guildError) {
          console.error(`Error processing guild ${guild.name} (${guild.id}):`, guildError.message);
        }
      }
    } catch (intervalError) {
      console.error('Critical error in inactivity service interval:', intervalError);
      // Don't let the error crash the entire service
    }
  }, 60 * 1000); // Checa a cada minuto

  // Run initial sync after a short delay to ensure client is ready
  setTimeout(() => {
    syncDatabaseWithRoles();
  }, 5000);
}

// Separate function for sending purge messages
async function sendPurgeMessage(guild, member, role, db) {
  try {
    // Get configured channel or fallback to general
    const config = db.prepare('SELECT value FROM bot_config WHERE key = ?').get('purge_channel_id');
    let targetChannel = null;
    
    if (config) {
      targetChannel = guild.channels.cache.get(config.value);
    }
    
    // Fallback to general channel if no config or channel not found
    if (!targetChannel) {
      targetChannel = guild.channels.cache.find(channel => 
        channel.name === 'general' && channel.type === 0 // 0 = text channel
      );
    }
    
    if (targetChannel) {
      const roleName = role.name || 'Unknown Role';
      const { message, gif } = getRandomPurgeMessageAndGif(roleName);
      
      console.log(`Role name: ${roleName}`);
      console.log(`Message: ${message}`);
      console.log(`GIF URL: ${gif}`);
      console.log(`Sending purge message with GIF: ${gif}`);
      
      // Create attachment from local GIF file
      const gifPath = join(process.cwd(), gif);
      console.log(`GIF Path: ${gifPath}`);
      
      try {
        const attachment = new AttachmentBuilder(gifPath, { name: 'purge.gif' });
        
        await targetChannel.send({
          content: `${message}`,
          embeds: [{
            color: 0xFF0000, // Red color
            description: `<@${member.id}> lost their **${roleName}** role due to inactivity!`,
            image: {
              url: 'attachment://purge.gif'
            },
            timestamp: new Date().toISOString()
          }],
          files: [attachment]
        });
      } catch (gifError) {
        console.error(`Failed to send GIF ${gifPath}:`, gifError.message);
        // Fallback: send message without GIF
        await targetChannel.send({
          content: `${message}`,
          embeds: [{
            color: 0xFF0000,
            description: `<@${member.id}> lost their **${roleName}** role due to inactivity!`,
            timestamp: new Date().toISOString()
          }]
        });
      }
    }
  } catch (error) {
    console.error('Error sending purge message:', error.message);
  }
} 