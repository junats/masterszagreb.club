# MASTERS Nightclub Website

A premium, 100% static nightclub website with a Matrix-style event messaging system, managed securely via Google Sheets CMS.

## Features

- 🎨 **Matrix-Style UI**: Cyberpunk aesthetic with neon effects and cascading characters
- 🎵 **Event Display**: Morph menu button reveals upcoming events with typewriter effects
- 📊 **Google Sheets CMS**: Manage events via a simple Google Sheet, no backend required
- 📱 **Responsive Design**: Works on desktop and mobile
- ✨ **Premium Animations**: Smooth transitions, WebGL distortion effects, and interactive audio-reactive borders
- 🔒 **Hardened Security**: Strict CSP headers, Subresource Integrity, and sanitized DOM APIs

## Quick Start

### 1. Frontend Setup

```bash
cd nightclub-website
npm run dev
```

Open your browser to `http://localhost:8000`

### 2. Google Sheets CMS Setup

Instead of a complex backend server, this site relies on a published Google Sheet CSV.

1. **Create a Google Sheet** with exactly four columns:
   - `title` | `date` | `time` | `description`
2. **Add Event Rows**: Provide the information inside the cells under the headers.
3. **Publish to the Web**:
   - Go to `File` → `Share` → `Publish to web`.
   - Select the sheet and choose **CSV (Comma-separated values)** format.
   - Click **Publish**.
4. **Link to Website**:
   - Copy the generated CSV link.
   - Open `js/config.js`.
   - Paste the link into the `CONFIG.SHEETS_CSV_URL` variable.

The site will now automatically fetch, cache (for 5 minutes by default), and render the events securely. 

## Project Structure

```
nightclub-website/
├── index.html          # Main HTML file (with CSP headers)
├── style.css           # Base styles & typography
├── morph-menu.css      # Animated toggle button CSS
├── logo-glitch.css     # Logo visual effects
├── js/
│   ├── main.js              # Entry module
│   ├── config.js            # General settings & Google Sheets URL
│   ├── matrix-events.js     # Parses CSV & generates typewriter DOM text
│   ├── background-rotator.js# Manages background image crossfading
│   ├── background-reveal.js # Manages chromatic hover reveal layer
│   ├── audio-border.js      # Drives audio-reactive SVG borders
│   └── bg-effect.js         # ThreeJS displacement functionality
├── master-logo.svg     # MASTERS vector logo
├── package.json        # Frontend commands
└── README.md           # This file
```

## How It Works

1. **Frontend**: Background rotator phases through high-quality WebP assets.
2. **Audio-Reactive Mode**: Clicking the background initiates an audio loop that drives the logo's border and glitch states.
3. **Matrix Effect**: Upon clicking the top-right toggle, green cascading characters rain down behind the event pane.
4. **Static CMS Fetch**: `matrix-events.js` fetches the Google Sheets CSV asynchronously, parses handles it safely without `innerHTML`, and begins a sequence of typewriter-style message reveals.
5. **Security First**: The site runs no legacy server endpoints; all scripts rely on Subresource Integrity (SRI) with Strict `Content-Security-Policy` limits enforced in `index.html`.

## Customization

### Change Colors

Edit CSS variables in `:root` inside `style.css` and `morph-menu.css`.

### Change Google Sheets Cache Limit

In `js/config.js`, modify `EVENTS_CACHE_MINUTES` to alter how long users hold the fetched table string in their browser `localStorage`. 

## Production Deployment

Because the site is 100% static Javascript without an Express server, you can deploy the `dist/` build output to any standard static hosting platform:

- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages
- Standard Nginx / Apache web server

### Building for Production

```bash
npm run build
```

Upload the contents of the `dist/` directory to your hosting provider. No backend configuration necessary.

## License

MIT
