import React from 'react';
import { useRevisionStore } from '../../../store/useRevisionStore';
import { UndergroundBackground } from './UndergroundBackground';

export const UndergroundView: React.FC = () => {
    const { scrollToArea } = useRevisionStore();

    return (
        <div className="w-screen h-screen flex-shrink-0 snap-start relative overflow-hidden bg-[#2E2A2F] text-white">
            {/* Background Canvas */}
            <UndergroundBackground />

            {/* Foreground Content */}
            <div className="absolute inset-0 z-10 flex flex-col items-center p-8 pointer-events-none">

                {/* Scroll Up Hint */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        scrollToArea('calendar'); // Return to the calendar view
                    }}
                    className="absolute top-6 left-1/2 -translate-x-1/2 animate-bounce opacity-60 text-amber-500/80 z-20 cursor-pointer hover:opacity-100 transition-opacity flex flex-col items-center pointer-events-auto"
                >
                    <div className="w-6 h-6 border-2 border-amber-500/80 rounded-full border-b-0 border-r-0 rotate-45 mx-auto mb-1"></div>
                    <span className="text-xs uppercase tracking-widest font-semibold text-amber-500/80 bg-slate-900/50 px-2 py-1 rounded backdrop-blur-sm mt-1">Back to Surface</span>
                </div>

                {/* Navigation Hint (Left to Roots) */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        scrollToArea('roots');
                    }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 animate-bounce opacity-50 text-stone-400 z-20 cursor-pointer hover:opacity-100 transition-opacity flex items-center gap-3 pointer-events-auto"
                >
                    <div className="w-6 h-6 border-2 border-stone-400 rounded-full border-b-0 border-r-0 rotate-[-45deg]"></div>
                    <span className="text-xs font-mono uppercase tracking-widest hidden md:block bg-slate-900/50 px-2 py-1 rounded backdrop-blur-sm">Roots</span>
                </div>

                {/* Title overlay - can be removed later when notes are implemented */}
                <h2 className="mt-20 text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-stone-400 to-amber-700/80 text-center opacity-40">
                    The Underground
                </h2>
                <p className="text-stone-500 text-sm mt-2 opacity-60">Deep notes and hidden knowledge</p>

            </div>
        </div>
    );
};
