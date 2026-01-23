import { describe, it, expect } from 'vitest';

/**
 * Gets a "nice" number for scale bar display
 */
function getNiceScaleValue(rawValue: number): number {
    if (rawValue <= 0) return 0;
    
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawValue)));
    const normalized = rawValue / magnitude;
    
    let niceNormalized: number;
    if (normalized < 1.5) {
        niceNormalized = 1;
    } else if (normalized < 3.5) {
        niceNormalized = 2;
    } else if (normalized < 7.5) {
        niceNormalized = 5;
    } else {
        niceNormalized = 10;
    }
    
    return niceNormalized * magnitude;
}

describe('scale bar utils', () => {
    describe('getNiceScaleValue', () => {
        it('should return nice values for small numbers', () => {
            expect(getNiceScaleValue(0.7)).toBe(0.5);
            expect(getNiceScaleValue(1.2)).toBe(1);
            expect(getNiceScaleValue(1.8)).toBe(2);
            expect(getNiceScaleValue(3.5)).toBe(5);
            expect(getNiceScaleValue(8)).toBe(10);
        });

        it('should return nice values for medium numbers', () => {
            expect(getNiceScaleValue(12)).toBe(10);
            expect(getNiceScaleValue(18)).toBe(20);
            expect(getNiceScaleValue(45)).toBe(50);
            expect(getNiceScaleValue(73)).toBe(50); // 7.3 normalized is < 7.5, so rounds to 5
            expect(getNiceScaleValue(76)).toBe(100); // 7.6 normalized is >= 7.5, so rounds to 10
        });

        it('should return nice values for large numbers', () => {
            expect(getNiceScaleValue(120)).toBe(100);
            expect(getNiceScaleValue(350)).toBe(500);
            expect(getNiceScaleValue(800)).toBe(1000);
        });

        it('should return nice values for decimal numbers', () => {
            expect(getNiceScaleValue(0.12)).toBe(0.1);
            expect(getNiceScaleValue(0.035)).toBe(0.05);
            expect(getNiceScaleValue(0.008)).toBe(0.01);
        });

        it('should handle edge cases', () => {
            expect(getNiceScaleValue(0)).toBe(0);
            expect(getNiceScaleValue(1)).toBe(1);
            expect(getNiceScaleValue(10)).toBe(10);
            expect(getNiceScaleValue(100)).toBe(100);
        });

        it('should handle negative values', () => {
            expect(getNiceScaleValue(-10)).toBe(0);
        });
    });

    describe('scale bar calculation', () => {
        it('should calculate bar width correctly', () => {
            const scale = 100; // 100 pixels per meter
            const zoomScale = 1; // no zoom
            const targetBarWidthPx = 120;
            
            const effectiveScale = scale * zoomScale;
            const rawRealUnits = targetBarWidthPx / effectiveScale;
            const niceValue = getNiceScaleValue(rawRealUnits);
            const actualBarWidthPx = niceValue * effectiveScale;
            
            expect(niceValue).toBe(1); // 1.2m rounds to 1m
            expect(actualBarWidthPx).toBe(100); // 1m * 100 px/m = 100px
        });

        it('should adjust for zoom level', () => {
            const scale = 100; // 100 pixels per meter
            const zoomScale = 2; // zoomed in 2x
            const targetBarWidthPx = 120;
            
            const effectiveScale = scale * zoomScale;
            const rawRealUnits = targetBarWidthPx / effectiveScale;
            const niceValue = getNiceScaleValue(rawRealUnits);
            
            expect(niceValue).toBe(0.5); // 0.6m rounds to 0.5m
        });

        it('should handle zoom out', () => {
            const scale = 100; // 100 pixels per meter
            const zoomScale = 0.5; // zoomed out 50%
            const targetBarWidthPx = 120;
            
            const effectiveScale = scale * zoomScale;
            const rawRealUnits = targetBarWidthPx / effectiveScale;
            const niceValue = getNiceScaleValue(rawRealUnits);
            
            expect(niceValue).toBe(2); // 2.4m rounds to 2m
        });
    });
});
