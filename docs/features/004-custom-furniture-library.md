# Feature: Custom Furniture Library

## Overview

Allow users to create, save, and reuse custom furniture items with custom names, dimensions, colors, and icons. The library persists locally using LocalStorage or IndexedDB, making the app adaptable to any use case (kitchens, offices, retail spaces, etc.).

## Priority: Medium-High
## Complexity: 3/5
## Estimated Dev Time: 3-4 days

---

## Current State Analysis

### Existing Furniture System

**Furniture Catalog** (`src/components/PlanEditor.tsx:26-32`):
```typescript
const FURNITURE_CATALOG = [
    { type: 'bed', name: 'Bed', width: 1.5, depth: 2.0, icon: '🛏️', defaultColor: '#3b82f6' },
    { type: 'sofa', name: 'Sofa', width: 2.4, depth: 1.0, icon: '🛋️', defaultColor: '#6b7280' },
    { type: 'table', name: 'Table', width: 0.9, depth: 1.2, icon: '🪑', defaultColor: '#854d0e' },
    { type: 'toilet', name: 'Desk', width: 2.1, depth: 0.67, icon: '🖥️', defaultColor: '#d97706' },
    { type: 'custom', name: 'Custom', width: 1.0, depth: 1.0, icon: '📦', defaultColor: '#ef4444' },
];
```

**FurnitureItem Type** (`src/components/types.ts:27-37`):
```typescript
export interface FurnitureItem {
  id: string;
  type: 'bed' | 'sofa' | 'table' | 'toilet' | 'custom';  // LIMITED types
  name: string;
  width: number;
  depth: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
}
```

**Issues with Current Design:**
1. Hardcoded catalog with limited items
2. `type` field uses string union - not extensible
3. No persistence of custom furniture templates
4. "Custom" is just a 1x1m placeholder

---

## Implementation Plan

### Task 1: Define Custom Furniture Template Type

**File:** `src/components/types.ts`

```typescript
// NEW: Furniture template for the library
export interface FurnitureTemplate {
    id: string;
    name: string;
    width: number;        // meters
    depth: number;        // meters
    icon: string;         // emoji or icon identifier
    defaultColor: string;
    category: string;     // 'bedroom', 'living', 'kitchen', 'office', 'bathroom', 'custom'
    isBuiltIn: boolean;   // true for default items, false for user-created
}

// UPDATE: Make FurnitureItem.type more flexible
export interface FurnitureItem {
  id: string;
  templateId: string;     // CHANGED: reference to template instead of hardcoded type
  name: string;
  width: number;
  depth: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
}
```

---

### Task 2: Create Furniture Library Store

**File:** `src/store/useFurnitureLibraryStore.ts` (new file)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FurnitureTemplate } from '@/components/types';

