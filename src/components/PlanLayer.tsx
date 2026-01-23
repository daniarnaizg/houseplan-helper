import React from 'react';
import { Line, Polygon, Point, Mode } from './types';
import { calculateDistance, pixelsToUnit } from '@/lib/geometry';

interface PlanLayerProps {
    lines: Line[];
    polygons: Polygon[];
    currentLine: Partial<Line> | null;
    currentPoly: Point[];
    mode: Mode;
    scale: number | null;
    calibrationLine: Line | null;
    hoveredId: string | null;
    setHoveredId: (id: string | null) => void;
    isAreasVisible: boolean;
    isMeasurementsVisible: boolean;
}

export const PlanLayer = React.memo(({ 
    lines, 
    polygons, 
    currentLine, 
    currentPoly, 
    mode, 
    scale, 
    calibrationLine, 
    hoveredId, 
    setHoveredId,
    isAreasVisible,
    isMeasurementsVisible
}: PlanLayerProps) => {

    const renderTShapes = (start: Point, end: Point, color: string) => {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return null;

        const ux = dx / len;
        const uy = dy / len;
        const px = -uy;
        const py = ux;
        const size = 8;
        
        return (
            <>
                <line
                    x1={start.x - px * size} y1={start.y - py * size}
                    x2={start.x + px * size} y2={start.y + py * size}
                    stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke"
                />
                <line
                    x1={end.x - px * size} y1={end.y - py * size}
                    x2={end.x + px * size} y2={end.y + py * size}
                    stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke"
                />
            </>
        );
    };

    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
            {/* Polygons */}
            {isAreasVisible && polygons.map(poly => (
                <g
                    key={poly.id}
                    onMouseEnter={() => setHoveredId(poly.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="pointer-events-auto cursor-pointer"
                >
                    <polygon
                        points={poly.points.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={poly.color}
                        fillOpacity={hoveredId === poly.id ? 0.3 : 0.15}
                        stroke={poly.color}
                        strokeWidth={hoveredId === poly.id ? 3 : 1.5}
                        strokeDasharray="4 2"
                        vectorEffect="non-scaling-stroke"
                    />
                    <text
                        x={poly.points.reduce((a, b) => a + b.x, 0) / poly.points.length}
                        y={poly.points.reduce((a, b) => a + b.y, 0) / poly.points.length}
                        textAnchor="middle" fontSize={14} fill={poly.color} stroke="white" strokeWidth={4} paintOrder="stroke" fontWeight="bold" fontFamily="monospace"
                    >
                        {poly.area?.toFixed(2)}
                    </text>
                </g>
            ))}

            {/* Current Polygon */}
            {mode === 'area' && currentPoly.length > 0 && (
                <polygon
                    points={currentPoly.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth={2} vectorEffect="non-scaling-stroke"
                    strokeDasharray="5,5"
                />
            )}

            {/* Lines */}
            {isMeasurementsVisible && lines.map((line) => (
                <g
                    key={line.id}
                    onMouseEnter={() => setHoveredId(line.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="pointer-events-auto cursor-pointer"
                >
                    <line
                        x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y}
                        stroke={line.color}
                        strokeWidth={hoveredId === line.id ? 3 : 1.5}
                        vectorEffect="non-scaling-stroke"
                    />
                    {renderTShapes(line.start, line.end, line.color)}
                    {line.length && (
                        <g>
                            <rect
                                x={(line.start.x + line.end.x) / 2 - 30}
                                y={(line.start.y + line.end.y) / 2 - 12}
                                width={60} height={24}
                                fill="white" fillOpacity={1}
                                stroke={line.color} strokeWidth={1}
                            />
                            <text
                                x={(line.start.x + line.end.x) / 2}
                                y={(line.start.y + line.end.y) / 2 + 5}
                                textAnchor="middle"
                                fontSize={11}
                                fill="black"
                                fontWeight="bold"
                                fontFamily="monospace"
                            >
                                {line.length.toFixed(2)}
                            </text>
                        </g>
                    )}
                </g>
            ))}

            {/* Calibration Line */}
            {calibrationLine && mode === 'calibrate' && (
                <g>
                    <line
                        x1={calibrationLine.start.x} y1={calibrationLine.start.y}
                        x2={calibrationLine.end.x} y2={calibrationLine.end.y}
                        stroke={calibrationLine.color} strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="5 5"
                    />
                    {renderTShapes(calibrationLine.start, calibrationLine.end, calibrationLine.color)}
                </g>
            )}

            {/* Current Line */}
            {currentLine && currentLine.start && currentLine.end && (
                <g>
                    <line x1={currentLine.start.x} y1={currentLine.start.y} x2={currentLine.end.x} y2={currentLine.end.y} stroke={mode === 'calibrate' ? '#2563eb' : (currentLine.color || '#dc2626')} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                    {renderTShapes(currentLine.start as Point, currentLine.end as Point, mode === 'calibrate' ? '#2563eb' : (currentLine.color || '#dc2626'))}
                    {mode === 'measure' && scale && (
                        (() => {
                            const pxLen = calculateDistance(currentLine.start!, currentLine.end!);
                            const realLen = pixelsToUnit(pxLen, scale);
                            const dx = currentLine.end!.x - currentLine.start!.x;
                            const dy = currentLine.end!.y - currentLine.start!.y;
                            const offsetX = pxLen > 0 ? (-dy / pxLen) * 15 : 0;
                            const offsetY = pxLen > 0 ? (dx / pxLen) * 15 : 0;
                            return (
                                <text
                                    x={(currentLine.start!.x + currentLine.end!.x) / 2 + offsetX}
                                    y={(currentLine.start!.y + currentLine.end!.y) / 2 + offsetY}
                                    textAnchor="middle" fontSize={12} fill={currentLine.color || '#dc2626'} fontWeight="bold" style={{ textShadow: '0px 0px 3px white' }} fontFamily="monospace"
                                >
                                    {realLen.toFixed(2)}
                                </text>
                            );
                        })()
                    )}
                </g>
            )}
        </svg>
    );
});
PlanLayer.displayName = 'PlanLayer';