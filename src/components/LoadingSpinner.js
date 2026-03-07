import React from 'react';

const LoadingSpinner = ({ message = 'Lädt...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-dark-600 border-t-cyan-400 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-400 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
