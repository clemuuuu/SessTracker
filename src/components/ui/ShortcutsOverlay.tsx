import { X, Command } from 'lucide-react';
import { APP_SHORTCUTS } from '../../data/shortcuts';

interface ShortcutsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShortcutsOverlay({ isOpen, onClose }: ShortcutsOverlayProps) {
    if (!isOpen) return null;

    // Group shortcuts by category
    const grouped = APP_SHORTCUTS.reduce((acc, shortcut) => {
        if (!acc[shortcut.category]) acc[shortcut.category] = [];
        acc[shortcut.category].push(shortcut);
        return acc;
    }, {} as Record<string, typeof APP_SHORTCUTS>);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-gray-900/90 border border-gray-700/50 rounded-xl p-6 w-full max-w-lg shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Command size={20} />
                        <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {Object.entries(grouped).map(([category, shortcuts]) => (
                        <div key={category}>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{category}</h3>
                            <div className="space-y-2">
                                {shortcuts.map((shortcut, index) => (
                                    <div key={index} className="flex items-center justify-between group">
                                        <span className="text-gray-300 text-sm">{shortcut.description}</span>
                                        <div className="flex gap-1">
                                            {shortcut.key.split(' ').map((k, i) => (
                                                <kbd
                                                    key={i}
                                                    className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 font-mono min-w-[20px] text-center"
                                                >
                                                    {k === '+' ? ' + ' : k}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-600">
                        Click anywhere outside to close
                    </p>
                </div>
            </div>
        </div>
    );
}
