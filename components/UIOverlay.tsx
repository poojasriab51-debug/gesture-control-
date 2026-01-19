
import React from 'react';
import { ParticleShape } from '../types';

interface Props {
  activeShape: ParticleShape;
  onShapeChange: (shape: ParticleShape) => void;
  gestureDetected: boolean;
}

const UIOverlay: React.FC<Props> = ({ activeShape, onShapeChange, gestureDetected }) => {
  return (
    <div className="flex flex-col h-full p-8 justify-between">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          NEBULA HANDS
        </h1>
        <p className="text-white/40 font-mono text-sm mt-1 uppercase tracking-widest">
          Interactive Particle Synthesis
        </p>
      </div>

      {/* Controls Container */}
      <div className="flex flex-col gap-6 max-w-xs pointer-events-auto">
        <div className="glass-panel p-4 rounded-2xl flex flex-col gap-2">
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Manual override</span>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(ParticleShape).map((shape) => (
              <button
                key={shape}
                onClick={() => onShapeChange(shape)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                  activeShape === shape 
                    ? 'bg-white/10 border-white/40 text-white shadow-lg' 
                    : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="glass-panel p-4 rounded-2xl">
           <div className="flex items-center justify-between mb-3">
             <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Sensor Status</span>
             <div className={`w-2 h-2 rounded-full ${gestureDetected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
           </div>
           
           <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-white/70">
                  <span>GESTURE RECOGNITION</span>
                  <span>{gestureDetected ? 'LOCKED' : 'SEARCHING...'}</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${gestureDetected ? 'w-full bg-emerald-400' : 'w-1/4 bg-red-500/50 animate-pulse'}`} 
                  />
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="glass-panel p-4 rounded-2xl max-w-sm">
        <h3 className="text-xs font-bold text-white/80 mb-2 uppercase">How to control</h3>
        <ul className="text-[11px] text-white/40 space-y-1 font-mono">
          <li>✌️ <span className="text-white/60">PEACE:</span> Morph to Heart</li>
          <li>✋ <span className="text-white/60">PALM:</span> Bloom Flower</li>
          <li>☝️ <span className="text-white/60">POINT:</span> Reconstruct Saturn</li>
          <li>✊ <span className="text-white/60">FIST:</span> Ignite Fireworks</li>
          <li>Move hand to repel and excite particles</li>
        </ul>
      </div>
    </div>
  );
};

export default UIOverlay;
