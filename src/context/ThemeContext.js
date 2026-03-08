import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    name: 'Dark',
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
