# InactivityBot

A Discord bot to automatically remove roles from inactive users, with slash commands for configuration, status, and logs.

## Features
- Monitor multiple roles, each with its own inactivity timeout
- Automatic role removal for inactive users
- Persistent storage (SQLite)
- Slash commands for setup, status, and logs
- Admin-only configuration and logs

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with your Discord bot token:
   ```env
   DISCORD_TOKEN=your-bot-token-here
   ```
3. Start the bot:
   ```bash
   npm start
   ```

## Commands
- `/setrole role:<role> time:<timeout>` — Monitor a role for inactivity (admin only)
- `/removerole role:<role>` — Stop monitoring a role (admin only)
- `/profile [user]` — Show inactivity status for yourself or another user
- `/logs` — Show role removal logs (admin only)

## License
MIT 