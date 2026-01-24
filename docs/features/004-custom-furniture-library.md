# Feature: Custom Furniture Library

## Overview

Allow users to create, save, and reuse custom furniture items with custom names, dimensions, colors, and icons. The library persists locally using LocalStorage, making the app adaptable to any use case (kitchens, offices, retail spaces, etc.).

**UI Approach:** Hybrid design with quick-access recent items in the sidebar and a full categorized library accessible via modal.

## Priority: Medium-High
## Complexity: 3.5/5
## Estimated Dev Time: 4-5 days

---

## Current State Analysis

### Existing Furniture System

**Furniture Catalog** (`src/components/PlanEditor.tsx:30-36`):
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

## Architecture Decision

### Hybrid UI Approach

Based on review discussion, we're implementing a **hybrid UI**:

| Component | Location | Purpose |
|-----------|----------|---------|
| Recent Items | Sidebar | Quick access to 5 most recently used templates |
| "Open Library" button | Sidebar | Opens full library modal |
| Full Library Modal | Modal/Dialog | Browse all categories, search, create custom items |

**Rationale:**
- Keeps sidebar uncluttered (currently 320px wide)
- Recent items provide fast access for common workflows
- Modal provides space for full library browsing and custom item creation

### Orphaned Items Handling

If a user deletes a custom template that's already placed in a project:
- The placed item **keeps its templateId** (orphaned reference)
- Item still renders correctly (has all needed data: dimensions, color, name)
- Simply won't appear in library for re-use

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

const MAX_RECENT_ITEMS = 5;

interface FurnitureLibraryState {
    customTemplates: FurnitureTemplate[];
    recentTemplateIds: string[];  // Last 5 used template IDs
    
    // Actions
    addTemplate: (template: Omit<FurnitureTemplate, 'id' | 'isBuiltIn'>) => void;
    updateTemplate: (id: string, updates: Partial<FurnitureTemplate>) => void;
    removeTemplate: (id: string) => void;
    duplicateTemplate: (id: string) => void;
    addToRecent: (templateId: string) => void;
    
    // Getters
    getAllTemplates: () => FurnitureTemplate[];
    getTemplateById: (id: string) => FurnitureTemplate | undefined;
    getTemplatesByCategory: (category: string) => FurnitureTemplate[];
    getRecentTemplates: () => FurnitureTemplate[];
}

