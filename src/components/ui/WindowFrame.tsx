import { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { GripHorizontal, Eye } from 'lucide-react';
import { useRevisionStore } from '../../store/useRevisionStore';

interface WindowFrameProps {
    id: string; // Unique ID for the window manager
    title: string;
    children: React.ReactNode;
    initialPos?: { x: number; y: number };
    initialSize?: { w: number; h: number };
    minSize?: { w: number; h: number };
}

export function WindowFrame({
    id,
    title,
    children,
    initialPos = { x: 100, y: 100 },
    initialSize = { w: 600, h: 400 },
    minSize = { w: 300, h: 200 }
}: WindowFrameProps) {
    const { windows, registerWindow, updateWindow, focusWindow } = useRevisionStore();
    const windowState = windows[id];

    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useDragControls();
    const [isResizing, setIsResizing] = useState(false);

    // Register window on mount
    useEffect(() => {
        registerWindow(id, { ...initialPos, ...initialSize });
    }, [id, registerWindow, initialPos.x, initialPos.y, initialSize.w, initialSize.h]);

    // Handle Resize
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !containerRef.current || !windowState) return;

            const rect = containerRef.current.getBoundingClientRect();
            const newWidth = Math.max(minSize.w, e.clientX - rect.left);
            const newHeight = Math.max(minSize.h, e.clientY - rect.top);

            updateWindow(id, { w: newWidth, h: newHeight, isSnapped: 'float' });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'nwse-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, minSize, id, updateWindow, windowState]);

    if (!windowState) return null; // Don't render until registered

    return (
        <motion.div
            ref={containerRef}
            drag
            dragListener={false}
            dragControls={controls}
            dragMomentum={false}
            // Use animate prop to smoothly transition between snapped positions
            animate={{
                x: windowState.x,
                y: windowState.y,
                width: windowState.w,
                height: windowState.h,
                zIndex: windowState.zIndex
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onDragEnd={(_, info) => {
                updateWindow(id, {
                    x: windowState.x + info.offset.x,
                    y: windowState.y + info.offset.y,
                    isSnapped: 'float'
                });
            }}
            onPointerDown={() => focusWindow(id)}
            className="absolute top-0 left-0 rounded-xl shadow-2xl overflow-hidden border border-gray-700/50 flex flex-col backdrop-blur-md"
            style={{
                backgroundColor: `rgba(17, 24, 39, ${windowState.opacity})`
            }}
        >
            {/* Title Bar */}
            <div
                className="h-10 bg-gray-800/80 border-b border-gray-700/50 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none"
                onPointerDown={(e) => {
                    controls.start(e);
                    focusWindow(id);
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500" />
                    </div>
                    <span className="text-gray-300 text-sm font-medium ml-2">{title}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center text-gray-500 gap-3">
                    <div className="flex items-center gap-2 bg-gray-900/50 px-2 py-1 rounded-full border border-gray-700/30">
                        <Eye size={14} className="text-gray-400" />
                        <div className="flex items-center">
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={windowState.opacity}
                                onChange={(e) => updateWindow(id, { opacity: parseFloat(e.target.value) })}
                                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <GripHorizontal size={14} className="opacity-50" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                <div className="w-full h-full">
                    {children}
                </div>
            </div>

            {/* Resize Handle */}
            <div
                className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end cursor-nwse-resize p-1 z-50 touch-none"
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                    focusWindow(id);
                }}
            >
                <div className="w-2 h-2 border-r-2 border-b-2 border-gray-500 rounded-br-sm opacity-50 hover:opacity-100 hover:border-indigo-400 transition-colors" />
            </div>
        </motion.div>
    );
}
