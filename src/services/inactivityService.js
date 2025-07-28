import { Events } from 'discord.js';
import { getRandomPurgeMessage, getRandomPurgeGif } from '../utils/messages.js';

export function startInactivityService(client, db) {
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

  // Checagem periódica para remover cargos
  setInterval(async () => {
    const roles = db.prepare('SELECT * FROM monitored_roles').all();
    for (const guild of client.guilds.cache.values()) {
      for (const role of roles) {
        const members = await guild.members.fetch();
        for (const member of members.values()) {
          if (member.user.bot) continue;
          if (!member.roles.cache.has(role.role_id)) continue;
          const activity = db.prepare('SELECT last_activity FROM user_activity WHERE user_id = ? AND role_id = ?').get(member.id, role.role_id);
          let last = activity ? activity.last_activity : 0;
          let now = Math.floor(Date.now() / 1000);
          if (last + role.inactivity_timeout < now) {
            // Remove role
            await member.roles.remove(role.role_id, 'Inactivity');
            db.prepare('INSERT INTO removal_logs (user_id, role_id, removed_at) VALUES (?, ?, ?)')
              .run(member.id, role.role_id, now);
            
            // Send purge message to configured channel
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
                const roleName = guild.roles.cache.get(role.role_id)?.name || 'Unknown Role';
                const message = getRandomPurgeMessage(roleName);
                const gifUrl = getRandomPurgeGif();
                
                await targetChannel.send({
                  content: `${message}`,
                  embeds: [{
                    color: 0xFF0000, // Red color
                    description: `<@${member.id}> lost their **${roleName}** role due to inactivity!`,
                    image: {
                      url: gifUrl
                    },
                    timestamp: new Date().toISOString()
                  }]
                });
              }
            } catch (error) {
              console.error('Error sending purge message:', error);
            }
          }
        }
      }
    }
  }, 60 * 1000); // Checa a cada minuto
} 