export const useFurnitureLibraryStore = create<FurnitureLibraryState>()(
    persist(
        (set, get) => ({
            customTemplates: [],
            recentTemplateIds: [],

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
                    customTemplates: state.customTemplates.filter((t) => t.id !== id),
                    // Also remove from recent if present
                    recentTemplateIds: state.recentTemplateIds.filter((rid) => rid !== id)
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

            addToRecent: (templateId) => {
                set((state) => {
                    // Remove if already exists, then add to front
                    const filtered = state.recentTemplateIds.filter((id) => id !== templateId);
                    const updated = [templateId, ...filtered].slice(0, MAX_RECENT_ITEMS);
                    return { recentTemplateIds: updated };
                });
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

            getRecentTemplates: () => {
                const { recentTemplateIds } = get();
                const allTemplates = get().getAllTemplates();
                return recentTemplateIds
                    .map((id) => allTemplates.find((t) => t.id === id))
                    .filter((t): t is FurnitureTemplate => t !== undefined);
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

### Task 3: Create Furniture Library Modal

**File:** `src/components/FurnitureLibraryModal.tsx` (new file)

Full library browser with:
- Category tabs/accordion
- Search functionality
- Custom item creation form
- Edit/duplicate/delete for custom items

```typescript
import React, { useState, useMemo } from 'react';
import { FurnitureTemplate } from './types';
import { useFurnitureLibraryStore, FURNITURE_CATEGORIES } from '@/store/useFurnitureLibraryStore';
import { cn } from '@/lib/utils';
import { X, Plus, Trash2, Copy, Search, ChevronDown, ChevronRight } from 'lucide-react';

interface FurnitureLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: FurnitureTemplate) => void;
}

export const FurnitureLibraryModal: React.FC<FurnitureLibraryModalProps> = ({
    isOpen,
    onClose,
    onSelectTemplate
}) => {
    const { 
        customTemplates, 
        addTemplate, 
        removeTemplate, 
        duplicateTemplate, 
        getTemplatesByCategory,
        addToRecent 
    } = useFurnitureLibraryStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        bedroom: true,
        living: false,
        kitchen: false,
        office: false,
        bathroom: false,
        custom: true,
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    // Form state for creating custom items
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

    const handleSelect = (template: FurnitureTemplate) => {
        addToRecent(template.id);
        onSelectTemplate(template);
        onClose();
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

    // Filter templates by search query
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return null;
        
        const query = searchQuery.toLowerCase();
        const results: FurnitureTemplate[] = [];
        
        FURNITURE_CATEGORIES.forEach(cat => {
            const templates = getTemplatesByCategory(cat.id);
            templates.forEach(t => {
                if (t.name.toLowerCase().includes(query)) {
                    results.push(t);
                }
            });
        });
        
        return results;
    }, [searchQuery, getTemplatesByCategory]);

    const EMOJI_OPTIONS = ['📦', '🪑', '🛏️', '🛋️', '🚪', '📺', '🖥️', '💺', '📚', '🪵', '🧊', '🍳', '🚽', '🛁', '🚿', '🚰', '🪴', '💡', '🖼️', '⭐'];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white w-full max-w-2xl max-h-[80vh] flex flex-col border-2 border-border shadow-[8px_8px_0px_#00000020]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-border">
                    <h2 className="text-sm font-bold uppercase tracking-wider">Furniture Library</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted">
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-border">
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search furniture..."
                            className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-border focus:border-secondary outline-none"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {/* Search Results */}
                    {filteredCategories !== null ? (
                        <div className="space-y-1">
                            <p className="text-[10px] font-mono text-muted-foreground mb-2">
                                {filteredCategories.length} results for "{searchQuery}"
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {filteredCategories.map(template => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        onSelect={handleSelect}
                                        onDuplicate={duplicateTemplate}
                                        onDelete={removeTemplate}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Category Lists */
                        FURNITURE_CATEGORIES.map(category => {
                            const templates = getTemplatesByCategory(category.id);
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
                                        <div className="p-2 grid grid-cols-3 gap-2">
                                            {templates.map(template => (
                                                <TemplateCard
                                                    key={template.id}
                                                    template={template}
                                                    onSelect={handleSelect}
                                                    onDuplicate={duplicateTemplate}
                                                    onDelete={removeTemplate}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer - Create Custom */}
                <div className="p-3 border-t-2 border-border">
                    {!showCreateForm ? (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold uppercase tracking-wider bg-white text-primary border-2 border-border hover:border-primary transition-all"
                        >
                            <Plus size={14} />
                            Create Custom Item
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Item name..."
                                    className="flex-1 px-2 py-1 text-xs font-mono border border-border focus:border-secondary outline-none"
                                />
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="px-2 py-1 text-xs font-mono border border-border focus:border-secondary outline-none"
                                >
                                    {FURNITURE_CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            
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
                                <div>
                                    <label className="text-[9px] text-muted-foreground font-mono">COLOR</label>
                                    <input
                                        type="color"
                                        value={formData.defaultColor}
                                        onChange={(e) => setFormData(prev => ({ ...prev, defaultColor: e.target.value }))}
                                        className="w-full h-[26px] border border-border cursor-pointer"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[9px] text-muted-foreground font-mono">ICON</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                                            className={cn(
                                                "w-7 h-7 flex items-center justify-center text-sm border",
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
                </div>
            </div>
        </div>
    );
};

// Template Card Component
interface TemplateCardProps {
    template: FurnitureTemplate;
    onSelect: (template: FurnitureTemplate) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect, onDuplicate, onDelete }) => {
    return (
        <div className="group relative">
            <button
                onClick={() => onSelect(template)}
                className="w-full flex items-center p-2 bg-white hover:bg-muted border border-border hover:border-primary transition-all gap-2 text-left"
            >
                <span className="text-lg filter grayscale group-hover:grayscale-0 transition-all">
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
                        onClick={(e) => { e.stopPropagation(); onDuplicate(template.id); }}
                        className="p-1 bg-white border border-border hover:border-primary text-muted-foreground hover:text-primary"
                        title="Duplicate"
                    >
                        <Copy size={10} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
                        className="p-1 bg-white border border-border hover:border-red-500 text-muted-foreground hover:text-red-500"
                        title="Delete"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
            )}
        </div>
    );
};

FurnitureLibraryModal.displayName = 'FurnitureLibraryModal';
```

---

### Task 4: Create Quick Access Panel for Sidebar

**File:** `src/components/FurnitureQuickAccess.tsx` (new file)

Compact sidebar component showing recent items + button to open full library.

```typescript
import React from 'react';
import { FurnitureTemplate } from './types';
import { useFurnitureLibraryStore } from '@/store/useFurnitureLibraryStore';
import { cn } from '@/lib/utils';
import { Library } from 'lucide-react';

interface FurnitureQuickAccessProps {
    onSelectTemplate: (template: FurnitureTemplate) => void;
    onOpenLibrary: () => void;
    isDisabled: boolean;
}

export const FurnitureQuickAccess: React.FC<FurnitureQuickAccessProps> = ({
    onSelectTemplate,
    onOpenLibrary,
    isDisabled
}) => {
    const { getRecentTemplates, addToRecent } = useFurnitureLibraryStore();
    const recentTemplates = getRecentTemplates();

    const handleSelect = (template: FurnitureTemplate) => {
        addToRecent(template.id);
        onSelectTemplate(template);
    };

    return (
        <div className="space-y-2">
            {/* Recent Items */}
            {recentTemplates.length > 0 && (
                <div className="space-y-1">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Recent</p>
                    <div className="grid grid-cols-2 gap-1">
                        {recentTemplates.map(template => (
                            <button
                                key={template.id}
                                onClick={() => handleSelect(template)}
                                disabled={isDisabled}
                                className={cn(
                                    "flex items-center p-2 bg-white hover:bg-muted border border-border hover:border-primary transition-colors gap-2 group disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-border"
                                )}
                            >
                                <span className="text-base filter grayscale group-hover:grayscale-0 transition-all">
                                    {template.icon}
                                </span>
                                <div className="flex-1 min-w-0 text-left">
                                    <span className="text-[10px] font-mono font-bold text-primary block truncate">
                                        {template.name}
                                    </span>
                                    <span className="text-[8px] text-muted-foreground font-mono">
                                        {template.width}x{template.depth}m
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Open Library Button */}
            <button
                onClick={onOpenLibrary}
                disabled={isDisabled}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold uppercase tracking-wider border-2 transition-all",
                    "bg-white text-primary border-border hover:border-primary hover:bg-muted disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-border"
                )}
            >
                <Library size={14} />
                {recentTemplates.length > 0 ? 'Browse All Furniture' : 'Open Furniture Library'}
            </button>
        </div>
    );
};

FurnitureQuickAccess.displayName = 'FurnitureQuickAccess';
```

---

### Task 5: Update PlanEditor to Use Library

**File:** `src/components/PlanEditor.tsx`

**Changes:**

1. Remove `FURNITURE_CATALOG` constant
2. Import new components and store
3. Add modal state
4. Update `handleAddFurniture` to use templates
5. Replace Asset Library section with quick access + modal

```typescript
// Remove old FURNITURE_CATALOG constant

// Add imports
import { FurnitureQuickAccess } from './FurnitureQuickAccess';
import { FurnitureLibraryModal } from './FurnitureLibraryModal';
import { useFurnitureLibraryStore } from '@/store/useFurnitureLibraryStore';
import { FurnitureTemplate } from './types';

// Add modal state
const [isLibraryOpen, setIsLibraryOpen] = useState(false);

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
            <FurnitureQuickAccess
                onSelectTemplate={handleAddFurniture}
                onOpenLibrary={() => setIsLibraryOpen(true)}
                isDisabled={!scale}
            />
        </div>
        
        {/* ... rest of the sidebar ... */}
    </>
)}

// Add modal at the end of component (before closing fragment)
<FurnitureLibraryModal
    isOpen={isLibraryOpen}
    onClose={() => setIsLibraryOpen(false)}
    onSelectTemplate={handleAddFurniture}
/>
```

---

### Task 6: Migration for Existing Projects

**File:** `src/store/usePlanStore.ts`

Add migration logic for old projects that use `type` instead of `templateId`:

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
                'toilet': 'desk-small',  // Note: 'toilet' type was actually 'Desk' in old code
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
        annotations: data.annotations || [],
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
});
```

### Manual Testing Checklist

- [ ] **Recent Items**
  - [ ] First use shows empty recent, only "Open Furniture Library" button
  - [ ] After placing item, it appears in recent
  - [ ] Recent items limited to 5
  - [ ] Re-using item moves it to front of recent

- [ ] **Library Modal**
  - [ ] Modal opens from sidebar button
  - [ ] All categories expand/collapse correctly
  - [ ] Search filters items across all categories
  - [ ] Clicking item places furniture and closes modal

- [ ] **Custom Items**
  - [ ] Create form opens in modal footer
  - [ ] All fields work: name, dimensions, icon, color, category
  - [ ] Custom items appear in their chosen category
  - [ ] Custom items can be duplicated
  - [ ] Custom items can be deleted (built-in cannot)
  - [ ] Custom items persist after page reload

- [ ] **Migration**
  - [ ] Old projects with `type` field load correctly
  - [ ] Furniture items have correct templateId after load

- [ ] **Edge Cases**
  - [ ] Items disabled when plan not calibrated
  - [ ] Orphaned items (deleted template) still render
  - [ ] Empty search shows no results message

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/types.ts` | Modify | Add `FurnitureTemplate`, update `FurnitureItem` |
| `src/store/useFurnitureLibraryStore.ts` | **Create** | Library store with persistence + recent items |
| `src/components/FurnitureLibraryModal.tsx` | **Create** | Full library modal with categories + create form |
| `src/components/FurnitureQuickAccess.tsx` | **Create** | Sidebar recent items + open library button |
| `src/components/PlanEditor.tsx` | Modify | Replace catalog with quick access + modal |
| `src/store/usePlanStore.ts` | Modify | Add migration for old projects |
| `src/lib/furnitureLibrary.test.ts` | **Create** | Unit tests |

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
    ],
    "recentTemplateIds": ["bed-queen", "custom-1234567890-abc12", "sofa-3seat"]
  },
  "version": 1
}
```

**Key:** `houseplan-furniture-library`

---

## Acceptance Criteria

- [ ] User can view recent items in sidebar for quick access
- [ ] User can open full library modal from sidebar
- [ ] Library modal shows categorized built-in furniture
- [ ] User can search furniture by name
- [ ] User can create custom furniture templates in modal
- [ ] User can set name, dimensions, icon, color, and category for custom items
- [ ] Custom templates persist in LocalStorage across sessions
- [ ] User can duplicate and delete custom templates
- [ ] Built-in templates cannot be deleted
- [ ] Old projects with `type` field migrate automatically to `templateId`
- [ ] Placing furniture from library works as before
- [ ] Orphaned items (template deleted) still render correctly
- [ ] UI follows existing app design patterns
