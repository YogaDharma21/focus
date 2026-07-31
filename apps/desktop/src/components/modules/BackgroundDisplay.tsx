import React from 'react';
import { useDesktopStore } from '../../lib/store';

export const BackgroundDisplay: React.FC = () => {
  const { background } = useDesktopStore();

  const getBgStyle = () => {
    switch (background) {
      case 'mountain':
        return 'bg-[url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80")] bg-cover bg-center';
      case 'library':
        return 'bg-[url("https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80")] bg-cover bg-center';
      case 'cafe':
        return 'bg-[url("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80")] bg-cover bg-center';
      case 'anime-room':
        return 'bg-[url("https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80")] bg-cover bg-center';
      default:
        return 'bg-zinc-950';
    }
  };

  return (
    <div className={`fixed inset-0 pointer-events-none transition-all duration-300 ${getBgStyle()}`}>
      {background !== 'dark' && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[2px]" />
      )}
    </div>
  );
};
