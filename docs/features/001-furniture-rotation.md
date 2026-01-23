# Feature: Furniture Rotation

## Overview

Enable users to rotate furniture items to any angle (90-degree increments or free rotation) using UI controls and keyboard shortcuts. The `rotation` property already exists in the `FurnitureItem` type but is currently unused.

## Priority: High (Quick Win)
## Complexity: 2/5
## Estimated Dev Time: 1-2 days

---

## Current State Analysis

### Existing Code

**Type Definition** (`src/components/types.ts:27-37`):
```typescript
export interface FurnitureItem {
  id: string;
  type: 'bed' | 'sofa' | 'table' | 'toilet' | 'custom';
  name: string;
  width: number;  // Real world width in meters
  depth: number;  // Real world depth in meters
  x: number;
  y: number;
  rotation: number;  // <-- EXISTS BUT UNUSED
  color: string;
}
```

**Current Furniture Rendering** (`src/components/DraggableFurnitureItem.tsx`):
- No CSS transform rotation applied
- No rotation controls in UI
- `rotation` property is passed but ignored

**Store** (`src/store/usePlanStore.ts`):
- `updateFurniture` action already supports partial updates including `rotation`

---

## Implementation Plan

### Task 1: Apply Rotation Transform to Furniture Item

**File:** `src/components/DraggableFurnitureItem.tsx`

**Changes:**
1. Apply CSS `transform: rotate()` using the `rotation` property
2. Ensure rotation happens around the center of the furniture item

**Code Changes:**

```typescript
// In the style prop of the inner div (line ~51-58)
style={{
    width: (item.width * calibrationScale),
    height: (item.depth * calibrationScale),
    backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: item.color,
    borderWidth: '2px',
    borderStyle: isSelected ? 'dashed' : 'solid',
    boxShadow: isSelected ? '0 0 0 2px white' : 'none',
    // ADD: Rotation transform
    transform: `rotate(${item.rotation}deg)`,
    transformOrigin: 'center center'
}}
```

---

### Task 2: Add Rotation Controls to FurnitureList Sidebar

**File:** `src/components/FurnitureList.tsx`

**Changes:**
1. Add rotation input/buttons to each furniture item in the sidebar
2. Support both 90-degree increments (buttons) and free rotation (input)

**Props Update:**
```typescript
interface FurnitureListProps {
  items: FurnitureItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateDim: (id: string, dim: 'width' | 'depth', value: number) => void;
  onUpdateRotation: (id: string, rotation: number) => void;  // NEW
  onUpdateColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}
```

**UI Addition (after dimension inputs):**
```tsx
<div className="flex gap-2 items-center mt-2">
    <span className="text-muted-foreground font-mono text-[10px]">R:</span>
    <button 
        onClick={(e) => { e.stopPropagation(); onUpdateRotation(item.id, (item.rotation - 90 + 360) % 360); }}
        className="w-6 h-6 flex items-center justify-center bg-white border border-border hover:border-secondary"
        title="Rotate -90deg"
    >
        <RotateCcw size={10} />
    </button>
    <input 
        type="number" 
        step="15" 
        value={item.rotation} 
        onChange={(e) => onUpdateRotation(item.id, parseFloat(e.target.value) || 0)} 
        className="w-12 bg-white border border-border px-1 text-center focus:border-secondary outline-none text-[10px] font-mono"
    />
    <button 
        onClick={(e) => { e.stopPropagation(); onUpdateRotation(item.id, (item.rotation + 90) % 360); }}
        className="w-6 h-6 flex items-center justify-center bg-white border border-border hover:border-secondary"
        title="Rotate +90deg"
    >
        <RotateCw size={10} />
    </button>
</div>
```

---

### Task 3: Add Keyboard Shortcut for Rotation

**File:** `src/components/PlanEditor.tsx`

**Changes:** Update the keyboard handler in `useEffect` (lines 99-126) to support rotation keys.

