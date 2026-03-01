# MASTERS Nightclub Website

A premium nightclub website with Matrix-style event messaging system, managed via Telegram bot.

## Features

- 🎨 **Matrix-Style UI**: Cyberpunk aesthetic with neon effects and cascading characters
- 🎵 **Event Display**: Click the MASTERS logo to reveal upcoming events
- 🤖 **Telegram Bot**: Manage events directly from Telegram
- 📱 **Responsive Design**: Works on desktop and mobile
- ✨ **Premium Animations**: Smooth transitions and effects

## Quick Start

### 1. Frontend Setup

```bash
cd nightclub-website
npm run dev
```

Open your browser to `http://localhost:8000`

### 2. Backend Setup (for Telegram integration)

```bash
cd server
npm install
```

Create `.env` file from template:
```bash
cp .env.example .env
```

Edit `.env` and add your Telegram bot token:
```
TELEGRAM_BOT_TOKEN=your_token_here
ADMIN_IDS=your_telegram_user_id
```

Start the server:
```bash
npm start
```

## Telegram Bot Setup

### Step 1: Create Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow instructions to name your bot
4. Copy the bot token provided
5. Paste token into `server/.env` file

### Step 2: Get Your User ID

1. Search for `@userinfobot` on Telegram
2. Start a chat - it will send you your user ID
3. Add your ID to `ADMIN_IDS` in `.env` file

### Step 3: Start Using

1. Search for your bot on Telegram
2. Send `/start` to see available commands

## Telegram Bot Commands

- `/start` - Welcome message and command list
- `/addevent` - Add a new event
- `/listevents` - View all scheduled events
- `/deleteevent` - Remove an event
- `/clearevents` - Delete all events
- `/help` - Show help message

### Adding an Event

1. Send `/addevent` to your bot
2. Reply with event details in this format:

```
TITLE: TECHNO NIGHT
DATE: 2025-12-28 22:00
DESCRIPTION: Underground beats with DJ NEXUS. Doors open at 22:00.
```

The event will immediately appear on the website!

## Project Structure

```
nightclub-website/
├── index.html          # Main HTML file
├── style.css           # Matrix-style CSS
├── main.js             # Frontend JavaScript
├── logo.jpg            # MASTERS logo
├── package.json        # Frontend config
├── README.md           # This file
└── server/
    ├── server.js       # Express API server
    ├── bot.js          # Telegram bot logic
    ├── storage.js      # Event data storage
    ├── package.json    # Backend dependencies
    ├── .env.example    # Environment template
    └── events.json     # Event database (auto-created)
```

## How It Works

1. **Frontend**: Click the MASTERS logo to trigger the Matrix animation
2. **Matrix Effect**: Green cascading characters appear in the background
3. **Event Display**: Events slide up from the bottom with typing effects
4. **Backend**: Express server provides `/api/events` endpoint
5. **Telegram Bot**: Listens for commands and updates `events.json`
6. **Real-time**: Website fetches latest events when logo is clicked

## API Endpoints

- `GET /api/events` - Fetch all events
- `POST /api/events` - Add event (JSON body)
- `DELETE /api/events/:id` - Delete event by ID
- `GET /health` - Server health check

## Customization

### Change Colors

Edit CSS variables in `style.css`:

```css
:root {
    --neon-green: #00ff41;
    --neon-cyan: #00ffff;
    --neon-pink: #ff00ff;
}
```

### Adjust Animation Speed

In `main.js`, modify the Matrix rain interval:

```javascript
matrixInterval = setInterval(() => {
    // ... character creation
}, 100); // Change this value (milliseconds)
```

### Change Event Display Timing

In `main.js`, adjust the stagger delay:

```javascript
setTimeout(() => {
    // ... display event
}, index * 300); // Change this multiplier
```

## Troubleshooting

### Events not showing?

1. Check if backend server is running on port 3000
2. Open browser console (F12) to see error messages
3. Verify `API_URL` in `main.js` matches your server

### Telegram bot not responding?

1. Verify bot token in `.env` is correct
2. Check server logs for errors
3. Make sure you're an admin (check `ADMIN_IDS`)
4. Restart the server after changing `.env`

### Logo not displaying?

1. Ensure `logo.jpg` exists in the project root
2. Check browser console for 404 errors
3. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)

## Production Deployment

### Frontend

Deploy to any static hosting:
- Netlify
- Vercel
- GitHub Pages
- Any web server

### Backend

Deploy to:
- Heroku
- Railway
- DigitalOcean
- Any Node.js hosting

**Important**: Update `API_URL` in `main.js` to your production backend URL.

## License

MIT