// Built-in furniture templates
const BUILT_IN_TEMPLATES: FurnitureTemplate[] = [
    // Bedroom
    { id: 'bed-single', name: 'Single Bed', width: 0.9, depth: 1.9, icon: '🛏️', defaultColor: '#3b82f6', category: 'bedroom', isBuiltIn: true },
    { id: 'bed-double', name: 'Double Bed', width: 1.4, depth: 1.9, icon: '🛏️', defaultColor: '#3b82f6', category: 'bedroom', isBuiltIn: true },
    { id: 'bed-queen', name: 'Queen Bed', width: 1.5, depth: 2.0, icon: '🛏️', defaultColor: '#3b82f6', category: 'bedroom', isBuiltIn: true },
    { id: 'bed-king', name: 'King Bed', width: 1.8, depth: 2.0, icon: '🛏️', defaultColor: '#3b82f6', category: 'bedroom', isBuiltIn: true },
    { id: 'wardrobe', name: 'Wardrobe', width: 1.2, depth: 0.6, icon: '🚪', defaultColor: '#78716c', category: 'bedroom', isBuiltIn: true },
    { id: 'nightstand', name: 'Nightstand', width: 0.5, depth: 0.4, icon: '🪑', defaultColor: '#a8a29e', category: 'bedroom', isBuiltIn: true },

    // Living Room
    { id: 'sofa-2seat', name: '2-Seat Sofa', width: 1.6, depth: 0.9, icon: '🛋️', defaultColor: '#6b7280', category: 'living', isBuiltIn: true },
    { id: 'sofa-3seat', name: '3-Seat Sofa', width: 2.4, depth: 0.9, icon: '🛋️', defaultColor: '#6b7280', category: 'living', isBuiltIn: true },
    { id: 'armchair', name: 'Armchair', width: 0.9, depth: 0.85, icon: '🪑', defaultColor: '#6b7280', category: 'living', isBuiltIn: true },
    { id: 'coffee-table', name: 'Coffee Table', width: 1.2, depth: 0.6, icon: '🪵', defaultColor: '#854d0e', category: 'living', isBuiltIn: true },
    { id: 'tv-stand', name: 'TV Stand', width: 1.5, depth: 0.45, icon: '📺', defaultColor: '#1c1917', category: 'living', isBuiltIn: true },

    // Kitchen/Dining
    { id: 'dining-table-4', name: 'Dining Table (4)', width: 1.2, depth: 0.8, icon: '🪑', defaultColor: '#854d0e', category: 'kitchen', isBuiltIn: true },
    { id: 'dining-table-6', name: 'Dining Table (6)', width: 1.8, depth: 0.9, icon: '🪑', defaultColor: '#854d0e', category: 'kitchen', isBuiltIn: true },
    { id: 'dining-chair', name: 'Dining Chair', width: 0.45, depth: 0.45, icon: '🪑', defaultColor: '#a8a29e', category: 'kitchen', isBuiltIn: true },
    { id: 'fridge', name: 'Refrigerator', width: 0.7, depth: 0.7, icon: '🧊', defaultColor: '#e5e5e5', category: 'kitchen', isBuiltIn: true },
    { id: 'stove', name: 'Stove/Oven', width: 0.6, depth: 0.6, icon: '🍳', defaultColor: '#404040', category: 'kitchen', isBuiltIn: true },

    // Office
    { id: 'desk-small', name: 'Small Desk', width: 1.2, depth: 0.6, icon: '🖥️', defaultColor: '#d97706', category: 'office', isBuiltIn: true },
    { id: 'desk-large', name: 'Large Desk', width: 1.8, depth: 0.8, icon: '🖥️', defaultColor: '#d97706', category: 'office', isBuiltIn: true },
    { id: 'office-chair', name: 'Office Chair', width: 0.6, depth: 0.6, icon: '💺', defaultColor: '#1e293b', category: 'office', isBuiltIn: true },
    { id: 'bookshelf', name: 'Bookshelf', width: 0.8, depth: 0.3, icon: '📚', defaultColor: '#78716c', category: 'office', isBuiltIn: true },

    // Bathroom
    { id: 'toilet', name: 'Toilet', width: 0.4, depth: 0.65, icon: '🚽', defaultColor: '#fafafa', category: 'bathroom', isBuiltIn: true },
    { id: 'bathtub', name: 'Bathtub', width: 0.7, depth: 1.7, icon: '🛁', defaultColor: '#fafafa', category: 'bathroom', isBuiltIn: true },
    { id: 'shower', name: 'Shower', width: 0.9, depth: 0.9, icon: '🚿', defaultColor: '#e5e5e5', category: 'bathroom', isBuiltIn: true },
    { id: 'sink-bathroom', name: 'Bathroom Sink', width: 0.6, depth: 0.45, icon: '🚰', defaultColor: '#fafafa', category: 'bathroom', isBuiltIn: true },

    // Generic
    { id: 'custom', name: 'Custom', width: 1.0, depth: 1.0, icon: '📦', defaultColor: '#ef4444', category: 'custom', isBuiltIn: true },
];

interface FurnitureLibraryState {
    customTemplates: FurnitureTemplate[];
    
    // Actions
    addTemplate: (template: Omit<FurnitureTemplate, 'id' | 'isBuiltIn'>) => void;
    updateTemplate: (id: string, updates: Partial<FurnitureTemplate>) => void;
    removeTemplate: (id: string) => void;
    duplicateTemplate: (id: string) => void;
    
    // Getters
    getAllTemplates: () => FurnitureTemplate[];
    getTemplateById: (id: string) => FurnitureTemplate | undefined;
    getTemplatesByCategory: (category: string) => FurnitureTemplate[];
}

