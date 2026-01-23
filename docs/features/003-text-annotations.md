# Feature: Text Annotations & Notes

## Overview

Allow users to add text labels, notes, and callouts directly on the floor plan. Examples include room names ("Living Room"), instructions ("Install outlet here"), or any freeform text.

## Priority: High
## Complexity: 3/5
## Estimated Dev Time: 3-4 days

---

## Current State Analysis

### Existing Patterns

**Data Types** (`src/components/types.ts`):
- `Line` and `Polygon` have similar structure: `id`, `name`, `color`, position data
- All items have a `name` property for display

**Store Pattern** (`src/store/usePlanStore.ts`):
- CRUD operations follow pattern: `add[Type]`, `update[Type]`, `remove[Type]`
- Items are arrays in state
- Temporal (undo/redo) middleware wraps the store

**Rendering:**
- `PlanLayer.tsx` renders SVG overlays for lines and polygons
- Each layer type has its own visibility toggle

**Mode System:**
- `Mode` type: `'view' | 'calibrate' | 'measure' | 'area'`
- Mode determines cursor behavior and interaction

---

## Implementation Plan

### Task 1: Define Annotation Type

**File:** `src/components/types.ts`

```typescript
export type Mode = 'view' | 'calibrate' | 'measure' | 'area' | 'annotate';  // ADD 'annotate'

// NEW TYPE
export interface Annotation {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;      // in pixels (default: 14)
    color: string;
    backgroundColor: string | null;  // null = transparent
    rotation: number;      // degrees (default: 0)
}

// UPDATE ProjectData
export interface ProjectData {
    lines: Line[];
    polygons: Polygon[];
    furniture: FurnitureItem[];
    annotations: Annotation[];  // NEW
    scale: number | null;
    unit: string;
}
```

---

### Task 2: Add Annotations to Store

**File:** `src/store/usePlanStore.ts`

**State Addition:**
```typescript
interface PlanState {
    // ... existing state
    annotations: Annotation[];
    
    // ... existing actions
    
    // Annotation Actions
    addAnnotation: (annotation: Annotation) => void;
    updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
    removeAnnotation: (id: string) => void;
    setAnnotations: (annotations: Annotation[]) => void;
}
```

**Implementation:**
```typescript
export const usePlanStore = create<PlanState>()(
    temporal(
        (set) => ({
            // ... existing state
            annotations: [],

            // ... existing actions

            // Annotation Actions
            setAnnotations: (annotations) => set({ annotations }),
            addAnnotation: (annotation) => set((state) => ({ 
                annotations: [...state.annotations, annotation] 
            })),
            updateAnnotation: (id, updates) => set((state) => ({
                annotations: state.annotations.map((a) => 
                    a.id === id ? { ...a, ...updates } : a
                ),
            })),
            removeAnnotation: (id) => set((state) => ({ 
                annotations: state.annotations.filter((a) => a.id !== id) 
            })),

            // UPDATE loadProject
            loadProject: (data) => set({
                lines: data.lines || [],
                polygons: data.polygons || [],
                furniture: data.furniture || [],
                annotations: data.annotations || [],  // NEW
                scale: data.scale || null,
                unit: data.unit || 'm',
            }),
            
            // UPDATE reset
            reset: () => set({
                lines: [],
                polygons: [],
                furniture: [],
                annotations: [],  // NEW
                scale: null,
                unit: 'm',
                mode: 'view',
                selectedFurnitureId: null
            })
        }),
        {
            partialize: (state) => {
                const { lines, polygons, furniture, annotations, scale, unit } = state;
                return { lines, polygons, furniture, annotations, scale, unit };
            },
            limit: 100
        }
    )
);
```

---

### Task 3: Create AnnotationLayer Component

**File:** `src/components/AnnotationLayer.tsx` (new file)

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Annotation } from './types';
import { cn } from '@/lib/utils';

interface AnnotationLayerProps {
    annotations: Annotation[];
    isVisible: boolean;
    selectedId: string | null;
    hoveredId: string | null;
    onSelect: (id: string | null) => void;
    onHover: (id: string | null) => void;
    onUpdate: (id: string, updates: Partial<Annotation>) => void;
    onDelete: (id: string) => void;
    zoomScale: number;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
    annotations,
    isVisible,
    selectedId,
    hoveredId,
    onSelect,
    onHover,
    onUpdate,
    onDelete,
    zoomScale
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    if (!isVisible) return null;

    const handleDoubleClick = (id: string) => {
        setEditingId(id);
    };

