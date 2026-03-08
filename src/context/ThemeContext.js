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
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('coremail-theme');
    if (saved && themes[saved]) {
      setTheme(saved);
    }
  }, []);

  const changeTheme = (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme);
      localStorage.setItem('coremail-theme', newTheme);
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