**Updated Handler:**
```typescript
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const { furniture, selectedFurnitureId, updateFurniture } = usePlanStore.getState();
        if (!selectedFurnitureId) return;
        
        if (document.activeElement instanceof HTMLInputElement) return;

        let dx = 0;
        let dy = 0;
        let rotation: number | null = null;

        switch (e.key) {
            case 'ArrowUp': dy = -1; break;
            case 'ArrowDown': dy = 1; break;
            case 'ArrowLeft': dx = -1; break;
            case 'ArrowRight': dx = 1; break;
            // NEW: Rotation shortcuts
            case 'r':
            case 'R':
                rotation = 90; // Rotate clockwise
                break;
            case 'e':
            case 'E':
                rotation = -90; // Rotate counter-clockwise
                break;
            default: return;
        }

        e.preventDefault();
        const item = furniture.find(f => f.id === selectedFurnitureId);
        if (item) {
            if (rotation !== null) {
                updateFurniture(selectedFurnitureId, { 
                    rotation: (item.rotation + rotation + 360) % 360 
                });
            } else {
                updateFurniture(selectedFurnitureId, { x: item.x + dx, y: item.y + dy });
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

### Task 4: Update PlanEditor to Pass Rotation Handler

**File:** `src/components/PlanEditor.tsx`

**Changes:**
1. Create `updateFurnitureRotation` callback
2. Pass it to `FurnitureList` component

```typescript
// Add after updateFurnitureDim (line ~241)
const updateFurnitureRotation = useCallback((id: string, rotation: number) => {
    updateFurniture(id, { rotation });
}, [updateFurniture]);

// Update FurnitureList props (line ~450)
<FurnitureList 
    items={furniture} 
    selectedId={selectedFurnitureId}
    onSelect={setSelectedFurnitureId}
    onUpdateName={updateItemName} 
    onUpdateDim={updateFurnitureDim}
    onUpdateRotation={updateFurnitureRotation}  // NEW
    onUpdateColor={updateItemColor} 
    onDelete={deleteItem} 
    hoveredId={hoveredId}
    onHover={setHoveredId}
/>
```

---

### Task 5: Add Visual Rotation Handle on Selected Furniture (Optional Enhancement)

**File:** `src/components/DraggableFurnitureItem.tsx`

Add a visual rotation handle that appears when furniture is selected:

```tsx
{/* Rotation Handle - shown when selected */}
{isSelected && (
    <div 
        className="absolute -top-6 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
            e.stopPropagation();
            // Rotation drag logic would go here (advanced feature)
        }}
    >
        <div className="w-4 h-4 rounded-full bg-white border-2 border-primary flex items-center justify-center">
            <RotateCw size={8} className="text-primary" />
        </div>
        <div className="w-px h-2 bg-primary mx-auto" />
    </div>
)}
```

---

## Test Plan

### Unit Tests

**File:** `src/lib/rotation.test.ts` (new file)

```typescript
import { describe, it, expect } from 'vitest';

// Helper function to normalize rotation to 0-359 range
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
    });
});
```

### Manual Testing Checklist

- [ ] Furniture renders at correct rotation angle
- [ ] Clicking rotate buttons in sidebar rotates by 90 degrees
- [ ] Manual rotation input accepts any angle
- [ ] Pressing 'R' rotates selected furniture clockwise
- [ ] Pressing 'E' rotates selected furniture counter-clockwise
- [ ] Rotation is preserved in project save/load
- [ ] Rotation works correctly at different zoom levels
- [ ] Undo/redo works for rotation changes
- [ ] Furniture dimensions display remains readable at any rotation

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/DraggableFurnitureItem.tsx` | Apply CSS rotation transform |
| `src/components/FurnitureList.tsx` | Add rotation controls UI |
| `src/components/PlanEditor.tsx` | Add keyboard shortcuts, pass rotation handler |
| `src/lib/rotation.test.ts` | New file for rotation utility tests |

---

## Edge Cases to Handle

1. **Rotation values > 360 or < 0**: Normalize to 0-359 range
2. **Non-numeric input**: Default to current rotation or 0
3. **Drag behavior while rotated**: Ensure drag still works correctly (position should update in screen coordinates, not rotated coordinates)
4. **Export/Import**: Verify rotation is correctly serialized and restored

---

## Acceptance Criteria

- [ ] User can rotate furniture via sidebar controls
- [ ] User can rotate selected furniture via keyboard (R/E keys)
- [ ] Rotation is visually applied to furniture on canvas
- [ ] Rotation persists across save/load
- [ ] Rotation is included in undo/redo history
- [ ] All existing functionality continues to work (drag, resize dimensions, etc.)
