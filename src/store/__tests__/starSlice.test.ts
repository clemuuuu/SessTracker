import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createStarSlice } from '../slices/starSlice';

describe('starSlice', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let useStore: any;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useStore = create<any>()((...a) => ({
            ...createStarSlice(...a)
        }));
    });

    it('should add a star with default modelType (four-point)', () => {
        useStore.getState().addStar('My Star', 100, 200);

        const stars = useStore.getState().stars;
        expect(stars.length).toBe(1);
        expect(stars[0].text).toBe('My Star');
        expect(stars[0].x).toBe(100);
        expect(stars[0].y).toBe(200);
        expect(stars[0].modelType).toBe('four-point');
        expect(stars[0].id).toBeDefined();
        expect(stars[0].createdAt).toBeDefined();
    });

    it('should add a star with specific modelType', () => {
        useStore.getState().addStar('Sparkle Star', 50, 50, 'sparkle');

        const stars = useStore.getState().stars;
        expect(stars.length).toBe(1);
        expect(stars[0].modelType).toBe('sparkle');
    });

    it('should ignore adding a star with empty text', () => {
        useStore.getState().addStar('   ', 50, 50); // Empty / whitespace text

        const stars = useStore.getState().stars;
        expect(stars.length).toBe(0);
    });

    it('should update a star with partial data', () => {
        useStore.getState().addStar('Initial', 10, 10);

        let stars = useStore.getState().stars;
        const starId = stars[0].id;

        useStore.getState().updateStar(starId, { text: 'Updated Goals', modelType: 'classic' });

        stars = useStore.getState().stars;
        expect(stars[0].text).toBe('Updated Goals');
        expect(stars[0].modelType).toBe('classic');
        expect(stars[0].x).toBe(10); // X should be unchanged
        expect(stars[0].y).toBe(10); // Y should be unchanged
    });

    it('should delete a star by id', () => {
        useStore.getState().addStar('To delete', 10, 10);
        let stars = useStore.getState().stars;
        expect(stars.length).toBe(1);

        const starId = stars[0].id;
        useStore.getState().deleteStar(starId);

        stars = useStore.getState().stars;
        expect(stars.length).toBe(0);
    });
});
