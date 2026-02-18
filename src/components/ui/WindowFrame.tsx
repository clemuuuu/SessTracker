import { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { GripHorizontal, Eye } from 'lucide-react';

interface WindowFrameProps {
    title: string;
    children: React.ReactNode;
    initialPos?: { x: number; y: number };
    initialSize?: { w: number; h: number };
    minSize?: { w: number; h: number };
}

export function WindowFrame({
    title,
    children,
    initialPos = { x: 100, y: 100 },
    initialSize = { w: 600, h: 400 },
    minSize = { w: 300, h: 200 }
}: WindowFrameProps) {
    const [size, setSize] = useState(initialSize);
    const [isResizing, setIsResizing] = useState(false);
    const [opacity, setOpacity] = useState(0.9);
    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useDragControls();

    // Resize Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !containerRef.current) return;

            // Calculate new size based on mouse position relative to container
            const rect = containerRef.current.getBoundingClientRect();

            const newWidth = Math.max(minSize.w, e.clientX - rect.left);
            const newHeight = Math.max(minSize.h, e.clientY - rect.top);

            setSize({ w: newWidth, h: newHeight });
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
    }, [isResizing, minSize]);

    return (
        <motion.div
            ref={containerRef}
            drag
            dragListener={false} // Only drag when using controls
            dragControls={controls}
            dragMomentum={false}
            initial={{ x: initialPos.x, y: initialPos.y }}
            className="absolute rounded-xl shadow-2xl overflow-hidden border border-gray-700/50 flex flex-col backdrop-blur-md"
            style={{
                width: size.w,
                height: size.h,
                backgroundColor: `rgba(17, 24, 39, ${opacity})`
            }}
        >
            {/* Title Bar (Drag Handle) */}
            <div
                className="h-10 bg-gray-800/80 border-b border-gray-700/50 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none"
                onPointerDown={(e) => controls.start(e)}
            >
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500" />
                    </div>
                    <span className="text-gray-300 text-sm font-medium ml-2">{title}</span>
                </div>

                {/* Optional Window Controls */}
                <div className="flex items-center text-gray-500 gap-3">
                    {/* Opacity Control (Always visible) */}
                    <div className="flex items-center gap-2 bg-gray-900/50 px-2 py-1 rounded-full border border-gray-700/30">
                        <Eye size={14} className="text-gray-400" />
                        <div className="flex items-center">
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={opacity}
                                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                onPointerDown={(e) => e.stopPropagation()} // Prevent dragging window
                            />
                        </div>
                    </div>
                    <GripHorizontal size={14} className="opacity-50" />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <div className="w-full h-full">
                    {children}
                </div>
            </div>

            {/* Resize Handle (Bottom Right) */}
            <div
                className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end cursor-nwse-resize p-1 z-50 touch-none"
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                }}
            >
                {/* Visual Indicator for Resize Corner */}
                <div className="w-2 h-2 border-r-2 border-b-2 border-gray-500 rounded-br-sm opacity-50 hover:opacity-100 hover:border-indigo-400 transition-colors" />
            </div>
        </motion.div>
    );
}
