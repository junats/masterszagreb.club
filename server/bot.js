// Telegram Bot for MASTERS nightclub

const TelegramBot = require('node-telegram-bot-api');
const storage = require('./storage');

let bot;
const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) : [];

// Initialize bot
function initBot(token) {
    if (!token) {
        console.warn('⚠️  No Telegram bot token provided. Bot disabled.');
        return null;
    }
    
    bot = new TelegramBot(token, { polling: true });
    
    console.log('✅ Telegram bot initialized');
    
    setupCommands();
    
    return bot;
}

// Check if user is admin
function isAdmin(userId) {
    if (adminIds.length === 0) return true; // If no admins set, allow all
    return adminIds.includes(userId);
}

// Setup bot commands
function setupCommands() {
    // Start command
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const welcomeMessage = `
🎉 *MASTERS Event Manager*

Welcome to the MASTERS nightclub event management system!

*Available Commands:*
/addevent - Add a new event
/listevents - List all events
/deleteevent - Delete an event
/clearevents - Clear all events
/help - Show this message

${isAdmin(msg.from.id) ? '✅ You have admin access' : '⚠️ You need admin access to manage events'}
        `;
        
        bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });
    
    // Help command
    bot.onText(/\/help/, (msg) => {
        bot.sendMessage(msg.chat.id, 'Use /start to see available commands');
    });
    
    // Add event command
    bot.onText(/\/addevent/, async (msg) => {
        const chatId = msg.chat.id;
        
        if (!isAdmin(msg.from.id)) {
            bot.sendMessage(chatId, '❌ You need admin access to add events');
            return;
        }
        
        const instructions = `
📝 *Add New Event*

Please send event details in this format:

\`\`\`
TITLE: Event Name
DATE: YYYY-MM-DD HH:MM
DESCRIPTION: Event description
\`\`\`

*Example:*
\`\`\`
TITLE: TECHNO NIGHT
DATE: 2025-12-28 22:00
DESCRIPTION: Underground beats with DJ NEXUS
\`\`\`
        `;
        
        bot.sendMessage(chatId, instructions, { parse_mode: 'Markdown' });
        
        // Wait for next message
        bot.once('message', async (response) => {
            if (response.chat.id !== chatId) return;
            
            try {
                const text = response.text;
                const titleMatch = text.match(/TITLE:\s*(.+)/i);
                const dateMatch = text.match(/DATE:\s*(.+)/i);
                const descMatch = text.match(/DESCRIPTION:\s*(.+)/i);
                
                if (!titleMatch || !dateMatch || !descMatch) {
                    bot.sendMessage(chatId, '❌ Invalid format. Please use /addevent to try again.');
                    return;
                }
                
                const event = {
                    title: titleMatch[1].trim(),
                    date: dateMatch[1].trim(),
                    description: descMatch[1].trim()
                };
                
                const newEvent = await storage.addEvent(event);
                
                bot.sendMessage(chatId, `✅ Event added successfully!\n\n🎉 ${newEvent.title}\n📅 ${newEvent.date}\n📝 ${newEvent.description}`);
            } catch (error) {
                console.error('Error adding event:', error);
                bot.sendMessage(chatId, '❌ Error adding event. Please try again.');
            }
        });
    });
    
    // List events command
    bot.onText(/\/listevents/, async (msg) => {
        const chatId = msg.chat.id;
        
        try {
            const events = await storage.getEvents();
            
            if (events.length === 0) {
                bot.sendMessage(chatId, '📭 No events scheduled');
                return;
            }
            
            let message = '📅 *Upcoming Events:*\n\n';
            
            events.forEach((event, index) => {
                message += `${index + 1}. *${event.title}*\n`;
                message += `   📅 ${event.date}\n`;
                message += `   📝 ${event.description}\n`;
                message += `   🆔 ID: \`${event.id}\`\n\n`;
            });
            
            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error listing events:', error);
            bot.sendMessage(chatId, '❌ Error fetching events');
        }
    });
    
    // Delete event command
    bot.onText(/\/deleteevent/, async (msg) => {
        const chatId = msg.chat.id;
        
        if (!isAdmin(msg.from.id)) {
            bot.sendMessage(chatId, '❌ You need admin access to delete events');
            return;
        }
        
        try {
            const events = await storage.getEvents();
            
            if (events.length === 0) {
                bot.sendMessage(chatId, '📭 No events to delete');
                return;
            }
            
            let message = '🗑 *Delete Event*\n\nReply with the event ID to delete:\n\n';
            
            events.forEach((event, index) => {
                message += `${index + 1}. ${event.title} - ID: \`${event.id}\`\n`;
            });
            
            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            
            // Wait for event ID
            bot.once('message', async (response) => {
                if (response.chat.id !== chatId) return;
                
                const eventId = response.text.trim();
                const deleted = await storage.deleteEvent(eventId);
                
                if (deleted) {
                    bot.sendMessage(chatId, '✅ Event deleted successfully');
                } else {
                    bot.sendMessage(chatId, '❌ Event not found');
                }
            });
        } catch (error) {
            console.error('Error deleting event:', error);
            bot.sendMessage(chatId, '❌ Error deleting event');
        }
    });
    
    // Clear all events
    bot.onText(/\/clearevents/, async (msg) => {
        const chatId = msg.chat.id;
        
        if (!isAdmin(msg.from.id)) {
            bot.sendMessage(chatId, '❌ You need admin access to clear events');
            return;
        }
        
        bot.sendMessage(chatId, '⚠️ Are you sure you want to delete ALL events? Reply with "YES" to confirm.');
        
        bot.once('message', async (response) => {
            if (response.chat.id !== chatId) return;
            
            if (response.text.toUpperCase() === 'YES') {
                await storage.clearEvents();
                bot.sendMessage(chatId, '✅ All events cleared');
            } else {
                bot.sendMessage(chatId, '❌ Cancelled');
            }
        });
    });
    
    // Error handling
    bot.on('polling_error', (error) => {
        console.error('Telegram polling error:', error);
    });
}

module.exports = {
    initBot
};
