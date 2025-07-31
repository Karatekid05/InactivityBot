import { Events, AttachmentBuilder } from 'discord.js';
import { getRandomEliteMessageAndGif } from '../utils/eliteMessages.js';
import { join } from 'path';

// Role IDs
const ELITE_ROLE_ID = '1400429497572135112';
const PURGED_ROLE_ID = '1400429594024214710';

// Probabilities
const ELITE_CHANCE = 1/500;      // 0.2% - Anyone can get Elite
const PURGED_CHANCE = 1/250;     // 0.4% - Purged users have higher chance

// Timeout in seconds (72 hours)
const INACTIVITY_TIMEOUT = 72 * 60 * 60;

export function startGamificationService(client, db) {
  console.log('Starting gamification service...');

  // Ensure tables exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS gamification_activity (
      user_id TEXT PRIMARY KEY,
      last_message_time INTEGER,
      has_elite_role INTEGER DEFAULT 0,
      has_purged_role INTEGER DEFAULT 0
    )
  `).run();

  // Monitor all messages for role assignment
  client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot) return;
    
    try {
      const userId = message.author.id;
      const now = Math.floor(Date.now() / 1000);
      
      // Get or create user activity record
      let userActivity = db.prepare('SELECT * FROM gamification_activity WHERE user_id = ?').get(userId);
      
      if (!userActivity) {
        // New user - check current roles
        const member = message.member;
        const hasEliteRole = member.roles.cache.has(ELITE_ROLE_ID);
        const hasPurgedRole = member.roles.cache.has(PURGED_ROLE_ID);
        
        db.prepare(`
          INSERT INTO gamification_activity (user_id, last_message_time, has_elite_role, has_purged_role) 
          VALUES (?, ?, ?, ?)
        `).run(userId, now, hasEliteRole ? 1 : 0, hasPurgedRole ? 1 : 0);
        
        userActivity = {
          user_id: userId,
          last_message_time: now,
          has_elite_role: hasEliteRole ? 1 : 0,
          has_purged_role: hasPurgedRole ? 1 : 0
        };
      } else {
        // Update last message time
        db.prepare('UPDATE gamification_activity SET last_message_time = ? WHERE user_id = ?').run(now, userId);
      }

      // Determine chance based on current roles
      let chance = ELITE_CHANCE; // Default chance for anyone
      
      if (userActivity.has_purged_role === 1) {
        chance = PURGED_CHANCE; // Higher chance for purged users
      }
      
      // Check if user should get Elite role
      if (Math.random() < chance) {
        await assignEliteRole(message.member, db, message.channel);
      }
      
    } catch (error) {
      console.error('Error in gamification message handler:', error.message);
    }
  });

  // Periodic check for inactivity (every 10 minutes)
  setInterval(async () => {
    try {
      const now = Math.floor(Date.now() / 1000);
      const cutoffTime = now - INACTIVITY_TIMEOUT;
      
      // Get users who have been inactive for 72 hours and have Elite role
      const inactiveUsers = db.prepare(`
        SELECT user_id FROM gamification_activity 
        WHERE has_elite_role = 1 AND last_message_time < ?
      `).all(cutoffTime);
      
      console.log(`Checking ${inactiveUsers.length} Elite users for inactivity...`);
      
      for (const userData of inactiveUsers) {
        try {
          // Fetch member
          const guild = client.guilds.cache.first(); // Assuming single guild
          if (!guild) continue;
          
          const member = await guild.members.fetch(userData.user_id).catch(() => null);
          if (!member) {
            // User left server, clean up
            db.prepare('DELETE FROM gamification_activity WHERE user_id = ?').run(userData.user_id);
            continue;
          }
          
          // Remove Elite role and add Purged role
          await member.roles.remove(ELITE_ROLE_ID, 'Inactivity - 72h without messages');
          await member.roles.add(PURGED_ROLE_ID, 'Inactivity - 72h without messages');
          
          // Update database
          db.prepare(`
            UPDATE gamification_activity 
            SET has_elite_role = 0, has_purged_role = 1 
            WHERE user_id = ?
          `).run(userData.user_id);
          
          console.log(`User ${member.user.tag} became inactive and received Purged role`);
          
        } catch (error) {
          console.error(`Error processing inactive user ${userData.user_id}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('Error in gamification inactivity check:', error.message);
    }
  }, 10 * 60 * 1000); // Every 10 minutes

  // Handler for role changes (manual role assignments/removals)
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
      const userId = newMember.id;
      
      // Check if Elite role was added/removed
      const hadEliteRole = oldMember.roles.cache.has(ELITE_ROLE_ID);
      const hasEliteRole = newMember.roles.cache.has(ELITE_ROLE_ID);
      
      // Check if Purged role was added/removed
      const hadPurgedRole = oldMember.roles.cache.has(PURGED_ROLE_ID);
      const hasPurgedRole = newMember.roles.cache.has(PURGED_ROLE_ID);
      
      if (hadEliteRole !== hasEliteRole || hadPurgedRole !== hasPurgedRole) {
        // Update database to reflect role changes
        const existing = db.prepare('SELECT 1 FROM gamification_activity WHERE user_id = ?').get(userId);
        
        if (existing) {
          db.prepare(`
            UPDATE gamification_activity 
            SET has_elite_role = ?, has_purged_role = ? 
            WHERE user_id = ?
          `).run(hasEliteRole ? 1 : 0, hasPurgedRole ? 1 : 0, userId);
        } else {
          const now = Math.floor(Date.now() / 1000);
          db.prepare(`
            INSERT INTO gamification_activity (user_id, last_message_time, has_elite_role, has_purged_role) 
            VALUES (?, ?, ?, ?)
          `).run(userId, now, hasEliteRole ? 1 : 0, hasPurgedRole ? 1 : 0);
        }
        
        console.log(`Updated role status for user ${newMember.user.tag}: Elite=${hasEliteRole}, Purged=${hasPurgedRole}`);
      }
      
    } catch (error) {
      console.error('Error handling role update:', error.message);
    }
  });

  console.log('Gamification service started successfully!');
}