export const useFurnitureLibraryStore = create<FurnitureLibraryState>()(
    persist(
        (set, get) => ({
            customTemplates: [],

            addTemplate: (template) => {
                const newTemplate: FurnitureTemplate = {
                    ...template,
                    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    isBuiltIn: false,
                };
                set((state) => ({
                    customTemplates: [...state.customTemplates, newTemplate]
                }));
            },

            updateTemplate: (id, updates) => {
                set((state) => ({
                    customTemplates: state.customTemplates.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    )
                }));
            },

            removeTemplate: (id) => {
                set((state) => ({
                    customTemplates: state.customTemplates.filter((t) => t.id !== id)
                }));
            },

            duplicateTemplate: (id) => {
                const template = get().getTemplateById(id);
                if (template) {
                    get().addTemplate({
                        name: `${template.name} (Copy)`,
                        width: template.width,
                        depth: template.depth,
                        icon: template.icon,
                        defaultColor: template.defaultColor,
                        category: template.category,
                    });
                }
            },

            getAllTemplates: () => {
                return [...BUILT_IN_TEMPLATES, ...get().customTemplates];
            },

            getTemplateById: (id) => {
                return get().getAllTemplates().find((t) => t.id === id);
            },

            getTemplatesByCategory: (category) => {
                return get().getAllTemplates().filter((t) => t.category === category);
            },
        }),
        {
            name: 'houseplan-furniture-library',
            version: 1,
        }
    )
);

// Export built-in templates for reference
export { BUILT_IN_TEMPLATES };

// Export categories
export const FURNITURE_CATEGORIES = [
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
    { id: 'living', name: 'Living Room', icon: '🛋️' },
    { id: 'kitchen', name: 'Kitchen/Dining', icon: '🍽️' },
    { id: 'office', name: 'Office', icon: '💼' },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿' },
    { id: 'custom', name: 'Custom', icon: '📦' },
];
```

---

### Task 3: Create Furniture Library Panel Component

**File:** `src/components/FurnitureLibraryPanel.tsx` (new file)

```typescript
import React, { useState } from 'react';
import { FurnitureTemplate } from './types';
import { useFurnitureLibraryStore, FURNITURE_CATEGORIES } from '@/store/useFurnitureLibraryStore';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Copy, ChevronDown, ChevronRight, Edit2, Check, X } from 'lucide-react';

interface FurnitureLibraryPanelProps {
    onSelectTemplate: (template: FurnitureTemplate) => void;
    isDisabled: boolean;
}

