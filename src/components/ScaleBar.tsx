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
                style={{ width: `${barWidthPx}px`, minWidth: '40px' }}
            >
                {/* Left tick */}
                <div className="absolute left-0 -top-1 w-0.5 h-4 bg-primary" />
                {/* Right tick */}
                <div className="absolute right-0 -top-1 w-0.5 h-4 bg-primary" />
                {/* Center tick */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-0.5 w-px h-3 bg-primary/50" />
            </div>
            
            {/* Label */}
            <div className="flex justify-between w-full" style={{ width: `${barWidthPx}px`, minWidth: '40px' }}>
                <span className="text-[9px] font-mono text-primary font-bold">0</span>
                <span className="text-[9px] font-mono text-primary font-bold">
                    {formattedValue} {displayUnit}
                </span>
            </div>
        </div>
    );
};

ScaleBar.displayName = 'ScaleBar';
