# MASTERS Telegram Bot - Quick Setup Guide

## Prerequisites

- Node.js installed
- Telegram account
- 5 minutes of your time

## Step-by-Step Setup

### 1. Create Your Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send: `/newbot`
3. Choose a name for your bot (e.g., "MASTERS Events")
4. Choose a username (must end in 'bot', e.g., "masters_events_bot")
5. **Copy the bot token** - it looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Get Your Telegram User ID

1. Search for **@userinfobot** on Telegram
2. Start a chat - it will immediately send you your user ID
3. **Copy your ID** - it's a number like: `123456789`

### 3. Configure the Server

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` file and replace with your values:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   PORT=3000
   ADMIN_IDS=123456789
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Server

```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════╗
║   MASTERS Backend Server Running     ║
╠═══════════════════════════════════════╣
║  Port: 3000                           ║
║  API: http://localhost:3000/api      ║
║  Bot: Active ✅                       ║
╚═══════════════════════════════════════╝
```

### 6. Test Your Bot

1. Open Telegram and search for your bot username
2. Start a chat and send: `/start`
3. You should receive a welcome message with commands

### 7. Add Your First Event

1. Send `/addevent` to your bot
2. Reply with:
   ```
   TITLE: TECHNO NIGHT
   DATE: 2025-12-28 22:00
   DESCRIPTION: Underground beats with DJ NEXUS
   ```
3. Bot will confirm the event was added

### 8. View Events on Website

1. Open the website: `http://localhost:8000`
2. Click the MASTERS logo
3. Watch the Matrix animation reveal your event!

## Common Issues

### Bot not responding?

- Double-check your bot token in `.env`
- Make sure there are no extra spaces
- Restart the server after changing `.env`

### "You need admin access" message?

- Verify your user ID is correct in `.env`
- Make sure it's just the number, no quotes
- Restart the server

### Events not showing on website?

- Ensure backend server is running
- Check that frontend is using `http://localhost:3000/api/events`
- Open browser console (F12) to see any errors

## Bot Commands Reference

| Command | Description |
|---------|-------------|
| `/start` | Show welcome message |
| `/addevent` | Add a new event |
| `/listevents` | View all events |
| `/deleteevent` | Remove an event |
| `/clearevents` | Delete all events |
| `/help` | Show help |

## Event Format

When adding events, use this exact format:

```
TITLE: Your Event Name
DATE: YYYY-MM-DD HH:MM
DESCRIPTION: Event details here
```

**Example:**
```
TITLE: NEW YEAR'S EVE PARTY
DATE: 2025-12-31 23:00
DESCRIPTION: Ring in 2026 with the biggest party of the year!
```

## Next Steps

- Add multiple events to test
- Customize the website colors in `style.css`
- Deploy to production (see main README)
- Share your bot with team members (add their IDs to `ADMIN_IDS`)

## Need Help?

Check the main `README.md` for more detailed information and troubleshooting tips.