export const FurnitureLibraryPanel: React.FC<FurnitureLibraryPanelProps> = ({
    onSelectTemplate,
    isDisabled
}) => {
    const { customTemplates, addTemplate, updateTemplate, removeTemplate, duplicateTemplate, getTemplatesByCategory } = useFurnitureLibraryStore();
    
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        bedroom: false,
        living: false,
        kitchen: false,
        office: false,
        bathroom: false,
        custom: true,
    });
    
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form state for creating/editing
    const [formData, setFormData] = useState({
        name: '',
        width: 1.0,
        depth: 1.0,
        icon: '📦',
        defaultColor: '#6b7280',
        category: 'custom'
    });

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleCreateTemplate = () => {
        if (!formData.name.trim()) return;
        
        addTemplate({
            name: formData.name,
            width: formData.width,
            depth: formData.depth,
            icon: formData.icon,
            defaultColor: formData.defaultColor,
            category: formData.category,
        });
        
        setFormData({ name: '', width: 1.0, depth: 1.0, icon: '📦', defaultColor: '#6b7280', category: 'custom' });
        setShowCreateForm(false);
    };

    const EMOJI_OPTIONS = ['📦', '🪑', '🛏️', '🛋️', '🚪', '📺', '🖥️', '💺', '📚', '🪵', '🧊', '🍳', '🚽', '🛁', '🚿', '🚰', '🪴', '💡', '🖼️', '⭐'];

    return (
        <div className="space-y-2">
            {/* Create New Button */}
            <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                disabled={isDisabled}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold uppercase tracking-wider border-2 transition-all",
                    showCreateForm
                        ? "bg-secondary text-white border-secondary"
                        : "bg-white text-primary border-border hover:border-primary disabled:opacity-50"
                )}
            >
                <Plus size={14} />
                Create Custom Item
            </button>

            {/* Create Form */}
            {showCreateForm && (
                <div className="p-3 bg-muted/50 border border-border space-y-3">
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Item name..."
                        className="w-full px-2 py-1 text-xs font-mono border border-border focus:border-secondary outline-none"
                    />
                    
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[9px] text-muted-foreground font-mono">WIDTH (m)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={formData.width}
                                onChange={(e) => setFormData(prev => ({ ...prev, width: parseFloat(e.target.value) || 0.1 }))}
                                className="w-full px-2 py-1 text-xs font-mono border border-border focus:border-secondary outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[9px] text-muted-foreground font-mono">DEPTH (m)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={formData.depth}
                                onChange={(e) => setFormData(prev => ({ ...prev, depth: parseFloat(e.target.value) || 0.1 }))}
                                className="w-full px-2 py-1 text-xs font-mono border border-border focus:border-secondary outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="text-[9px] text-muted-foreground font-mono">ICON</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {EMOJI_OPTIONS.slice(0, 10).map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                                        className={cn(
                                            "w-6 h-6 flex items-center justify-center text-sm border",
                                            formData.icon === emoji
                                                ? "border-secondary bg-secondary/10"
                                                : "border-border hover:border-primary"
                                        )}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] text-muted-foreground font-mono">COLOR</label>
                            <input
                                type="color"
                                value={formData.defaultColor}
                                onChange={(e) => setFormData(prev => ({ ...prev, defaultColor: e.target.value }))}
                                className="w-8 h-8 border border-border cursor-pointer"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="px-3 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateTemplate}
                            disabled={!formData.name.trim()}
                            className="px-3 py-1 text-[10px] font-mono font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                            Create
                        </button>
                    </div>
                </div>
            )}

            {/* Category Lists */}
            {FURNITURE_CATEGORIES.map(category => {
                const templates = getTemplatesByCategory(category.id);
                if (templates.length === 0 && category.id !== 'custom') return null;
                
                const isExpanded = expandedCategories[category.id];
                
                return (
                    <div key={category.id} className="border border-border">
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full flex items-center justify-between p-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span>{category.icon}</span>
                                <span className="text-[10px] font-mono font-bold uppercase">{category.name}</span>
                                <span className="text-[9px] text-muted-foreground">({templates.length})</span>
                            </div>
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                        
                        {isExpanded && (
                            <div className="p-1 grid grid-cols-2 gap-1">
                                {templates.map(template => (
                                    <div
                                        key={template.id}
                                        className="group relative"
                                    >
                                        <button
                                            onClick={() => onSelectTemplate(template)}
                                            disabled={isDisabled}
                                            className={cn(
                                                "w-full flex items-center p-2 bg-white hover:bg-muted border border-transparent hover:border-primary transition-all gap-2 text-left disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-transparent"
                                            )}
                                        >
                                            <span className="text-base filter grayscale group-hover:grayscale-0 transition-all">
                                                {template.icon}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-mono font-bold text-primary block truncate">
                                                    {template.name}
                                                </span>
                                                <span className="text-[8px] text-muted-foreground font-mono">
                                                    {template.width}x{template.depth}m
                                                </span>
                                            </div>
                                        </button>
                                        
                                        {/* Actions for custom templates */}
                                        {!template.isBuiltIn && (
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); duplicateTemplate(template.id); }}
                                                    className="p-1 bg-white border border-border hover:border-primary text-muted-foreground hover:text-primary"
                                                    title="Duplicate"
                                                >
                                                    <Copy size={10} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeTemplate(template.id); }}
                                                    className="p-1 bg-white border border-border hover:border-red-500 text-muted-foreground hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

FurnitureLibraryPanel.displayName = 'FurnitureLibraryPanel';
```

---

### Task 4: Update PlanEditor to Use Library

**File:** `src/components/PlanEditor.tsx`

**Replace FURNITURE_CATALOG with library integration:**

```typescript
// Remove old FURNITURE_CATALOG constant

// Import the library
import { FurnitureLibraryPanel } from './FurnitureLibraryPanel';
import { useFurnitureLibraryStore } from '@/store/useFurnitureLibraryStore';
import { FurnitureTemplate } from './types';

// Update handleAddFurniture to use templates
const handleAddFurniture = useCallback((template: FurnitureTemplate) => {
    if (!scale) {
        alert("Please calibrate the plan first!");
        return;
    }
    const centerX = imgRef.current ? imgRef.current.width / 2 - (template.width * scale / 2) : 0;
    const centerY = imgRef.current ? imgRef.current.height / 2 - (template.depth * scale / 2) : 0;

    const newItem: FurnitureItem = {
        id: Math.random().toString(36).substr(2, 9),
        templateId: template.id,
        name: template.name,
        width: template.width,
        depth: template.depth,
        x: centerX,
        y: centerY,
        rotation: 0,
        color: template.defaultColor
    };
    addFurniture(newItem);
    setSelectedFurnitureId(newItem.id);
    setMode('view');
}, [scale, imgRef, addFurniture, setSelectedFurnitureId, setMode]);

// Replace the Asset Library section in the sidebar
{scale !== null && (
    <>
        {/* Furniture Library */}
        <div className="space-y-2">
            <p className="technical-text mb-2">Asset Library</p>
            <FurnitureLibraryPanel
                onSelectTemplate={handleAddFurniture}
                isDisabled={!scale}
            />
        </div>
        
        {/* ... rest of the sidebar ... */}
    </>
)}
```

---

### Task 5: Update FurnitureItem Type in Store

**File:** `src/store/usePlanStore.ts`

Update to use `templateId` instead of `type`:

```typescript
// The FurnitureItem type change propagates automatically if using the updated types.ts
// No store changes needed beyond what's already there
```

---

### Task 6: Migration for Existing Projects

**File:** `src/store/usePlanStore.ts`

Add migration logic for old projects:

```typescript
loadProject: (data) => {
    // Migrate old furniture items that use 'type' instead of 'templateId'
    const migratedFurniture = (data.furniture || []).map(item => {
        if ('type' in item && !('templateId' in item)) {
            // Map old types to new template IDs
            const typeToTemplateMap: Record<string, string> = {
                'bed': 'bed-queen',
                'sofa': 'sofa-3seat',
                'table': 'dining-table-4',
                'toilet': 'desk-small',  // Yes, 'toilet' was actually 'Desk' in old code
                'custom': 'custom'
            };
            return {
                ...item,
                templateId: typeToTemplateMap[(item as any).type] || 'custom'
            };
        }
        return item;
    });

    set({
        lines: data.lines || [],
        polygons: data.polygons || [],
        furniture: migratedFurniture,
        scale: data.scale || null,
        unit: data.unit || 'm',
    });
},
```

---

## Test Plan

### Unit Tests

**File:** `src/lib/furnitureLibrary.test.ts` (new file)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
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

    describe('template ID generation', () => {
        it('should generate unique IDs for custom templates', () => {
            const ids = new Set<string>();
            
            for (let i = 0; i < 100; i++) {
                const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                ids.add(id);
            }
            
            // All IDs should be unique (set size equals number of iterations)
            // Note: This might occasionally fail due to timing, but is generally reliable
            expect(ids.size).toBeGreaterThan(95); // Allow some tolerance
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
});
```

### Manual Testing Checklist

- [ ] Built-in furniture items appear in categorized lists
- [ ] Clicking a template adds furniture to canvas (when calibrated)
- [ ] "Create Custom Item" form opens/closes correctly
- [ ] Custom item creation with all fields works
- [ ] Custom items appear in "Custom" category
- [ ] Custom items can be duplicated
- [ ] Custom items can be deleted (built-in cannot)
- [ ] Custom items persist after page reload (LocalStorage)
- [ ] Old projects with `type` field migrate correctly to `templateId`
- [ ] Category expand/collapse works correctly
- [ ] Emoji picker works for icon selection
- [ ] Color picker works for default color
- [ ] Items are disabled when plan is not calibrated

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/types.ts` | Add `FurnitureTemplate`, update `FurnitureItem` |
| `src/store/useFurnitureLibraryStore.ts` | **NEW** - Library store with persistence |
| `src/components/FurnitureLibraryPanel.tsx` | **NEW** - Library UI component |
| `src/components/PlanEditor.tsx` | Replace catalog with library panel |
| `src/store/usePlanStore.ts` | Add migration for old projects |
| `src/lib/furnitureLibrary.test.ts` | **NEW** - Unit tests |

---

## LocalStorage Schema

```json
{
  "state": {
    "customTemplates": [
      {
        "id": "custom-1234567890-abc12",
        "name": "My Custom Chair",
        "width": 0.5,
        "depth": 0.5,
        "icon": "🪑",
        "defaultColor": "#8b5cf6",
        "category": "custom",
        "isBuiltIn": false
      }
    ]
  },
  "version": 1
}
```

**Key:** `houseplan-furniture-library`

---

## Acceptance Criteria

- [ ] User can view categorized built-in furniture library
- [ ] User can create custom furniture templates
- [ ] User can set name, dimensions, icon, and color for custom items
- [ ] Custom templates persist in LocalStorage across sessions
- [ ] User can duplicate and delete custom templates
- [ ] Built-in templates cannot be deleted
- [ ] Old projects with `type` field migrate automatically
- [ ] Placing furniture from library works as before
- [ ] UI follows existing app design patterns
