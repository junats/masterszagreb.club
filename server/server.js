// MASTERS Nightclub Backend Server

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const storage = require('./storage');
const { initBot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize storage
storage.init().then(() => {
    console.log('✅ Storage initialized');
}).catch(err => {
    console.error('❌ Storage initialization failed:', err);
});

// Initialize Telegram bot
const bot = initBot(process.env.TELEGRAM_BOT_TOKEN);

// API Routes

// Get all events
app.get('/api/events', async (req, res) => {
    try {
        const events = await storage.getEvents();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Add event (alternative to Telegram)
app.post('/api/events', async (req, res) => {
    try {
        const { title, date, description } = req.body;
        
        if (!title || !date || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const event = await storage.addEvent({ title, date, description });
        res.status(201).json(event);
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ error: 'Failed to add event' });
    }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
    try {
        const deleted = await storage.deleteEvent(req.params.id);
        
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        bot: bot ? 'active' : 'disabled',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   MASTERS Backend Server Running     ║
╠═══════════════════════════════════════╣
║  Port: ${PORT}                           ║
║  API: http://localhost:${PORT}/api      ║
║  Bot: ${bot ? 'Active ✅' : 'Disabled ⚠️ '}               ║
╚═══════════════════════════════════════╝
    `);
    
    if (!bot) {
        console.log('\n⚠️  To enable Telegram bot:');
        console.log('1. Copy .env.example to .env');
        console.log('2. Get bot token from @BotFather on Telegram');
        console.log('3. Add your token to .env file');
        console.log('4. Restart the server\n');
    }
});
