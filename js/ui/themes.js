/**
 * Theme System
 */

export const Themes = {
    dark: { // Default (DaVinci/Premiere)
        '--bg-main': '#141414',
        '--bg-panel': '#1e1e1e',
        '--bg-panel-header': '#252525',
        '--bg-element': '#2d2d2d',
        '--bg-hover': '#3a3a3a',
        '--text-primary': '#e5e5e5'
    },
    midnight: { // Dark Blue
        '--bg-main': '#0b1120',
        '--bg-panel': '#111827',
        '--bg-panel-header': '#1f2937',
        '--bg-element': '#374151',
        '--bg-hover': '#4b5563',
        '--text-primary': '#f3f4f6'
    },
    oled: { // Pure Black
        '--bg-main': '#000000',
        '--bg-panel': '#0a0a0a',
        '--bg-panel-header': '#111111',
        '--bg-element': '#222222',
        '--bg-hover': '#333333',
        '--text-primary': '#ffffff'
    }
};

export function applyTheme(themeName) {
    const theme = Themes[themeName];
    if (theme) {
        for (const [key, value] of Object.entries(theme)) {
            document.documentElement.style.setProperty(key, value);
        }
    }
}
