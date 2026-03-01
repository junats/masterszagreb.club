// Storage module for event data

const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, 'events.json');

// Initialize storage
async function init() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        // File doesn't exist, create it
        await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
    }
}

// Get all events
async function getEvents() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const events = JSON.parse(data);
        
        // Sort by date
        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
        console.error('Error reading events:', error);
        return [];
    }
}

// Add new event
async function addEvent(event) {
    try {
        const events = await getEvents();
        
        // Add ID and timestamp
        const newEvent = {
            id: Date.now().toString(),
            ...event,
            createdAt: new Date().toISOString()
        };
        
        events.push(newEvent);
        await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2));
        
        return newEvent;
    } catch (error) {
        console.error('Error adding event:', error);
        throw error;
    }
}

// Delete event by ID
async function deleteEvent(id) {
    try {
        const events = await getEvents();
        const filtered = events.filter(e => e.id !== id);
        
        await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2));
        
        return filtered.length < events.length;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}

// Clear all events
async function clearEvents() {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
        return true;
    } catch (error) {
        console.error('Error clearing events:', error);
        throw error;
    }
}

module.exports = {
    init,
    getEvents,
    addEvent,
    deleteEvent,
    clearEvents
};
