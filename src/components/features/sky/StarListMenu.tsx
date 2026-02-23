import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRevisionStore } from '../../../store/useRevisionStore';
import { StarIcon } from './StarIcon';

interface StarListMenuProps {
    selectedStarId: string | null;
    setSelectedStarId: (id: string | null) => void;
}

export const StarListMenu: React.FC<StarListMenuProps> = ({ selectedStarId, setSelectedStarId }) => {
    const { stars } = useRevisionStore();
    const [isOpen, setIsOpen] = useState(false);

    // Sort stars by creation date (newest first) or alphabetically
    const sortedStars = [...stars].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div
            className="absolute right-0 top-0 h-full z-40 flex pointer-events-none star-list-menu"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Toggle Button */}
            <div className="absolute right-6 top-6 pointer-events-auto">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="p-3 bg-slate-900/80 backdrop-blur-md border border-amber-500/30 hover:bg-slate-800 hover:border-amber-400/80 rounded-lg text-amber-200 hover:text-amber-100 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center relative group"
                    title="Toggle Objectives List"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    {/* Badge showing total stars */}
                    {stars.length > 0 && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-amber-600 border justify-center items-center border-amber-300 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                            {stars.length}
                        </div>
                    )}
                </button>
            </div>

            {/* Sliding Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-80 h-full bg-slate-900/95 backdrop-blur-xl border-l border-amber-500/30 shadow-2xl flex flex-col pointer-events-auto relative overflow-hidden"
                    >
                        {/* Static Golden Shooting Star Background Effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                            backgroundImage: `
                                radial-gradient(1px 1px at 20% 30%, #fde047, transparent),
                                radial-gradient(1px 1px at 50% 80%, #fde047, transparent),
                                radial-gradient(2px 2px at 80% 20%, #fde047, transparent),
                                radial-gradient(1.5px 1.5px at 10% 60%, #fde047, transparent),
                                radial-gradient(1px 1px at 70% 90%, #fde047, transparent),
                                linear-gradient(45deg, transparent 40%, rgba(245,158,11,0.1) 45%, rgba(253,224,71,0.4) 50%, rgba(245,158,11,0.1) 55%, transparent 60%)
                            `,
                            backgroundSize: '100px 100px, 150px 150px, 200px 200px, 120px 120px, 180px 180px, 200% 200%',
                            backgroundPosition: '0 0, 0 0, 0 0, 0 0, 0 0, -50% -50%'
                        }} />

                        <div className="relative p-6 border-b border-amber-500/20 flex items-center justify-between z-10 bg-gradient-to-b from-slate-900/50 to-transparent">
                            <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                <StarIcon modelType="classic" className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
                                My Objectives
                            </h2>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="p-1 rounded text-amber-500/70 hover:text-amber-300 hover:bg-amber-900/30 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="relative flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3 z-10">
                            {sortedStars.length === 0 ? (
                                <div className="text-center text-amber-500/50 text-sm mt-8 italic px-4">
                                    No objectives yet.<br />
                                    Click anywhere on the sky to add one!
                                </div>
                            ) : (
                                sortedStars.map((star) => {
                                    const isSelected = selectedStarId === star.id;
                                    return (
                                        <div
                                            key={star.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedStarId(star.id);
                                            }}
                                            className={`
                                                p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 backdrop-blur-sm
                                                ${isSelected
                                                    ? 'bg-amber-900/30 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]'
                                                    : 'bg-slate-800/60 border-amber-900/40 hover:bg-slate-800/90 hover:border-amber-700/60 hover:shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                                                }
                                            `}
                                        >
                                            <div className={`p-2 rounded-md transition-colors ${isSelected ? 'bg-amber-900/60' : 'bg-slate-900/80'} border border-transparent ${isSelected ? 'border-amber-500/30' : ''}`}>
                                                <StarIcon
                                                    modelType={star.modelType || 'classic'}
                                                    className={`w-5 h-5 transition-all ${isSelected ? 'text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.9)] scale-110' : 'text-amber-200/60 hover:text-amber-200 drop-shadow-[0_0_3px_rgba(245,158,11,0.3)]'}`}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`truncate text-sm font-medium transition-colors ${isSelected ? 'text-amber-100' : 'text-slate-300 hover:text-amber-100/90'}`}>
                                                    {star.text}
                                                </div>
                                                <div className={`text-xs mt-0.5 transition-colors ${isSelected ? 'text-amber-400/80' : 'text-slate-500'}`}>
                                                    {new Date(star.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
