import { useState, useEffect } from 'react';
import { RootsBackground } from '../background/RootsBackground';
import { StatisticsPanel } from './StatisticsPanel';
import { Layers, Keyboard } from 'lucide-react';
import { WindowFrame } from '../../ui/WindowFrame';
import { TodoListPanel } from '../todo/TodoListPanel';
import { useRevisionStore } from '../../../store/useRevisionStore';
import { ShortcutsOverlay } from '../../ui/ShortcutsOverlay';

export function RootsView() {
    const [rootsBackgroundOpacity, setRootsBackgroundOpacity] = useState(0.8);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const { activeWindowId, snapWindow } = useRevisionStore();

    // Global Keyboard Shortcuts (Hyprland-like)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeWindowId) return;
            if (!e.ctrlKey || !e.shiftKey) return;

            // Prevent default browser actions for these shortcuts
            if (e.key.startsWith('Arrow')) e.preventDefault();

            switch (e.key) {
                case 'ArrowLeft':
                    snapWindow(activeWindowId, 'left');
                    break;
                case 'ArrowRight':
                    snapWindow(activeWindowId, 'right');
                    break;
                case 'ArrowUp':
                    snapWindow(activeWindowId, 'up');
                    break;
                case 'ArrowDown':
                    snapWindow(activeWindowId, 'down');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeWindowId, snapWindow]);

    return (
        <div id="roots-view" className="relative w-screen h-screen overflow-hidden bg-gray-900 snap-start flex items-center justify-center">
            {/* ... (Background layers remain same) ... */}

            {/* Background Layers */}
            <div className="absolute inset-0 z-0">
                {/* Gradient: Warm Amber/Gold (Ground) fading to transparent (Dark Gray) */}
                <div
                    className="absolute inset-0 bg-gradient-to-b from-amber-600 via-orange-900 to-transparent"
                    style={{ opacity: rootsBackgroundOpacity }}
                ></div>
                {/* Roots Tree */}
                <RootsBackground />
            </div>

            {/* Right Controls Container */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-6">

                {/* Opacity Control */}
                <div className="flex flex-col items-center gap-3 bg-gray-800/50 p-3 rounded-full backdrop-blur-sm border border-gray-700/50 group hover:bg-gray-800/80 transition-all">
                    <Layers size={20} className="text-amber-500/80" />
                    <div className="h-32 w-1.5 bg-gray-700 rounded-full relative">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={rootsBackgroundOpacity}
                            onChange={(e) => setRootsBackgroundOpacity(parseFloat(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                        />
                        {/* Visual Indicator */}
                        <div
                            className="absolute bottom-0 w-full bg-amber-500 rounded-full transition-all duration-75"
                            style={{ height: `${rootsBackgroundOpacity * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Shortcuts Button */}
                <button
                    onClick={() => setShowShortcuts(true)}
                    className="p-3 bg-gray-800/50 rounded-full backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 hover:text-indigo-400 text-gray-400 transition-all group"
                    title="Keyboard Shortcuts"
                >
                    <Keyboard size={20} />
                </button>
            </div>

            {/* Scroll Up Hint */}
            <div
                onClick={() => {
                    window.dispatchEvent(new Event('scrollToTree'));
                }}
                className="absolute top-4 left-1/2 -translate-x-1/2 animate-bounce opacity-50 text-amber-500/80 z-20 cursor-pointer hover:opacity-100 transition-opacity flex flex-col items-center"
            >
                <div className="w-6 h-6 border-2 border-amber-500/80 rounded-full border-b-0 border-r-0 rotate-45 mx-auto mb-1"></div>
                <span className="text-xs">Back to Tree</span>
            </div>

            {/* Content: Windowed Statistics Panel */}
            <WindowFrame
                id="win-stats"
                title="Session Statistics"
                initialPos={{ x: 100, y: 100 }}
                initialSize={{ w: 800, h: 500 }}
            >
                <StatisticsPanel />
            </WindowFrame>

            {/* Content: General To-Do List */}
            <WindowFrame
                id="win-todo"
                title="General Objectives"
                initialPos={{ x: 150, y: 150 }}
                initialSize={{ w: 400, h: 500 }}
            >
                <TodoListPanel />
            </WindowFrame>

            <ShortcutsOverlay isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
        </div>
    );
}
