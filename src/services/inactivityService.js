import { Events } from 'discord.js';

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
          }
        }
      }
    }
  }, 60 * 1000); // Checa a cada minuto
} 