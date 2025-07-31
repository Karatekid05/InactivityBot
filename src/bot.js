import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database setup
const db = new Database(path.join(__dirname, '../database/inactivity.db'));

// Ensure tables exist
const initSQL = fs.readFileSync(path.join(__dirname, '../database/init.sql'), 'utf8');
db.exec(initSQL);

// Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// Load commands dynamically
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') && file !== 'index.js');
for (const file of commandFiles) {
  try {
    const command = await import(`./commands/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
    } else {
      console.warn(`Skipping ${file}: missing data or execute function`);
    }
  } catch (error) {
    console.error(`Error loading command ${file}:`, error);
  }
}

// Global error handlers to prevent bot crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.log('Bot will continue running despite the error...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('Bot will continue running despite the error...');
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
  console.log('Bot will continue running despite the error...');
});

client.on('warn', (warning) => {
  console.warn('Discord client warning:', warning);
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log('Bot is now ready and monitoring for inactivity!');
});

// Slash command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, db);
  } catch (error) {
    console.error('Command execution error:', error);
    try {
      const reply = { content: 'There was an error executing this command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch (replyError) {
      console.error('Failed to send error reply:', replyError);
    }
  }
});

// Activity tracking and role removal logic will be in a service
import { startInactivityService } from './services/inactivityService.js';
import { startLogCleanupService } from './services/logCleanupService.js';

startInactivityService(client, db);
startLogCleanupService(db);

// Login with error handling
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Failed to login:', error);
  process.exit(1);
}); 