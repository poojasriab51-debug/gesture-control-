
import React from 'react';

interface Props {
  x: number;
  y: number;
  intensity: number;
}

const GestureOverlay: React.FC<Props> = ({ x, y, intensity }) => {
  return (
    <div 
      className="absolute pointer-events-none transition-all duration-300 ease-out"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div 
        className="rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
        style={{ 
          width: `${40 + intensity * 0.8}px`, 
          height: `${40 + intensity * 0.8}px`,
          opacity: 0.6
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
    </div>
  );
};

export default GestureOverlay;
