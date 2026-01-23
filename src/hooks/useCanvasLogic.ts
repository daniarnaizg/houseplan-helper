import { useState, useRef, useEffect, useCallback, RefObject } from 'react';
import { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { usePlanStore } from '@/store/usePlanStore';
import { calculateDistance, pixelsToUnit, calculatePolygonArea } from '@/lib/geometry';
import { Point, Line, Polygon, Mode } from '@/components/types';

interface UseCanvasLogicProps {
    imgRef: RefObject<HTMLImageElement | null>;
    transformComponentRef: RefObject<ReactZoomPanPinchContentRef | null>;
}

export function useCanvasLogic({ imgRef, transformComponentRef }: UseCanvasLogicProps) {
    const {
        mode,
        unit,
        scale,
        lines,
        polygons,
        setMode,
        setLines,
        setPolygons,
        setScale,
        addLine,
        addPolygon
    } = usePlanStore();

    // Zoom & Pan State
    const [zoomScale, setZoomScale] = useState<number>(1);
    const zoomScaleRef = useRef(1);

    // Sync ref for event handlers
    useEffect(() => {
        zoomScaleRef.current = zoomScale;
    }, [zoomScale]);

    // Interaction State
    const [currentLine, setCurrentLine] = useState<Partial<Line> | null>(null);
    const [currentPoly, setCurrentPoly] = useState<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Magnifier State
    const [showMagnifier, setShowMagnifier] = useState(false);
    const [magnifierPos, setMagnifierPos] = useState<{x: number, y: number, bgX: number, bgY: number} | null>(null);

    // Calibration State
    const [calibrationLine, setCalibrationLine] = useState<Line | null>(null);
    const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
    const [calibrationDistance, setCalibrationDistance] = useState<string>('');

    // Middle Mouse Panning State
    const panState = useRef<{
        isPanning: boolean;
        startX: number;
        startY: number;
        initialX: number;
        initialY: number;
        scale: number;
    }>({ isPanning: false, startX: 0, startY: 0, initialX: 0, initialY: 0, scale: 1 });

    // Global Panning Event Listeners
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!panState.current.isPanning || !transformComponentRef.current) return;
            
            e.preventDefault();
            const dx = e.clientX - panState.current.startX;
            const dy = e.clientY - panState.current.startY;
            
            transformComponentRef.current.setTransform(
                panState.current.initialX + dx,
                panState.current.initialY + dy,
                panState.current.scale,
                0
            );
        };

        const handleGlobalMouseUp = (e: MouseEvent) => {
            if (panState.current.isPanning) {
                panState.current.isPanning = false;
            }
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [transformComponentRef]);

    const handleGlobalMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 && transformComponentRef.current) { // Middle click
            e.preventDefault();
            e.stopPropagation();
            const { positionX, positionY, scale } = transformComponentRef.current.instance.transformState;
            panState.current = {
                isPanning: true,
                startX: e.clientX,
                startY: e.clientY,
                initialX: positionX,
                initialY: positionY,
                scale: scale
            };
        }
    };

    const getRelativeCoordinates = (e: React.MouseEvent | React.TouchEvent, element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        const currentScale = zoomScaleRef.current; 
        return {
            x: (clientX - rect.left) / currentScale,
            y: (clientY - rect.top) / currentScale
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1) {
            handleGlobalMouseDown(e);
            return;
        }
        if (e.button !== 0) return; 
        if (mode === 'view') return;
        if (!imgRef.current) return;
        if ((e.target as HTMLElement).closest('.react-draggable')) return;

        const point = getRelativeCoordinates(e, imgRef.current);

        if (mode === 'area') {
            setCurrentPoly(prev => [...prev, point]);
            return;
        }

        setIsDrawing(true);
        setCurrentLine({
            start: point,
            end: point,
            id: Math.random().toString(36).substr(2, 9),
            color: '#ef4444',
            name: mode === 'calibrate' ? 'Reference' : `Measurement ${lines.length + 1}`
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (showMagnifier && imgRef.current) {
            const clientX = e.clientX;
            const clientY = e.clientY;
            const rel = getRelativeCoordinates(e, imgRef.current);
            const zoom = 2; 
            const magSize = 150;
            const bgX = -rel.x * zoom + magSize / 2;
            const bgY = -rel.y * zoom + magSize / 2;
            setMagnifierPos({ x: clientX, y: clientY, bgX, bgY });
        }

        if (!imgRef.current) return;
        if (!isDrawing || !currentLine || !currentLine.start) return;
        
        const rawPoint = getRelativeCoordinates(e, imgRef.current);
        let endPoint = rawPoint;

        if (!e.shiftKey) {
            const dx = Math.abs(rawPoint.x - currentLine.start.x);
            const dy = Math.abs(rawPoint.y - currentLine.start.y);
            if (dx > dy) endPoint = { x: rawPoint.x, y: currentLine.start.y };
            else endPoint = { x: currentLine.start.x, y: rawPoint.y };
        }

        setCurrentLine(prev => ({ ...prev, end: endPoint }));
    };

    const handleMouseUp = () => {
        if (mode === 'area') return; 
        if (!isDrawing || !currentLine?.start || !currentLine?.end) return;
        setIsDrawing(false);

        if (calculateDistance(currentLine.start, currentLine.end) < 5) {
            setCurrentLine(null);
            return;
        }

        const newLine: Line = {
            id: currentLine.id!,
            start: currentLine.start,
            end: currentLine.end,
            name: currentLine.name || `Measurement`,
            color: currentLine.color || '#ef4444'
        };

        if (mode === 'calibrate') {
            setCalibrationLine(newLine);
            setCurrentLine(null);
            setShowCalibrationDialog(true);
        } else if (mode === 'measure') {
            if (scale) {
                const pxLen = calculateDistance(newLine.start, newLine.end);
                newLine.length = pixelsToUnit(pxLen, scale);
                newLine.unit = unit;
                addLine(newLine);
            }
            setCurrentLine(null);
        }
    };

    const finishPolygon = () => {
        if (currentPoly.length < 3) {
            setCurrentPoly([]);
            return;
        }
        if (!scale) return;

        const area = calculatePolygonArea(currentPoly, scale);
        const newPoly: Polygon = {
            id: Math.random().toString(36).substr(2, 9),
            points: currentPoly,
            area: area,
            unit: 'sq ' + unit,
            name: `Area ${polygons.length + 1}`,
            color: '#10b981'
        };
        addPolygon(newPoly);
        setCurrentPoly([]);
    };

    const handleCalibrate = () => {
        if (!calibrationLine) return;
        const dist = parseFloat(calibrationDistance);
        
        if (!isNaN(dist) && dist > 0) {
            const pxLen = calculateDistance(calibrationLine.start, calibrationLine.end);
            const newScale = pxLen / dist;
            
            setLines(lines.map(l => {
                const lPx = calculateDistance(l.start, l.end);
                return { ...l, length: pixelsToUnit(lPx, newScale), unit };
            }));
            
            setPolygons(polygons.map(p => {
                const area = calculatePolygonArea(p.points, newScale);
                return { ...p, area, unit: 'sq ' + unit };
            }));

            setScale(newScale);
            setMode('measure');
            setCalibrationLine(null);
            setShowCalibrationDialog(false);
        }
    };

    return {
        zoomScale,
        setZoomScale,
        currentLine,
        currentPoly,
        setCurrentPoly,
        calibrationLine,
        setCalibrationLine,
        showMagnifier,
        setShowMagnifier,
        magnifierPos,
        showCalibrationDialog,
        setShowCalibrationDialog,
        calibrationDistance,
        setCalibrationDistance,
        handleGlobalMouseDown,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        finishPolygon,
        handleCalibrate
    };
}
