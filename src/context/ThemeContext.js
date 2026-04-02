import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    name: 'Dark',
    description: 'Klassisches dunkles Design',
    colors: {
      bg: 'bg-dark-900',
      bgSecondary: 'bg-dark-800',
      bgTertiary: 'bg-dark-700',
      border: 'border-dark-600',
      text: 'text-gray-100',
      textSecondary: 'text-gray-400',
      accent: 'text-cyan-400',
      accentBg: 'bg-cyan-600',
      accentHover: 'hover:bg-cyan-500',
      sidebar: 'bg-dark-800',
      card: 'bg-dark-800',
      input: 'bg-dark-700 border-dark-600 text-gray-100',
      hover: 'hover:bg-dark-700'
    }
  },
  light: {
    name: 'Light',
    description: 'Helles, klassisches Design',
    colors: {
      bg: 'bg-gray-100',
      bgSecondary: 'bg-white',
      bgTertiary: 'bg-gray-50',
      border: 'border-gray-300',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      accent: 'text-blue-600',
      accentBg: 'bg-blue-600',
      accentHover: 'hover:bg-blue-500',
      sidebar: 'bg-white',
      card: 'bg-white',
      input: 'bg-white border-gray-300 text-gray-900',
      hover: 'hover:bg-gray-100'
    }
  },
  minimal: {
    name: 'Minimal',
    description: 'Minimalistisch in Schwarz-Weiß',
    colors: {
      bg: 'bg-white',
      bgSecondary: 'bg-gray-50',
      bgTertiary: 'bg-gray-100',
      border: 'border-gray-200',
      text: 'text-black',
      textSecondary: 'text-gray-500',
      accent: 'text-black',
      accentBg: 'bg-black',
      accentHover: 'hover:bg-gray-800',
      sidebar: 'bg-gray-50',
      card: 'bg-white',
      input: 'bg-white border-gray-200 text-black',
      hover: 'hover:bg-gray-100'
    }
  },
  morphism: {
    name: 'Morphismus',
    description: 'Glasmorphismus mit weichen Schatten',
    colors: {
      bg: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      bgSecondary: 'bg-white/10 backdrop-blur-xl',
      bgTertiary: 'bg-white/5 backdrop-blur-lg',
      border: 'border-white/20',
      text: 'text-white',
      textSecondary: 'text-purple-200',
      accent: 'text-cyan-300',
      accentBg: 'bg-gradient-to-r from-cyan-500 to-purple-600',
      accentHover: 'hover:from-cyan-400 hover:to-purple-500',
      sidebar: 'bg-white/10 backdrop-blur-xl',
      card: 'bg-white/10 backdrop-blur-xl shadow-xl shadow-purple-500/10',
      input: 'bg-white/10 backdrop-blur border-white/20 text-white placeholder-purple-200',
      hover: 'hover:bg-white/20'
    },
    customStyles: {
      cardShadow: 'shadow-xl shadow-purple-500/10',
      glowEffect: 'shadow-lg shadow-cyan-500/20',
      gradientText: 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400'
    }
  },
  glass: {
    name: 'Glas',
    description: 'Transparente Glaseffekte',
    colors: {
      bg: 'bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950',
      bgSecondary: 'bg-white/5 backdrop-blur-2xl',
      bgTertiary: 'bg-white/[0.03] backdrop-blur-xl',
      border: 'border-white/10',
      text: 'text-white/90',
      textSecondary: 'text-blue-200/70',
      accent: 'text-sky-400',
      accentBg: 'bg-sky-500/80 backdrop-blur',
      accentHover: 'hover:bg-sky-400/90',
      sidebar: 'bg-white/[0.03] backdrop-blur-2xl',
      card: 'bg-white/[0.05] backdrop-blur-2xl border border-white/10',
      input: 'bg-white/5 backdrop-blur border-white/10 text-white placeholder-blue-200/50',
      hover: 'hover:bg-white/10'
    },
    customStyles: {
      glassSurface: 'bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl',
      frostEffect: 'backdrop-blur-3xl bg-gradient-to-br from-white/10 to-white/5',
      innerGlow: 'shadow-inner shadow-white/5'
    }
  },
  retro: {
    name: 'Retro',
    description: '80er/90er Neon-Stil',
    colors: {
      bg: 'bg-gray-950',
      bgSecondary: 'bg-gray-900',
      bgTertiary: 'bg-gray-800',
      border: 'border-pink-500/30',
      text: 'text-cyan-300',
      textSecondary: 'text-pink-300',
      accent: 'text-yellow-400',
      accentBg: 'bg-gradient-to-r from-pink-600 to-purple-600',
      accentHover: 'hover:from-pink-500 hover:to-purple-500',
      sidebar: 'bg-gray-900 border-r-2 border-cyan-500/30',
      card: 'bg-gray-900 border-2 border-pink-500/30 shadow-lg shadow-pink-500/20',
      input: 'bg-gray-800 border-2 border-cyan-500/40 text-cyan-300 placeholder-pink-300/50',
      hover: 'hover:bg-gray-800 hover:border-cyan-500/50'
    },
    customStyles: {
      neonGlow: 'shadow-lg shadow-pink-500/50',
      neonText: 'text-shadow-neon',
      scanlines: 'bg-scanlines',
      gridPattern: 'bg-grid-pattern',
      borderNeon: 'border-2 border-cyan-500 shadow-lg shadow-cyan-500/50'
    }
  },
  lollipop: {
    name: 'Lollipop',
    description: 'Farbenfrohes Candy-Design mit bunten Akzenten',
    colors: {
      bg: 'bg-lollipop-bg',
      bgSecondary: 'bg-white',
      bgTertiary: 'bg-lollipop-surface2',
      border: 'border-lollipop-border',
      text: 'text-lollipop-text',
      textSecondary: 'text-lollipop-text-secondary',
      accent: 'text-lollipop-pink',
      accentBg: 'bg-gradient-to-r from-lollipop-pink to-lollipop-purple',
      accentHover: 'hover:from-lollipop-pink-light hover:to-lollipop-purple-light',
      sidebar: 'lollipop-sidebar',
      card: 'bg-white border border-lollipop-border shadow-lollipop',
      input: 'bg-white border-lollipop-border text-lollipop-text placeholder-lollipop-text-secondary',
      hover: 'hover:bg-lollipop-pink/10'
    },
    customStyles: {
      rainbowGradient: 'bg-gradient-to-r from-lollipop-pink via-lollipop-purple via-lollipop-blue to-lollipop-teal',
      candyText: 'lollipop-rainbow-text',
      glowPink: 'shadow-lollipop-pink',
      glowPurple: 'shadow-lollipop-purple'
    }
  },
  nerd: {
    name: 'Nerd',
    description: 'Terminal-Stil mit Matrix-Grün',
    colors: {
      bg: 'bg-nerd-950',
      bgSecondary: 'bg-nerd-900',
      bgTertiary: 'bg-nerd-800',
      border: 'border-nerd-green/30',
      text: 'text-nerd-green',
      textSecondary: 'text-nerd-green-dim',
      accent: 'text-nerd-green-bright',
      accentBg: 'bg-nerd-green-dark',
      accentHover: 'hover:bg-nerd-green/80',
      sidebar: 'bg-nerd-900 border-r border-nerd-green/20',
      card: 'bg-nerd-900 border border-nerd-green/20',
      input: 'bg-nerd-800 border-nerd-green/30 text-nerd-green placeholder-nerd-green-dim',
      hover: 'hover:bg-nerd-800'
    },
    customStyles: {
      terminalGlow: 'shadow-lg shadow-nerd-green/20',
      scanlineEffect: 'bg-scanlines'
    }
  },
  colorful: {
    name: 'Colorful',
    description: 'Leuchtende Farben & Rainbow-Effekte',
    colors: {
      bg: 'bg-gray-950',
      bgSecondary: 'bg-gray-900',
      bgTertiary: 'bg-gray-800',
      border: 'border-purple-500/40',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      accent: 'text-yellow-400',
      accentBg: 'bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-500',
      accentHover: 'hover:from-pink-400 hover:via-yellow-300 hover:to-cyan-400',
      sidebar: 'bg-gray-900 border-r border-purple-500/30',
      card: 'bg-gray-900 border border-purple-500/30',
      input: 'bg-gray-800 border-purple-500/40 text-white placeholder-gray-400',
      hover: 'hover:bg-gray-800'
    },
    customStyles: {
      rainbowGradient: 'bg-gradient-to-r from-pink-500 via-yellow-400 via-green-400 to-cyan-500',
      colorfulAccent: 'bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400'
    }
  },
  indie: {
    name: 'Indie',
    description: 'Warme Erdtöne im Vintage-Stil',
    colors: {
      bg: 'bg-indie-950',
      bgSecondary: 'bg-indie-900',
      bgTertiary: 'bg-indie-800',
      border: 'border-indie-600',
      text: 'text-indie-cream',
      textSecondary: 'text-indie-cream-dark',
      accent: 'text-indie-rose',
      accentBg: 'bg-indie-rose-dark',
      accentHover: 'hover:bg-indie-rose',
      sidebar: 'bg-indie-900 border-r border-indie-600',
      card: 'bg-indie-900 border border-indie-600',
      input: 'bg-indie-800 border-indie-600 text-indie-cream placeholder-indie-cream-dark',
      hover: 'hover:bg-indie-800'
    },
    customStyles: {
      warmGlow: 'shadow-lg shadow-indie-rose/20',
      vintageAccent: 'text-indie-amber'
    }
  },
  foundations: {
    name: 'Foundations',
    description: 'Professionelles Design-System mit Orange & Grün',
    colors: {
      bg: 'bg-foundations-900',
      bgSecondary: 'bg-foundations-800',
      bgTertiary: 'bg-foundations-700',
      border: 'border-foundations-600',
      text: 'text-gray-100',
      textSecondary: 'text-gray-400',
      accent: 'text-foundations-orange',
      accentBg: 'bg-foundations-orange',
      accentHover: 'hover:bg-foundations-orange-light',
      sidebar: 'bg-foundations-800',
      card: 'bg-foundations-800 shadow-foundations-raised',
      input: 'bg-foundations-700 border-foundations-600 text-gray-100 placeholder-gray-500',
      hover: 'hover:bg-foundations-700'
    },
    customStyles: {
      // Oberflächen-Stile
      surfaceBase: 'bg-foundations-800',
      surfaceRaised: 'bg-foundations-700 shadow-foundations-raised',
      surfaceInset: 'bg-foundations-900 shadow-foundations-inset',
      surfacePressed: 'bg-foundations-950 shadow-foundations-pressed',
      // Button-Stile
      buttonPrimary: 'bg-foundations-orange text-white border-2 border-foundations-orange-dark hover:bg-foundations-orange-light rounded-foundations-full',
      buttonSecondary: 'bg-foundations-600 text-white border border-foundations-500 hover:bg-foundations-500 rounded-foundations-md',
      buttonSubtle: 'bg-transparent text-gray-300 border border-foundations-600 hover:bg-foundations-700 rounded-foundations-md',
      buttonSuccess: 'bg-foundations-green text-white border-2 border-foundations-green-dark hover:bg-foundations-green-light rounded-foundations-full',
      // Akzent-Farben
      accentOrange: 'text-foundations-orange',
      accentGreen: 'text-foundations-green',
      // Schatten
      shadowRaised: 'shadow-foundations-raised',
      shadowInset: 'shadow-foundations-inset',
      shadowPressed: 'shadow-foundations-pressed',
      // Border-Radius
      radiusSm: 'rounded-foundations-sm',
      radiusMd: 'rounded-foundations-md',
      radiusLg: 'rounded-foundations-lg',
      radiusFull: 'rounded-foundations-full'
    }
  }
};

// Theme to Icon mapping (v2.2.0)
const THEME_ICON_MAP = {
  dark: 'dark',
  light: 'light',
  minimal: 'minimal',
  morphism: 'morphismus',
  glass: 'glas',
  retro: 'retro',
  foundations: 'foundations',
  lollipop: 'light',
  nerd: 'dark',
  colorful: 'dark',
  indie: 'dark'
};

// Update window icon based on theme (v2.2.0)
const updateThemeIcon = async (themeName) => {
  if (window.electronAPI?.setThemeIcon) {
    try {
      const iconName = THEME_ICON_MAP[themeName] || 'dark';
      await window.electronAPI.setThemeIcon(iconName);
    } catch (error) {
      console.warn('Could not update theme icon:', error);
    }
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('coremail-theme');
    if (saved && themes[saved]) {
      setTheme(saved);
      // Update icon on initial load (v2.2.0)
      updateThemeIcon(saved);
    } else {
      // Set default icon
      updateThemeIcon('dark');
    }
  }, []);

  const changeTheme = (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme);
      localStorage.setItem('coremail-theme', newTheme);
      // Update window icon when theme changes (v2.2.0)
      updateThemeIcon(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themes, currentTheme: themes[theme], changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