    const handleBlur = (id: string, text: string) => {
        onUpdate(id, { text });
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string, text: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBlur(id, text);
        }
        if (e.key === 'Escape') {
            setEditingId(null);
        }
        if (e.key === 'Delete' && !editingId) {
            onDelete(id);
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
            {annotations.map((annotation) => {
                const isSelected = selectedId === annotation.id;
                const isHovered = hoveredId === annotation.id;
                const isEditing = editingId === annotation.id;

                return (
                    <div
                        key={annotation.id}
                        className={cn(
                            "absolute pointer-events-auto cursor-move transition-all",
                            isSelected && "ring-2 ring-secondary ring-offset-1",
                            isHovered && !isSelected && "ring-1 ring-secondary/50"
                        )}
                        style={{
                            left: annotation.x,
                            top: annotation.y,
                            transform: `rotate(${annotation.rotation}deg)`,
                            transformOrigin: 'top left',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(annotation.id);
                        }}
                        onDoubleClick={() => handleDoubleClick(annotation.id)}
                        onMouseEnter={() => onHover(annotation.id)}
                        onMouseLeave={() => onHover(null)}
                    >
                        {isEditing ? (
                            <textarea
                                ref={inputRef}
                                defaultValue={annotation.text}
                                onBlur={(e) => handleBlur(annotation.id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, annotation.id, e.currentTarget.value)}
                                className="bg-white border-2 border-secondary outline-none resize-none p-1 font-mono"
                                style={{
                                    fontSize: annotation.fontSize,
                                    color: annotation.color,
                                    minWidth: '100px',
                                    minHeight: '24px',
                                }}
                            />
                        ) : (
                            <div
                                className={cn(
                                    "px-2 py-1 font-mono whitespace-pre-wrap select-none",
                                    annotation.backgroundColor && "rounded"
                                )}
                                style={{
                                    fontSize: annotation.fontSize,
                                    color: annotation.color,
                                    backgroundColor: annotation.backgroundColor || 'transparent',
                                    textShadow: !annotation.backgroundColor 
                                        ? '0 0 3px white, 0 0 3px white, 0 0 3px white' 
                                        : 'none',
                                }}
                            >
                                {annotation.text || 'Double-click to edit'}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

AnnotationLayer.displayName = 'AnnotationLayer';
```

---

### Task 4: Create AnnotationsList Sidebar Component

**File:** `src/components/AnnotationsList.tsx` (new file)

```typescript
import React from 'react';
import { Annotation } from './types';
import { cn } from '@/lib/utils';
import { X, Type } from 'lucide-react';

interface AnnotationsListProps {
    items: Annotation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onUpdateText: (id: string, text: string) => void;
    onUpdateFontSize: (id: string, fontSize: number) => void;
    onUpdateColor: (id: string, color: string) => void;
    onUpdateBgColor: (id: string, bgColor: string | null) => void;
    onDelete: (id: string) => void;
    hoveredId: string | null;
    onHover: (id: string | null) => void;
}

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32];

export const AnnotationsList = React.memo(({
    items,
    selectedId,
    onSelect,
    onUpdateText,
    onUpdateFontSize,
    onUpdateColor,
    onUpdateBgColor,
    onDelete,
    hoveredId,
    onHover
}: AnnotationsListProps) => {
    return (
        <>
            {items.map(item => (
                <div
                    key={item.id}
                    className={cn(
                        "p-2 text-xs border-l-4 transition-all cursor-pointer",
                        selectedId === item.id 
                            ? "border-l-secondary bg-blue-50" 
                            : (hoveredId === item.id 
                                ? "border-l-secondary/50 bg-gray-50" 
                                : "border-l-transparent hover:border-l-border")
                    )}
                    onClick={() => onSelect(item.id)}
                    onMouseEnter={() => onHover(item.id)}
                    onMouseLeave={() => onHover(null)}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                            <Type size={10} className="text-muted-foreground" />
                            <input
                                type="text"
                                value={item.text}
                                onChange={(e) => onUpdateText(item.id, e.target.value)}
                                placeholder="Enter text..."
                                className="bg-transparent font-mono text-primary focus:outline-none border-b border-transparent focus:border-secondary w-32 text-[10px]"
                            />
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                            className="text-muted-foreground hover:text-red-500"
                        >
                            <X size={12} />
                        </button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 gap-2">
                        {/* Font Size Selector */}
                        <div className="flex items-center gap-1">
                            <span className="text-muted-foreground font-mono text-[10px]">Size:</span>
                            <select
                                value={item.fontSize}
                                onChange={(e) => onUpdateFontSize(item.id, parseInt(e.target.value))}
                                className="text-[10px] bg-white border border-border px-1 focus:border-secondary outline-none font-mono"
                            >
                                {FONT_SIZES.map(size => (
                                    <option key={size} value={size}>{size}px</option>
                                ))}
                            </select>
                        </div>

                        {/* Color Pickers */}
                        <div className="flex items-center gap-2">
                            {/* Text Color */}
                            <div className="relative w-4 h-4 border border-border bg-white shrink-0" title="Text Color">
                                <input
                                    type="color"
                                    value={item.color}
                                    onChange={(e) => onUpdateColor(item.id, e.target.value)}
                                    className="absolute inset-0 w-full h-full p-0 cursor-pointer opacity-0"
                                />
                                <div className="absolute inset-0.5" style={{ backgroundColor: item.color }} />
                                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white mix-blend-difference">T</span>
                            </div>
                            
                            {/* Background Color */}
                            <div className="relative w-4 h-4 border border-border bg-white shrink-0" title="Background Color">
                                <input
                                    type="color"
                                    value={item.backgroundColor || '#ffffff'}
                                    onChange={(e) => onUpdateBgColor(item.id, e.target.value)}
                                    className="absolute inset-0 w-full h-full p-0 cursor-pointer opacity-0"
                                />
                                <div 
                                    className="absolute inset-0.5" 
                                    style={{ 
                                        backgroundColor: item.backgroundColor || 'transparent',
                                        backgroundImage: !item.backgroundColor 
                                            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
                                            : 'none',
                                        backgroundSize: '4px 4px',
                                        backgroundPosition: '0 0, 2px 2px'
                                    }} 
                                />
                            </div>
                            
                            {/* Clear Background Button */}
                            {item.backgroundColor && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateBgColor(item.id, null); }}
                                    className="text-[8px] text-muted-foreground hover:text-primary font-mono"
                                    title="Remove background"
                                >
                                    CLR
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
});

AnnotationsList.displayName = 'AnnotationsList';
```

---

### Task 5: Add Annotate Mode to Canvas Logic

**File:** `src/hooks/useCanvasLogic.ts`

**Add annotation placement logic:**

```typescript
// Add to hook return values
const [pendingAnnotationPos, setPendingAnnotationPos] = useState<Point | null>(null);

// Add to handleMouseDown or create new handler
const handleAnnotationClick = useCallback((e: React.MouseEvent) => {
    const { mode, addAnnotation } = usePlanStore.getState();
    if (mode !== 'annotate') return;
    
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / zoomScale;
    const y = (e.clientY - rect.top) / zoomScale;
    
    const newAnnotation: Annotation = {
        id: Math.random().toString(36).substr(2, 9),
        text: 'New Note',
        x,
        y,
        fontSize: 14,
        color: '#1e293b',
        backgroundColor: '#ffffff',
        rotation: 0
    };
    
    addAnnotation(newAnnotation);
    usePlanStore.setState({ mode: 'view' });  // Return to view mode after placing
}, [zoomScale]);
```

---

### Task 6: Integrate into PlanEditor

**File:** `src/components/PlanEditor.tsx`

**Imports:**
```typescript
import { AnnotationLayer } from './AnnotationLayer';
import { AnnotationsList } from './AnnotationsList';
import { Type } from 'lucide-react';  // Add to existing lucide imports
```

**State & Store:**
```typescript
const {
    // ... existing destructuring
    annotations,
    addAnnotation, updateAnnotation, removeAnnotation,
} = usePlanStore();

// UI State
const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(true);
const [isAnnotationsVisible, setIsAnnotationsVisible] = useState(true);
const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
```

**Add Annotate Mode Button (in mode selector grid):**
```tsx
{[
    { id: 'view', label: 'PAN', icon: MousePointer2 },
    { id: 'measure', label: 'RULER', icon: Ruler },
    { id: 'area', label: 'AREA', icon: Square },
    { id: 'annotate', label: 'TEXT', icon: Type }  // NEW
].map((tool) => (
    // ... existing button code
))}
```

**Add AnnotationLayer to Canvas:**
```tsx
{/* After PlanLayer, before Furniture Layer */}
<AnnotationLayer
    annotations={annotations}
    isVisible={isAnnotationsVisible}
    selectedId={selectedAnnotationId}
    hoveredId={hoveredId}
    onSelect={setSelectedAnnotationId}
    onHover={setHoveredId}
    onUpdate={updateAnnotation}
    onDelete={removeAnnotation}
    zoomScale={zoomScale}
/>
```

**Add AnnotationsList to Sidebar (in Layer Management section):**
```tsx
<SidebarGroup
    title="Annotations"
    count={annotations.length}
    isOpen={isAnnotationsOpen}
    onToggle={() => setIsAnnotationsOpen(!isAnnotationsOpen)}
    isVisible={isAnnotationsVisible}
    onToggleVisibility={toggleAnnotationsVisibility}
>
    <AnnotationsList
        items={annotations}
        selectedId={selectedAnnotationId}
        onSelect={setSelectedAnnotationId}
        onUpdateText={(id, text) => updateAnnotation(id, { text })}
        onUpdateFontSize={(id, fontSize) => updateAnnotation(id, { fontSize })}
        onUpdateColor={(id, color) => updateAnnotation(id, { color })}
        onUpdateBgColor={(id, bgColor) => updateAnnotation(id, { backgroundColor: bgColor })}
        onDelete={removeAnnotation}
        hoveredId={hoveredId}
        onHover={setHoveredId}
    />
</SidebarGroup>
```

**Update Save Project:**
```typescript
const handleSaveProject = () => {
    const data: ProjectData = { lines, polygons, furniture, annotations, scale, unit };  // Add annotations
    // ... rest of function
};
```

---

### Task 7: Make Annotations Draggable

**File:** `src/components/AnnotationLayer.tsx`

Wrap annotation items with `react-draggable`:

```typescript
import Draggable from 'react-draggable';

// Inside the map function:
<Draggable
    key={annotation.id}
    position={{ x: annotation.x, y: annotation.y }}
    scale={zoomScale}
    onStart={(e) => {
        e.stopPropagation();
        onSelect(annotation.id);
    }}
    onStop={(e, data) => {
        onUpdate(annotation.id, { x: data.x, y: data.y });
    }}
    disabled={isEditing}
>
    {/* ... annotation content ... */}
</Draggable>
```

---

## Test Plan

### Unit Tests

**File:** `src/lib/annotation.test.ts` (new file)

```typescript
import { describe, it, expect } from 'vitest';
import { Annotation } from '@/components/types';

describe('annotation utils', () => {
    describe('annotation creation', () => {
        it('should create annotation with default values', () => {
            const annotation: Annotation = {
                id: 'test-1',
                text: 'Test Note',
                x: 100,
                y: 200,
                fontSize: 14,
                color: '#000000',
                backgroundColor: '#ffffff',
                rotation: 0
            };

            expect(annotation.text).toBe('Test Note');
            expect(annotation.fontSize).toBe(14);
            expect(annotation.rotation).toBe(0);
        });

        it('should allow null backgroundColor for transparent', () => {
            const annotation: Annotation = {
                id: 'test-2',
                text: 'Transparent',
                x: 0,
                y: 0,
                fontSize: 12,
                color: '#ff0000',
                backgroundColor: null,
                rotation: 0
            };

            expect(annotation.backgroundColor).toBeNull();
        });
    });

    describe('annotation validation', () => {
        it('should have valid font size range', () => {
            const validSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32];
            validSizes.forEach(size => {
                expect(size).toBeGreaterThanOrEqual(10);
                expect(size).toBeLessThanOrEqual(32);
            });
        });

        it('should normalize rotation to 0-359', () => {
            const normalizeRotation = (deg: number) => ((deg % 360) + 360) % 360;
            
            expect(normalizeRotation(0)).toBe(0);
            expect(normalizeRotation(90)).toBe(90);
            expect(normalizeRotation(360)).toBe(0);
            expect(normalizeRotation(-90)).toBe(270);
            expect(normalizeRotation(450)).toBe(90);
        });
    });
});
```

### Manual Testing Checklist

- [ ] Clicking "TEXT" mode button activates annotation mode
- [ ] Clicking on canvas in annotate mode creates new annotation
- [ ] Double-clicking annotation enables text editing
- [ ] Pressing Enter saves text edit
- [ ] Pressing Escape cancels text edit
- [ ] Annotations can be dragged to new positions
- [ ] Font size dropdown changes annotation size
- [ ] Text color picker changes annotation color
- [ ] Background color picker changes annotation background
- [ ] "CLR" button removes background (makes transparent)
- [ ] Annotations appear in sidebar list
- [ ] Clicking sidebar item selects annotation on canvas
- [ ] Hovering sidebar item highlights annotation on canvas
- [ ] Delete button removes annotation
- [ ] Annotations persist in project save/load
- [ ] Annotations appear in exported PNG
- [ ] Undo/redo works for annotation changes
- [ ] Annotations visibility can be toggled

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/types.ts` | Add `Annotation` type, update `Mode`, update `ProjectData` |
| `src/store/usePlanStore.ts` | Add annotation state and actions |
| `src/components/AnnotationLayer.tsx` | **NEW** - Canvas annotation rendering |
| `src/components/AnnotationsList.tsx` | **NEW** - Sidebar annotation list |
| `src/components/PlanEditor.tsx` | Integrate annotation mode, layer, and list |
| `src/hooks/useCanvasLogic.ts` | Add annotation placement logic |
| `src/lib/annotation.test.ts` | **NEW** - Unit tests |

---

## Acceptance Criteria

- [ ] User can add text annotations by clicking on canvas
- [ ] User can edit annotation text by double-clicking
- [ ] User can drag annotations to reposition
- [ ] User can change font size, text color, and background color
- [ ] User can toggle annotation visibility
- [ ] Annotations persist in project save/load
- [ ] Annotations appear in exported images
- [ ] Annotations support undo/redo
- [ ] UI follows existing app design patterns
