// Theme Management System for FM Tactics Simulator

export const THEMES = {
    premium: {
        name: 'Premium Glass',
        class: 'theme-premium',
        description: 'Modern glassmorphism with vibrant gradients',
        cssFile: null, // Uses default style.css
        playerStyle: {
            type: 'gradient',
            stroke: 'white',
            strokeWidth: 2,
            shadow: true,
            font: 'Outfit'
        }
    },
    arcade: {
        name: 'Arcade',
        class: 'theme-arcade',
        description: 'Neon 80s arcade with CRT effects',
        cssFile: 'css/themes/arcade.css',
        playerStyle: {
            type: 'pixel',
            stroke: '#00FFFF', // Cyan border
            strokeWidth: 3,
            shadow: false,
            font: '"Press Start 2P", monospace',
            shape: 'square'
        }
    },
    retro: {
        name: 'Retro Game',
        class: 'theme-retro',
        description: 'Classic DOS game aesthetic',
        cssFile: 'css/themes/retro.css',
        playerStyle: {
            type: 'solid',
            stroke: '#FFFFFF',
            strokeWidth: 2,
            shadow: true, // Hard shadow
            font: '"VT323", monospace',
            shape: 'square'
        }
    },
    chalkboard: {
        name: 'Chalkboard',
        class: 'theme-chalkboard',
        description: 'Hand-drawn chalk tactics',
        cssFile: 'css/themes/chalkboard.css',
        playerStyle: {
            type: 'chalk',
            stroke: 'white',
            strokeWidth: 3,
            shadow: false,
            font: '"Permanent Marker", cursive',
            fill: 'transparent' // Hollow chalk circles
        }
    },
    whiteboard: {
        name: 'Whiteboard',
        class: 'theme-whiteboard',
        description: 'Professional whiteboard with frame',
        cssFile: 'css/themes/whiteboard.css',
        playerStyle: {
            type: 'marker',
            stroke: 'none',
            strokeWidth: 0,
            shadow: true,
            font: 'Inter, sans-serif',
            fill: 'solid' // Solid marker dots
        }
    },
    jumbotron: {
        name: 'Stadium Display',
        class: 'theme-jumbotron',
        description: 'Big screen stadium graphics',
        cssFile: 'css/themes/jumbotron.css',
        playerStyle: {
            type: 'led',
            stroke: '#00D4FF',
            strokeWidth: 2,
            shadow: true, // Glow effect
            font: 'Bebas Neue, sans-serif'
        }
    },
    notebook: {
        name: 'Tactical Notebook',
        class: 'theme-notebook',
        description: 'Hand-sketched notebook',
        cssFile: 'css/themes/notebook.css',
        playerStyle: {
            type: 'sketch',
            stroke: '#2C1810', // Ink color
            strokeWidth: 2,
            shadow: false,
            font: '"Indie Flower", cursive',
            fill: 'hatch' // Hatching effect
        }
    },
    broadcast: {
        name: 'TV Broadcast',
        class: 'theme-broadcast',
        description: 'Match broadcast graphics',
        cssFile: 'css/themes/broadcast.css',
        playerStyle: {
            type: 'tv',
            stroke: '#FFD700', // Gold border
            strokeWidth: 2,
            shadow: true,
            font: 'Oswald, sans-serif'
        }
    }
};

const STORAGE_KEY = 'fm-tactics-theme';
let currentTheme = 'premium';
let loadedThemeLinks = new Set();

/**
 * Apply a theme to the application
 */
export function applyTheme(themeName) {
    const theme = THEMES[themeName];

    if (!theme) {
        console.warn(`Theme "${themeName}" not found. Using default.`);
        themeName = 'premium';
    }

    // Remove all theme classes from body
    Object.values(THEMES).forEach(t => {
        document.body.classList.remove(t.class);
    });

    // Add new theme class
    document.body.classList.add(theme.class);

    // Load theme CSS file if needed
    if (theme.cssFile && !loadedThemeLinks.has(themeName)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = theme.cssFile;
        link.dataset.theme = themeName;
        document.head.appendChild(link);
        loadedThemeLinks.add(themeName);
    }

    // Save preference
    currentTheme = themeName;
    localStorage.setItem(STORAGE_KEY, themeName);

    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: themeName, themeData: theme }
    }));
}

export function getCurrentTheme() {
    return currentTheme;
}

export function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY) || 'premium';
    applyTheme(savedTheme);
}

export function getAvailableThemes() {
    return THEMES;
}
