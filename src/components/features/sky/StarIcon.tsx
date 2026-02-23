import React from 'react';
import type { StarNodeData } from '../../../store/slices/types';

interface StarIconProps {
    modelType: StarNodeData['modelType'];
    className?: string;
}

export const StarIcon: React.FC<StarIconProps> = ({ modelType, className = '' }) => {
    switch (modelType) {
        case 'classic':
            // 5-point star
            return (
                <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            );
        case 'four-point':
            // Geometric curved 4-point star
            return (
                <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                    <path d="M12 2C12 2 14.5 10.5 22 12C14.5 13.5 12 22 12 22C12 22 9.5 13.5 2 12C9.5 10.5 12 2 12 2Z" />
                </svg>
            );
        case 'eight-point':
            // 8-point geometric star (compass style)
            return (
                <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                    <path d="M12 1L14 10L23 12L14 14L12 23L10 14L1 12L10 10L12 1Z" />
                    <path opacity="0.5" d="M12 4L16 8L20 4L16 12L20 20L16 16L12 20L8 16L4 20L8 12L4 4L8 8L12 4Z" />
                </svg>
            );
        case 'sparkle':
            // Cluster of sparkles
            return (
                <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                    <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2zM18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
                </svg>
            );
        default:
            return null;
    }
};
