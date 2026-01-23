import { describe, it, expect } from 'vitest';

/**
 * Normalize rotation to 0-359 range
 */
function normalizeRotation(deg: number): number {
    return ((deg % 360) + 360) % 360;
}

describe('rotation utils', () => {
    describe('normalizeRotation', () => {
        it('should keep positive angles within 0-359', () => {
            expect(normalizeRotation(90)).toBe(90);
            expect(normalizeRotation(180)).toBe(180);
            expect(normalizeRotation(270)).toBe(270);
            expect(normalizeRotation(360)).toBe(0);
            expect(normalizeRotation(450)).toBe(90);
        });

        it('should convert negative angles to positive equivalents', () => {
            expect(normalizeRotation(-90)).toBe(270);
            expect(normalizeRotation(-180)).toBe(180);
            expect(normalizeRotation(-270)).toBe(90);
            expect(normalizeRotation(-360)).toBe(0);
        });

        it('should handle zero', () => {
            expect(normalizeRotation(0)).toBe(0);
        });

        it('should handle large positive angles', () => {
            expect(normalizeRotation(720)).toBe(0);
            expect(normalizeRotation(810)).toBe(90);
            expect(normalizeRotation(1080)).toBe(0);
        });

        it('should handle large negative angles', () => {
            expect(normalizeRotation(-720)).toBe(0);
            expect(normalizeRotation(-810)).toBe(270);
        });
    });

    describe('rotation increments', () => {
        it('should rotate clockwise by 90 degrees', () => {
            const currentRotation = 0;
            const newRotation = normalizeRotation(currentRotation + 90);
            expect(newRotation).toBe(90);
        });

        it('should rotate counter-clockwise by 90 degrees', () => {
            const currentRotation = 0;
            const newRotation = normalizeRotation(currentRotation - 90);
            expect(newRotation).toBe(270);
        });

        it('should wrap around when rotating past 360', () => {
            const currentRotation = 270;
            const newRotation = normalizeRotation(currentRotation + 90);
            expect(newRotation).toBe(0);
        });

        it('should wrap around when rotating past 0 counter-clockwise', () => {
            const currentRotation = 0;
            const newRotation = normalizeRotation(currentRotation - 90);
            expect(newRotation).toBe(270);
        });
    });
});
