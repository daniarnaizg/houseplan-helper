# Feature: Scale Bar Display

## Overview

Display a dynamic scale bar on the canvas that updates with zoom level, showing real-world distances. This provides visual confirmation of calibration accuracy and follows professional cartographic standards.

## Priority: High (Quick Win)
## Complexity: 2/5
## Estimated Dev Time: 0.5-1 day

---

## Current State Analysis

### Existing Code

**Calibration System:**
- Scale is stored in `usePlanStore` as `scale: number | null` (pixels per unit)
- Unit is stored as `unit: string` ('m', 'cm', 'ft')
- Scale is set via calibration dialog after user draws a reference line

**Geometry Utilities** (`src/lib/geometry.ts`):
```typescript
export function pixelsToUnit(pixels: number, scale: number): number {
    if (scale === 0) return 0;
    return pixels / scale;
}
```

**Zoom State:**
- `zoomScale` is tracked in `useCanvasLogic` hook
- Passed to `PlanEditor` via the hook return value

---

## Implementation Plan

### Task 1: Create ScaleBar Component

**File:** `src/components/ScaleBar.tsx` (new file)

```typescript
import React, { useMemo } from 'react';

interface ScaleBarProps {
    /** Pixels per real-world unit (e.g., pixels per meter) */
    scale: number;
    /** Current zoom level of the canvas */
    zoomScale: number;
    /** Unit label ('m', 'cm', 'ft') */
    unit: string;
}

/**
 * Determines an aesthetically pleasing scale bar length
 * Returns a "nice" number for display (1, 2, 5, 10, 20, 50, etc.)
 */
function getNiceScaleValue(rawValue: number): number {
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

export const ScaleBar: React.FC<ScaleBarProps> = ({ scale, zoomScale, unit }) => {
    const { barWidthPx, displayValue, displayUnit } = useMemo(() => {
        // Target bar width in screen pixels (aim for ~100-150px)
        const targetBarWidthPx = 120;
        
        // Calculate how many real-world units fit in targetBarWidthPx at current zoom
        // effectiveScale = pixels on screen per real unit
        const effectiveScale = scale * zoomScale;
        const rawRealUnits = targetBarWidthPx / effectiveScale;
        
        // Get a nice rounded value
        const niceValue = getNiceScaleValue(rawRealUnits);
        
        // Calculate the actual pixel width for this nice value
        const actualBarWidthPx = niceValue * effectiveScale;
        
        // Format the display value
        let displayVal = niceValue;
        let displayUnitStr = unit;
        
        // Convert to more readable units if needed
        if (unit === 'm' && niceValue < 1) {
            displayVal = niceValue * 100;
            displayUnitStr = 'cm';
        } else if (unit === 'm' && niceValue >= 1000) {
            displayVal = niceValue / 1000;
            displayUnitStr = 'km';
        } else if (unit === 'cm' && niceValue >= 100) {
            displayVal = niceValue / 100;
            displayUnitStr = 'm';
        } else if (unit === 'ft' && niceValue >= 5280) {
            displayVal = niceValue / 5280;
            displayUnitStr = 'mi';
        }
        
        return {
            barWidthPx: Math.round(actualBarWidthPx),
            displayValue: displayVal,
            displayUnit: displayUnitStr
        };
    }, [scale, zoomScale, unit]);

    // Format display value (remove unnecessary decimals)
    const formattedValue = displayValue % 1 === 0 
        ? displayValue.toString() 
        : displayValue.toFixed(2).replace(/\.?0+$/, '');

    return (
        <div className="flex flex-col items-start gap-0.5">
            {/* Scale bar */}
            <div 
                className="h-2 bg-primary border border-primary relative"
                style={{ width: `${barWidthPx}px` }}
            >
                {/* Left tick */}
                <div className="absolute left-0 -top-1 w-0.5 h-4 bg-primary" />
                {/* Right tick */}
                <div className="absolute right-0 -top-1 w-0.5 h-4 bg-primary" />
                {/* Center tick (optional) */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-0.5 w-px h-3 bg-primary/50" />
            </div>
            
            {/* Label */}
            <div className="flex justify-between w-full" style={{ width: `${barWidthPx}px` }}>
                <span className="text-[9px] font-mono text-primary font-bold">0</span>
                <span className="text-[9px] font-mono text-primary font-bold">
                    {formattedValue} {displayUnit}
                </span>
            </div>
        </div>
    );
};

ScaleBar.displayName = 'ScaleBar';
```

