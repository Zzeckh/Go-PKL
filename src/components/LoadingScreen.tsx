import React from 'react';
import { Compass } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  textIndex: number;
  messages: string[];
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, textIndex, messages }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full w-full bg-white/40 backdrop-blur-xl animate-in fade-in rounded-3xl relative overflow-hidden">
      
      {/* Conceptual Background Map Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8CCDE9 2px, transparent 2px)', backgroundSize: '30px 30px' }} />

      <div className="max-w-lg w-full p-8 flex flex-col items-center z-10">
        
        {/* Radar Animation Concept */}
        <div className="relative flex items-center justify-center mb-16 mt-8">
          <div className="absolute w-[280px] h-[280px] border border-[#8CCDE9]/20 rounded-full animate-ping [animation-duration:3s]"></div>
          <div className="absolute w-[180px] h-[180px] border border-[#8CCDE9]/40 rounded-full animate-ping [animation-duration:3s] [animation-delay:1s]"></div>
          <div className="absolute w-[80px] h-[80px] border border-[#8CCDE9]/60 rounded-full animate-ping [animation-duration:3s] [animation-delay:2s]"></div>
          
          <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-slate-700">
            <Compass className="w-10 h-10 text-[#8CCDE9] animate-spin [animation-duration:4s]" />
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#F3C846] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>

        <div className="w-full space-y-6 text-center bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm">
          <div className="space-y-1">
             <h2 className="text-2xl font-bold text-black/80 tracking-tight">Crextio System Boot</h2>
             <p className="text-[10px] font-bold text-black/50 uppercase tracking-widest">Initialization Phase</p>
          </div>
          
          <div className="space-y-3 w-full mt-4">
            <div className="flex justify-between items-end px-1">
              <span className="text-[11px] font-bold text-black/60 transition-all duration-300 min-h-[16px]">
                {messages[textIndex]}
              </span>
              <span className="text-[11px] font-bold text-black/80 tabular-nums">
                {progress}%
              </span>
            </div>
            
            <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-slate-800 to-[#8CCDE9] rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute top-0 bottom-0 right-0 w-8 bg-white/30 blur-[2px] animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
