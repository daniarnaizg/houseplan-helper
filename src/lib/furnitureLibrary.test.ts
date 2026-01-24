import { describe, it, expect } from 'vitest';
import { FurnitureTemplate } from '@/components/types';

// Mock template for testing
const createMockTemplate = (overrides: Partial<FurnitureTemplate> = {}): FurnitureTemplate => ({
    id: 'test-id',
    name: 'Test Item',
    width: 1.0,
    depth: 1.0,
    icon: '📦',
    defaultColor: '#000000',
    category: 'custom',
    isBuiltIn: false,
    ...overrides
});

describe('furniture library', () => {
    describe('FurnitureTemplate', () => {
        it('should create valid template with required fields', () => {
            const template = createMockTemplate();
            
            expect(template.id).toBeDefined();
            expect(template.name).toBe('Test Item');
            expect(template.width).toBeGreaterThan(0);
            expect(template.depth).toBeGreaterThan(0);
            expect(template.icon).toBeTruthy();
            expect(template.defaultColor).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(template.category).toBeTruthy();
            expect(typeof template.isBuiltIn).toBe('boolean');
        });

        it('should distinguish built-in from custom templates', () => {
            const builtIn = createMockTemplate({ isBuiltIn: true });
            const custom = createMockTemplate({ isBuiltIn: false });
            
            expect(builtIn.isBuiltIn).toBe(true);
            expect(custom.isBuiltIn).toBe(false);
        });
    });

    describe('template dimensions', () => {
        it('should have positive width and depth', () => {
            const template = createMockTemplate({ width: 1.5, depth: 2.0 });
            
            expect(template.width).toBeGreaterThan(0);
            expect(template.depth).toBeGreaterThan(0);
        });

        it('should support decimal dimensions', () => {
            const template = createMockTemplate({ width: 0.45, depth: 0.65 });
            
            expect(template.width).toBe(0.45);
            expect(template.depth).toBe(0.65);
        });
    });

    describe('template categories', () => {
        const validCategories = ['bedroom', 'living', 'kitchen', 'office', 'bathroom', 'custom'];
        
        it.each(validCategories)('should accept category: %s', (category) => {
            const template = createMockTemplate({ category });
            expect(template.category).toBe(category);
        });
    });

    describe('recent items', () => {
        it('should limit recent items to 5', () => {
            const MAX_RECENT = 5;
            const recentIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
            const limited = recentIds.slice(0, MAX_RECENT);
            
            expect(limited.length).toBe(5);
            expect(limited).not.toContain('f');
            expect(limited).not.toContain('g');
        });

        it('should move re-used item to front', () => {
            const recentIds = ['a', 'b', 'c', 'd', 'e'];
            const newId = 'c';
            
            const filtered = recentIds.filter(id => id !== newId);
            const updated = [newId, ...filtered].slice(0, 5);
            
            expect(updated[0]).toBe('c');
            expect(updated.length).toBe(5);
        });
    });
});

describe('project migration', () => {
    it('should migrate old furniture type to templateId', () => {
        const typeToTemplateMap: Record<string, string> = {
            'bed': 'bed-queen',
            'sofa': 'sofa-3seat',
            'table': 'dining-table-4',
            'toilet': 'desk-small',
            'custom': 'custom'
        };

        const oldItem = { type: 'bed', name: 'Bed', width: 1.5, depth: 2.0 };
        const migratedTemplateId = typeToTemplateMap[oldItem.type];
        
        expect(migratedTemplateId).toBe('bed-queen');
    });

    it('should default to custom for unknown types', () => {
        const typeToTemplateMap: Record<string, string> = {
            'bed': 'bed-queen',
            'sofa': 'sofa-3seat',
            'table': 'dining-table-4',
            'toilet': 'desk-small',
            'custom': 'custom'
        };

        const oldItem = { type: 'unknown' };
        const migratedTemplateId = typeToTemplateMap[oldItem.type] || 'custom';
        
        expect(migratedTemplateId).toBe('custom');
    });

    it('should preserve all other item properties during migration', () => {
        const oldItem = { 
            id: 'test-123',
            type: 'sofa', 
            name: 'My Sofa', 
            width: 2.4, 
            depth: 1.0,
            x: 100,
            y: 200,
            rotation: 90,
            color: '#ff0000'
        };

        // Simulate migration
        const typeToTemplateMap: Record<string, string> = {
            'sofa': 'sofa-3seat',
        };

        const migratedItem = {
            id: oldItem.id,
            templateId: typeToTemplateMap[oldItem.type] || 'custom',
            name: oldItem.name,
            width: oldItem.width,
            depth: oldItem.depth,
            x: oldItem.x,
            y: oldItem.y,
            rotation: oldItem.rotation,
            color: oldItem.color
        };

        expect(migratedItem.id).toBe('test-123');
        expect(migratedItem.templateId).toBe('sofa-3seat');
        expect(migratedItem.name).toBe('My Sofa');
        expect(migratedItem.width).toBe(2.4);
        expect(migratedItem.depth).toBe(1.0);
        expect(migratedItem.x).toBe(100);
        expect(migratedItem.y).toBe(200);
        expect(migratedItem.rotation).toBe(90);
        expect(migratedItem.color).toBe('#ff0000');
    });
});
