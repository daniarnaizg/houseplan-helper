import { describe, it, expect } from 'vitest';
import { calculateDistance, calculatePolygonArea, pixelsToUnit, Point } from './geometry';

describe('geometry utils', () => {
    describe('calculateDistance', () => {
        it('should calculate distance between two points', () => {
            const p1: Point = { x: 0, y: 0 };
            const p2: Point = { x: 3, y: 4 };
            expect(calculateDistance(p1, p2)).toBe(5);
        });

        it('should return 0 for same points', () => {
            const p1: Point = { x: 10, y: 10 };
            expect(calculateDistance(p1, p1)).toBe(0);
        });

        it('should handle negative coordinates', () => {
            const p1: Point = { x: -1, y: -1 };
            const p2: Point = { x: -4, y: -5 };
            expect(calculateDistance(p1, p2)).toBe(5);
        });
    });

    describe('calculatePolygonArea', () => {
        it('should return 0 for fewer than 3 points', () => {
            expect(calculatePolygonArea([], 1)).toBe(0);
            expect(calculatePolygonArea([{x:0, y:0}], 1)).toBe(0);
            expect(calculatePolygonArea([{x:0, y:0}, {x:10, y:10}], 1)).toBe(0);
        });

        it('should calculate area of a square (10x10) with scale 1', () => {
            const square: Point[] = [
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 10, y: 10 },
                { x: 0, y: 10 }
            ];
            expect(calculatePolygonArea(square, 1)).toBe(100);
        });

        it('should calculate area of a triangle (base 10, height 10) with scale 1', () => {
            const triangle: Point[] = [
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 0, y: 10 }
            ];
            // Area = 0.5 * b * h = 50
            expect(calculatePolygonArea(triangle, 1)).toBe(50);
        });

        it('should scale the area correctly (scale 2 means 1 unit = 2 pixels)', () => {
            // Square 10x10 pixels. 
            // Scale 2 => side is 5 units. Area should be 25 units.
            const square: Point[] = [
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 10, y: 10 },
                { x: 0, y: 10 }
            ];
            expect(calculatePolygonArea(square, 2)).toBe(25);
        });
    });

    describe('pixelsToUnit', () => {
        it('should convert pixels to units correctly', () => {
            expect(pixelsToUnit(100, 10)).toBe(10);
            expect(pixelsToUnit(50, 2)).toBe(25);
        });

        it('should return 0 if scale is 0 to avoid Infinity', () => {
            expect(pixelsToUnit(100, 0)).toBe(0);
        });
        
        it('should return 0 if pixels is 0', () => {
             expect(pixelsToUnit(0, 10)).toBe(0);
        });
    });
});