---

### Task 2: Integrate ScaleBar into PlanEditor

**File:** `src/components/PlanEditor.tsx`

**Import:**
```typescript
import { ScaleBar } from './ScaleBar';
```

**Add ScaleBar to UI (after the main content area, bottom-left corner):**

```tsx
{/* Scale Bar - Bottom Left */}
{scale !== null && (
    <div className="absolute bottom-6 left-6 z-20 stencil-box p-3 bg-white/95 backdrop-blur-sm">
        <ScaleBar 
            scale={scale} 
            zoomScale={zoomScale} 
            unit={unit} 
        />
    </div>
)}
```

**Location:** Add this JSX inside the `<main>` element, alongside other absolute-positioned controls (around line 500-510).

---

### Task 3: Add Scale Info to Sidebar (Optional Enhancement)

**File:** `src/components/PlanEditor.tsx`

Add calibration info display in the sidebar after the calibration section:

```tsx
{/* Scale Info Display */}
{scale !== null && (
    <div className="stencil-box p-3 bg-muted/30">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
                Calibrated Scale
            </span>
            <span className="text-xs font-mono font-bold text-primary">
                {scale.toFixed(1)} px/{unit}
            </span>
        </div>
    </div>
)}
```

---

## Test Plan

### Unit Tests

**File:** `src/lib/scaleBar.test.ts` (new file)

```typescript
import { describe, it, expect } from 'vitest';

/**
 * Gets a "nice" number for scale bar display
 * Mimics the logic in ScaleBar component
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
            expect(getNiceScaleValue(73)).toBe(100);
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
    });
});
```

### Manual Testing Checklist

- [ ] Scale bar appears after calibration is complete
- [ ] Scale bar updates when zooming in (shows smaller real-world values)
- [ ] Scale bar updates when zooming out (shows larger real-world values)
- [ ] Scale bar displays "nice" numbers (1, 2, 5, 10, 20, 50, etc.)
- [ ] Scale bar correctly converts units (m to cm when < 1m)
- [ ] Scale bar maintains reasonable screen width (80-150px) at all zoom levels
- [ ] Scale bar disappears when calibration is reset/not set
- [ ] Scale bar is visible but not intrusive to the workflow
- [ ] Scale bar looks correct in exported PNG image

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/ScaleBar.tsx` | **NEW** - Scale bar component |
| `src/components/PlanEditor.tsx` | Import and render ScaleBar |
| `src/lib/scaleBar.test.ts` | **NEW** - Unit tests for scale calculation |

---

## Visual Design

```
┌─────────────────────┐
│ ┃                 ┃ │
│ ┃─────────────────┃ │
│ ┃                 ┃ │
│ 0              5 m  │
└─────────────────────┘
```

**Styling:**
- Background: White with slight transparency
- Border: Uses existing `stencil-box` class for consistency
- Text: Monospace font, small size (9-10px)
- Bar: Solid primary color with tick marks at ends

---

## Edge Cases to Handle

1. **Very small scale values**: Convert to smaller units (m -> cm)
2. **Very large scale values**: Convert to larger units (m -> km)
3. **Extreme zoom levels**: Ensure bar stays within reasonable pixel width
4. **Zero/null scale**: Don't render scale bar
5. **Unit changes**: Recalculate immediately when user changes unit

---

## Acceptance Criteria

- [ ] Scale bar is visible on canvas after calibration
- [ ] Scale bar updates dynamically with zoom
- [ ] Scale bar shows "nice" rounded numbers
- [ ] Scale bar automatically adjusts unit display (m/cm/km)
- [ ] Scale bar appears in exported PNG
- [ ] Scale bar does not interfere with drawing/measuring operations
- [ ] Scale bar follows the blueprint/technical aesthetic of the app
