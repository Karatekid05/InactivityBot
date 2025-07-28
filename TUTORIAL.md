# InactivityBot - Quick Guide

## What it does
Automatically removes Discord roles from users who don't send messages for a set time.

## Commands

### `/setrole role:@Role time:24h`
- Start monitoring a role
- Examples: `30m`, `2h`, `1d`, `1d12h`
- Admin only

### `/removerole role:@Role`
- Stop monitoring a role
- Admin only

### `/profile [user]`
- Check how much time is left before role removal
- Shows status for yourself or another user

### `/logs`
- View recent role removals
- Admin only

### `/logstats`
- See statistics about role removals
- Admin only

## Example
```
/setrole role:@VIP time:2h      # Remove VIP after 2 hours of no messages
/profile @username              # Check user's status
/logs                           # See recent removals
```

**The bot works automatically - just set up roles and it handles the rest!** 