/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: [
            '-apple-system',
            'BlinkMacSystemFont',
            'SF Pro Text',
            'SF Pro Display',
            'system-ui',
            'sans-serif'
          ],
        },
        colors: {
            // Apple System Colors
            systemBackground: {
                DEFAULT: '#FFFFFF', // Light
                dark: '#000000',    // Dark
            },
            secondarySystemBackground: {
                DEFAULT: '#F2F2F7',
                dark: '#1C1C1E',
            },
            tertiarySystemBackground: {
                DEFAULT: '#FFFFFF',
                dark: '#2C2C2E',
            },
            // Tints
            systemBlue: '#007AFF',
            systemRed: '#FF3B30',
            systemGreen: '#34C759',
            systemIndigo: '#5856D6',
            systemOrange: '#FF9500',
            systemPink: '#FF2D55',
            systemPurple: '#AF52DE',
            systemTeal: '#5AC8FA',
            systemYellow: '#FFCC00',
            systemGray: '#8E8E93',
            systemGray2: '#AEAEB2',
            systemGray3: '#C7C7CC',
            systemGray4: '#D1D1D6',
            systemGray5: '#E5E5EA',
            systemGray5: '#E5E5EA',
            systemGray6: '#F2F2F7',
            // Legacy/Reskin Colors from index.html
            background: '#020617', // Slate 950 (Deeper black/blue)
            surface: '#0f172a',    // Slate 900 (Card bg)
            surfaceHighlight: '#1e293b', // Slate 800 (Hover/Active)
            primary: '#38bdf8',    // Sky 400
            secondary: '#818cf8',  // Indigo 400
            accent: '#34d399',     // Emerald 400
            luxury: '#f472b6',     // Pink 400
            necessity: '#60a5fa',  // Blue 400
            food: '#fbbf24',       // Amber 400
        },
        fontSize: {
            'xxxs': '9px',
            'xxs': '10px',
        },
        borderRadius: {
            'ios': '10px', // Continuous curve approximation
            'ios-lg': '20px',
        },
        boxShadow: {
            'ios': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            'ios-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }
      },
    },
    plugins: [],
  }
