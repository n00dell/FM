// Theme Management System for FM Tactics Simulator

export const THEMES = {
    premium: {
        name: 'Premium Glass',
        class: 'theme-premium',
        description: 'Modern glassmorphism with vibrant gradients',
        cssFile: null // Uses default style.css
    },
    retro: {
        name: "90's Retro",
        class: 'theme-retro',
        description: 'Pixelated 8-bit arcade aesthetic with neon colors',
        cssFile: 'css/themes/retro.css'
    },
    chalkboard: {
        name: 'Chalkboard',
        class: 'theme-chalkboard',
        description: 'Hand-drawn chalk tactics board',
        cssFile: 'css/themes/chalkboard.css'
    },
    whiteboard: {
        name: 'Whiteboard',
        class: 'theme-whiteboard',
        description: 'Professional tactical whiteboard with magnetic dots',
        cssFile: 'css/themes/whiteboard.css'
    }
};

const STORAGE_KEY = 'fm-tactics-theme';
let currentTheme = 'premium';
let loadedThemeLinks = new Set();

/**
 * Apply a theme to the application
 * @param {string} themeName - Name of the theme to apply (premium, retro, chalkboard, whiteboard)
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

/**
 * Get the currently active theme
 * @returns {string} Current theme name
 */
export function getCurrentTheme() {
    return currentTheme;
}

/**
 * Initialize theme system on page load
 */
export function initTheme() {
    // Load saved theme or use default
    const savedTheme = localStorage.getItem(STORAGE_KEY) || 'premium';
    applyTheme(savedTheme);
}

/**
 * Get all available themes
 * @returns {Object} All theme definitions
 */
export function getAvailableThemes() {
    return THEMES;
}
