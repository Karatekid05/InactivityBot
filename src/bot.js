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

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Slash command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, db);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
  }
});

// Activity tracking and role removal logic will be in a service
import { startInactivityService } from './services/inactivityService.js';
import { startLogCleanupService } from './services/logCleanupService.js';

startInactivityService(client, db);
startLogCleanupService(db);

client.login(process.env.DISCORD_TOKEN); 