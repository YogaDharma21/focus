import React from 'react';
import { useDesktopStore } from '../../lib/store';

export const BackgroundDisplay: React.FC = () => {
  const { background } = useDesktopStore();

  const getBgStyle = () => {
    switch (background) {
      case 'mountain':
        // Cool dark mist mountain mood
        return 'bg-[#0a0e17]';
      case 'library':
        // Warm dark mahogany library study mood
        return 'bg-[#120e0b]';
      case 'cafe':
        // Warm lo-fi coffee lounge mood
        return 'bg-[#140f12]';
      case 'anime-room':
        // Midnight lavender/indigo anime room mood
        return 'bg-[#0d0a14]';
      default:
        // Solid dark modern
        return 'bg-[#09090b]';
    }
  };

  return (
    <div className={`fixed inset-0 pointer-events-none transition-colors duration-500 ${getBgStyle()}`} />
  );
};