async function assignEliteRole(member, db, channel) {
  try {
    // Check if user already has Elite role
    if (member.roles.cache.has(ELITE_ROLE_ID)) {
      return; // Already has the role
    }
    
    // Add Elite role
    await member.roles.add(ELITE_ROLE_ID, 'Random chance from message');
    
    // Remove Purged role if they had it
    if (member.roles.cache.has(PURGED_ROLE_ID)) {
      await member.roles.remove(PURGED_ROLE_ID, 'Promoted back to Elite');
    }
    
    // Update database
    db.prepare(`
      UPDATE gamification_activity 
      SET has_elite_role = 1, has_purged_role = 0 
      WHERE user_id = ?
    `).run(member.id);
    
    console.log(`🎉 User ${member.user.tag} won the Elite role through random chance!`);
    
    // Send celebration message in the same channel where they sent the message
    await sendEliteCelebrationMessage(member, channel, db);
    
  } catch (error) {
    console.error(`Error assigning Elite role to ${member.user.tag}:`, error.message);
  }
}

async function sendEliteCelebrationMessage(member, channel, db) {
  try {
    const { message, gif } = getRandomEliteMessageAndGif();
    
    console.log(`Elite celebration message: ${message}`);
    console.log(`Elite celebration GIF: ${gif}`);
    
    // Create attachment from local GIF file
    const gifPath = join(process.cwd(), gif);
    
    try {
      const attachment = new AttachmentBuilder(gifPath, { name: 'elite-celebration.gif' });
      
      await channel.send({
        content: `${message}`,
        embeds: [{
          color: 0xFFD700, // Gold color for Elite
          description: `🎊 **Congratulations <@${member.id}>!** You've achieved **ELITE** status! 🎊`,
          image: {
            url: 'attachment://elite-celebration.gif'
          },
          footer: {
            text: 'Elite Gamification System'
          },
          timestamp: new Date().toISOString()
        }],
        files: [attachment]
      });
    } catch (gifError) {
      console.error(`Failed to send Elite celebration GIF ${gifPath}:`, gifError.message);
      // Fallback: send message without GIF
      await channel.send({
        content: `${message}`,
        embeds: [{
          color: 0xFFD700,
          description: `🎊 **Congratulations <@${member.id}>!** You've achieved **ELITE** status! 🎊`,
          footer: {
            text: 'Elite Gamification System'
          },
          timestamp: new Date().toISOString()
        }]
      });
    }
  } catch (error) {
    console.error('Error sending Elite celebration message:', error.message);
  }
} 