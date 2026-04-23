// Theme definitions for future expansion
const THEMES = {
  default: {
    name: 'Default',
    backgroundColor: '#0a0a1a',
    particleSprites: null, // Use geometric shapes
  },
  ocean: {
    name: 'Ocean',
    backgroundColor: '#0a1628',
    particleSprites: ['shrimp', 'sardine'],
  },
  space: {
    name: 'Space',
    backgroundColor: '#050510',
    particleSprites: ['asteroid', 'star'],
  },
  campfire: {
    name: 'Campfire',
    backgroundColor: '#1a0a00',
    particleSprites: ['ember', 'spark'],
  },
};

export class ThemeManager {
  constructor(particleSystem) {
    this.particleSystem = particleSystem;
    this.currentTheme = 'default';
  }

  apply(themeName) {
    const theme = THEMES[themeName];
    if (!theme) return;
    this.currentTheme = themeName;
    // Future: apply background, swap particle sprites, etc.
  }

  getThemeList() {
    return Object.entries(THEMES).map(([key, val]) => ({
      id: key,
      name: val.name,
    }));
  }
}
