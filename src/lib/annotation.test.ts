import { describe, it, expect } from 'vitest';
import { Annotation } from '@/components/types';

/**
 * Create a new annotation with default values
 */
function createAnnotation(overrides: Partial<Annotation> = {}): Annotation {
    return {
        id: Math.random().toString(36).substr(2, 9),
        text: 'New text',
        x: 100,
        y: 100,
        fontSize: 14,
        color: '#1e293b',
        backgroundColor: null,
        rotation: 0,
        ...overrides
    };
}

/**
 * Validate annotation has required properties
 */
function isValidAnnotation(annotation: Annotation): boolean {
    return (
        typeof annotation.id === 'string' &&
        annotation.id.length > 0 &&
        typeof annotation.text === 'string' &&
        typeof annotation.x === 'number' &&
        typeof annotation.y === 'number' &&
        typeof annotation.fontSize === 'number' &&
        annotation.fontSize > 0 &&
        typeof annotation.color === 'string' &&
        (annotation.backgroundColor === null || typeof annotation.backgroundColor === 'string') &&
        typeof annotation.rotation === 'number'
    );
}

/**
 * Normalize annotation rotation to 0-359 range
 */
function normalizeRotation(deg: number): number {
    return ((deg % 360) + 360) % 360;
}

describe('annotation utils', () => {
    describe('createAnnotation', () => {
        it('should create annotation with default values', () => {
            const annotation = createAnnotation();
            expect(annotation.text).toBe('New text');
            expect(annotation.fontSize).toBe(14);
            expect(annotation.color).toBe('#1e293b');
            expect(annotation.backgroundColor).toBeNull();
            expect(annotation.rotation).toBe(0);
        });

        it('should create annotation with custom text', () => {
            const annotation = createAnnotation({ text: 'Living Room' });
            expect(annotation.text).toBe('Living Room');
        });

        it('should create annotation with custom position', () => {
            const annotation = createAnnotation({ x: 200, y: 300 });
            expect(annotation.x).toBe(200);
            expect(annotation.y).toBe(300);
        });

        it('should create annotation with custom font size', () => {
            const annotation = createAnnotation({ fontSize: 24 });
            expect(annotation.fontSize).toBe(24);
        });

        it('should create annotation with background color', () => {
            const annotation = createAnnotation({ backgroundColor: '#ffffff' });
            expect(annotation.backgroundColor).toBe('#ffffff');
        });

        it('should generate unique IDs', () => {
            const annotation1 = createAnnotation();
            const annotation2 = createAnnotation();
            expect(annotation1.id).not.toBe(annotation2.id);
        });
    });

    describe('isValidAnnotation', () => {
        it('should return true for valid annotation', () => {
            const annotation = createAnnotation();
            expect(isValidAnnotation(annotation)).toBe(true);
        });

        it('should return true for annotation with background color', () => {
            const annotation = createAnnotation({ backgroundColor: '#ffcc00' });
            expect(isValidAnnotation(annotation)).toBe(true);
        });

        it('should return true for annotation with rotation', () => {
            const annotation = createAnnotation({ rotation: 45 });
            expect(isValidAnnotation(annotation)).toBe(true);
        });
    });

    describe('annotation rotation', () => {
        it('should normalize positive rotation values', () => {
            expect(normalizeRotation(45)).toBe(45);
            expect(normalizeRotation(90)).toBe(90);
            expect(normalizeRotation(360)).toBe(0);
            expect(normalizeRotation(450)).toBe(90);
        });

        it('should normalize negative rotation values', () => {
            expect(normalizeRotation(-45)).toBe(315);
            expect(normalizeRotation(-90)).toBe(270);
            expect(normalizeRotation(-180)).toBe(180);
        });

        it('should handle zero rotation', () => {
            expect(normalizeRotation(0)).toBe(0);
        });
    });

    describe('annotation text handling', () => {
        it('should handle empty text', () => {
            const annotation = createAnnotation({ text: '' });
            expect(annotation.text).toBe('');
            expect(isValidAnnotation(annotation)).toBe(true);
        });

        it('should handle multi-line text', () => {
            const annotation = createAnnotation({ text: 'Line 1\nLine 2\nLine 3' });
            expect(annotation.text).toContain('\n');
            expect(annotation.text.split('\n').length).toBe(3);
        });

        it('should handle special characters', () => {
            const annotation = createAnnotation({ text: 'Room #1 - 25m\u00B2' });
            expect(annotation.text).toBe('Room #1 - 25m\u00B2');
        });
    });

    describe('annotation color handling', () => {
        it('should accept hex color values', () => {
            const annotation = createAnnotation({ color: '#ff0000' });
            expect(annotation.color).toBe('#ff0000');
        });

        it('should accept background color', () => {
            const annotation = createAnnotation({ backgroundColor: '#ffffff' });
            expect(annotation.backgroundColor).toBe('#ffffff');
        });

        it('should allow null background for transparent', () => {
            const annotation = createAnnotation({ backgroundColor: null });
            expect(annotation.backgroundColor).toBeNull();
        });
    });

    describe('annotation font sizes', () => {
        const validFontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32];
        
        it.each(validFontSizes)('should accept font size %d', (size) => {
            const annotation = createAnnotation({ fontSize: size });
            expect(annotation.fontSize).toBe(size);
            expect(isValidAnnotation(annotation)).toBe(true);
        });
    });
});
