import React from 'react';
import { useTheme } from '../context/ThemeContext';

function LoadingSpinner({ message = 'Laden...' }) {
  const { currentTheme } = useTheme();
  const c = currentTheme.colors;

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 border-4 border-cyan-400/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className={c.textSecondary}>{message}</p>
    </div>
  );
}

export default LoadingSpinner;
