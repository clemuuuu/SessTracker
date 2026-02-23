import type { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { RevisionState, StarSlice, StarNodeData } from './types';

export const createStarSlice: StateCreator<RevisionState, [], [], StarSlice> = (set) => ({
    stars: [],

    addStar: (text: string, x: number, y: number, modelType: StarNodeData['modelType'] = 'four-point') => {
        if (!text.trim()) return;
        set((state) => ({
            stars: [
                ...state.stars,
                {
                    id: uuidv4(),
                    text: text.trim(),
                    x,
                    y,
                    modelType,
                    createdAt: Date.now(),
                },
            ],
        }));
    },

    updateStar: (id: string, updates: Partial<StarNodeData>) => {
        set((state) => ({
            stars: state.stars.map((star) =>
                star.id === id ? { ...star, ...updates } : star
            ),
        }));
    },

    deleteStar: (id: string) => {
        set((state) => ({
            stars: state.stars.filter((star) => star.id !== id),
        }));
    }
});
