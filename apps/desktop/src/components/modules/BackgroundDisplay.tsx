import React from 'react';
import { useDesktopStore, BackgroundType } from '../../lib/store';

export const BackgroundDisplay: React.FC = () => {
  const { background } = useDesktopStore();

  const getBgStyle = () => {
    switch (background) {
      case 'gradient':
        return 'bg-gradient-to-br from-indigo-950 via-zinc-950 to-cyan-950';
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
    <div className={`fixed inset-0 pointer-events-none transition-all duration-700 ${getBgStyle()}`}>
      {/* Overlay gradient mask for readability */}
      <div className="absolute inset-0 bg-zinc-950/75 backdrop-blur-[2px]" />
      
      {/* Glowing radial ambient lights */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
    </div>
  );
};
