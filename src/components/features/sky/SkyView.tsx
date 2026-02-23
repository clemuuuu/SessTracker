import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRevisionStore } from '../../../store/useRevisionStore';
import { SkyBackground } from './SkyBackground';
import { StarIcon } from './StarIcon';
import { ShootingStars } from './ShootingStars';
import { StarListMenu } from './StarListMenu';

export const SkyView: React.FC = () => {
    const { stars, addStar, updateStar, deleteStar, scrollToArea } = useRevisionStore();
    const [inputVisible, setInputVisible] = useState(false);
    const [inputPos, setInputPos] = useState({ x: 0, y: 0 });
    const [starName, setStarName] = useState('');
    const [selectedStarId, setSelectedStarId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSkyClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent click if clicking inside the form or on a star menu
        if ((e.target as HTMLElement).closest('form') || (e.target as HTMLElement).closest('.star-node') || (e.target as HTMLElement).closest('.star-menu')) {
            return;
        }

        setSelectedStarId(null);

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Auto-save existing input if clicking somewhere else
        if (inputVisible && starName.trim()) {
            addStar(starName.trim(), inputPos.x / window.innerWidth, inputPos.y / window.innerHeight);
        }

        setInputPos({ x, y });
        setInputVisible(true);
        setStarName('');
    };

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (starName.trim()) {
            addStar(starName.trim(), inputPos.x / window.innerWidth, inputPos.y / window.innerHeight);
            setInputVisible(false);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setInputVisible(false);
        }
    };

    useEffect(() => {
        if (inputVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [inputVisible]);

    return (
        <div
            className="relative w-screen h-screen flex-shrink-0 snap-start overflow-hidden bg-slate-950 cursor-crosshair"
            onClick={handleSkyClick}
        >
            {/* Background Canvas */}
            <SkyBackground />
            <ShootingStars />

            {/* Render Stars */}
            {stars.map((star) => {
                const isSelected = selectedStarId === star.id;

                return (
                    <motion.div
                        key={star.id}
                        className="absolute star-node group z-10"
                        style={{
                            left: star.x <= 1 ? `${star.x * 100}%` : star.x,
                            top: star.y <= 1 ? `${star.y * 100}%` : star.y
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                    >
                        {/* The Star itself */}
                        <div
                            className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStarId(star.id);
                                setInputVisible(false); // Close new star input if open
                            }}
                        >
                            <div className={`absolute inset-0 rounded-full blur-md opacity-40 animate-pulse scale-150 ${isSelected ? 'bg-indigo-400' : 'bg-yellow-300'}`} />
                            <StarIcon
                                modelType={star.modelType || 'classic'}
                                className={`relative w-6 h-6 transition-colors ${isSelected ? 'text-white' : 'text-yellow-100'} drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]`}
                            />
                        </div>

                        {/* Tooltip on Hover (only if not selected) */}
                        {!isSelected && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 backdrop-blur border border-slate-700 text-slate-200 text-sm px-3 py-1.5 rounded whitespace-nowrap z-50 pointer-events-none drop-shadow-md">
                                {star.text}
                            </div>
                        )}

                        {/* Action Menu when Selected */}
                        <AnimatePresence>
                            {isSelected && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 15, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-600 p-3 rounded-lg shadow-2xl z-50 star-menu"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="text"
                                        value={star.text}
                                        onChange={(e) => updateStar(star.id, { text: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm mb-3 focus:outline-none focus:border-indigo-500"
                                        placeholder="Objective name"
                                        autoFocus
                                    />

                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Shape</span>
                                        <button
                                            onClick={() => {
                                                deleteStar(star.id);
                                                setSelectedStarId(null);
                                            }}
                                            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 px-1 py-0.5 rounded hover:bg-red-900/30 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    <div className="flex justify-between gap-1 overflow-x-auto pb-1 custom-scrollbar">
                                        {(['classic', 'four-point', 'eight-point', 'sparkle'] as const).map(model => (
                                            <button
                                                key={model}
                                                onClick={() => updateStar(star.id, { modelType: model })}
                                                className={`p-1.5 rounded-md border flex items-center justify-center transition-colors ${(star.modelType || 'classic') === model
                                                    ? 'bg-indigo-900/50 border-indigo-400 text-yellow-300'
                                                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                                    }`}
                                            >
                                                <StarIcon modelType={model} className="w-5 h-5" />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}

            {/* Input Overlay */}
            <AnimatePresence>
                {inputVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                        style={{ left: inputPos.x, top: inputPos.y }}
                    >
                        <form onSubmit={handleInputSubmit} className="bg-slate-900/90 backdrop-blur-md border border-amber-500/50 p-2 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={starName}
                                onChange={(e) => setStarName(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                                placeholder="Name your objective..."
                                className="bg-transparent border-none text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0 text-sm w-48"
                            />
                            <button type="submit" className="text-amber-400 hover:text-amber-300 px-2 text-sm font-medium">
                                Create
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Star List Sidebar */}
            <StarListMenu
                selectedStarId={selectedStarId}
                setSelectedStarId={(id) => {
                    setSelectedStarId(id);
                    setInputVisible(false);
                }}
            />

            {/* Navigation hint to go down to tree */}
            <button
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer group"
                onClick={(e) => {
                    e.stopPropagation();
                    scrollToArea('tree');
                }}
            >
                <span className="text-xs uppercase tracking-widest font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Main Tree</span>
                <div className="w-8 h-8 rounded-full bg-slate-800/50 backdrop-blur border border-slate-700 flex items-center justify-center animate-bounce shadow-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </div>
            </button>
        </div>
    );
};
