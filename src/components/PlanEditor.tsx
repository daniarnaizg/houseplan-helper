import React, { useEffect, useState, useRef } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { Ruler, MousePointer2, Calculator, Trash2, X, ZoomIn, ZoomOut, RotateCcw, Save, Download, Search, Square, Armchair, FolderOpen, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import Draggable from 'react-draggable';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';
import { Mode, Line, Polygon, FurnitureItem, Point, ProjectData } from './types';
import { rotateImage, calculatePolygonArea } from '@/lib/imageUtils';

interface PlanEditorProps {
  file: File;
  onReset: () => void;
}

const FURNITURE_CATALOG = [
    { type: 'bed', name: 'Bed', width: 1.5, depth: 2.0, icon: '🛏️', defaultColor: '#3b82f6' },
    { type: 'sofa', name: 'Sofa', width: 2.4, depth: 1.0, icon: '🛋️', defaultColor: '#6b7280' },
    { type: 'table', name: 'Table', width: 0.9, depth: 1.2, icon: '🪑', defaultColor: '#854d0e' },
    { type: 'toilet', name: 'Desk', width: 2.1, depth: 0.67, icon: '🖥️', defaultColor: '#d97706' },
    { type: 'custom', name: 'Custom', width: 1.0, depth: 1.0, icon: '📦', defaultColor: '#ef4444' },
];

const DraggableFurnitureItem = ({ 
    item, 
    calibrationScale,
    zoomScale, 
    updatePos, 
    isSelected,
    onSelect 
}: { 
    item: FurnitureItem, 
    calibrationScale: number,
    zoomScale: number, 
    updatePos: (id: string, x: number, y: number) => void,
    isSelected: boolean,
    onSelect: () => void
}) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    
    const handleDrag = (e: any, data: any) => {
        updatePos(item.id, data.x, data.y);
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: item.x, y: item.y }}
            scale={zoomScale}
            onStart={(e: any) => {
                e.stopPropagation(); 
                onSelect();
            }}
            onDrag={handleDrag}
            onMouseDown={(e: any) => e.stopPropagation()}
        >
            <div 
                ref={nodeRef}
                className={cn(
                    "absolute cursor-move pointer-events-auto flex flex-col items-center justify-center transition-shadow rounded-sm",
                    isSelected ? "shadow-md z-50" : "hover:shadow-sm"
                )}
                style={{
                    width: (item.width * calibrationScale),
                    height: (item.depth * calibrationScale),
                    backgroundColor: isSelected ? item.color + '60' : item.color + '40',
                    borderColor: item.color,
                    borderWidth: isSelected ? '2px' : '1px',
                    borderStyle: isSelected ? 'dashed' : 'solid',
                }}
            >
                <span className="text-xs font-bold leading-none pointer-events-none truncate max-w-full px-1" style={{ color: '#000' }}>
                    {item.name}
                </span>
                
                {(isSelected || (item.width * calibrationScale) > 60) && (
                    <span className="text-[10px] leading-none pointer-events-none mt-0.5 opacity-75" style={{ color: '#000' }}>
                        {item.width}m x {item.depth}m
                    </span>
                )}
            </div>
        </Draggable>
    );
};

const SidebarGroup = ({ 
    title, 
    count, 
    children, 
    isOpen, 
    onToggle 
}: { 
    title: string, 
    count: number, 
    children: React.ReactNode, 
    isOpen: boolean, 
    onToggle: () => void 
}) => {
    if (count === 0) return null;
    return (
        <div className="border border-gray-100 rounded-lg overflow-hidden bg-white">
            <button 
                onClick={onToggle}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                    <span className="font-semibold text-xs uppercase text-gray-700">{title}</span>
                </div>
                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] font-medium">{count}</span>
            </button>
            {isOpen && (
                <div className="p-2 space-y-2 border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
};

export function PlanEditor({ file, onReset }: PlanEditorProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [scale, setScale] = useState<number | null>(null); 
  const [unit, setUnit] = useState<string>('m');
  const [zoomScale, setZoomScale] = useState<number>(1); 
  
  // Data State
  const [lines, setLines] = useState<Line[]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  
  // UI State
  const [isMeasurementsOpen, setIsMeasurementsOpen] = useState(true);
  const [isAreasOpen, setIsAreasOpen] = useState(true);
  const [isFurnitureOpen, setIsFurnitureOpen] = useState(true);
  
  // Interaction State
  const [currentLine, setCurrentLine] = useState<Partial<Line> | null>(null);
  const [currentPoly, setCurrentPoly] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState<{x: number, y: number, bgX: number, bgY: number} | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  
  // New Calibration State
  const [calibrationLine, setCalibrationLine] = useState<Line | null>(null);

  // Calibration Dialog
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [calibrationDistance, setCalibrationDistance] = useState<string>('');
  
  const transformComponentRef = useRef<ReactZoomPanPinchContentRef>(null);
  const contentRef = useRef<HTMLDivElement>(null); 
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const getRelativeCoordinates = (e: React.MouseEvent | React.TouchEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const currentScale = zoomScale; 
    return {
      x: (clientX - rect.left) / currentScale,
      y: (clientY - rect.top) / currentScale
    };
  };

  const handleRotate = async () => {
    if (!imageSrc) return;
    try {
        const newSrc = await rotateImage(imageSrc, 'cw');
        setImageSrc(newSrc);
        setTimeout(() => transformComponentRef.current?.resetTransform(), 50);
    } catch (e) {
        console.error("Rotation failed", e);
    }
  };

  const handleSaveProject = () => {
      const data: ProjectData = { lines, polygons, furniture, scale, unit };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const data = JSON.parse(ev.target?.result as string) as ProjectData;
              if (data) {
                  if (data.lines) setLines(data.lines);
                  if (data.polygons) setPolygons(data.polygons);
                  if (data.furniture) setFurniture(data.furniture);
                  if (data.scale) setScale(data.scale);
                  if (data.unit) setUnit(data.unit);
                  alert("Project imported successfully!");
              }
          } catch (err) {
              console.error(err);
              alert("Invalid project file.");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleExportImage = async () => {
      if (!contentRef.current) {
          alert("Could not find plan content.");
          return;
      }
      try {
          const dataUrl = await toPng(contentRef.current, { 
              backgroundColor: 'white',
              style: {
                  transform: 'none',
                  transformOrigin: 'top left',
                  width: 'auto',
                  height: 'auto'
              }
          });
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `plan-export-${Date.now()}.png`;
          a.click();
      } catch (err) {
          console.error("Export failed", err);
          alert("Export failed. Please try resetting zoom/pan before exporting.");
      }
  };

  const handleAddFurniture = (item: typeof FURNITURE_CATALOG[0]) => {
      if (!scale) {
          alert("Please calibrate the plan first!");
          return;
      }
      const centerX = imgRef.current ? imgRef.current.width / 2 - (item.width * scale / 2) : 0;
      const centerY = imgRef.current ? imgRef.current.height / 2 - (item.depth * scale / 2) : 0;

      const newItem: FurnitureItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: item.type as any,
          name: item.name,
          width: item.width,
          depth: item.depth,
          x: centerX,
          y: centerY,
          rotation: 0,
          color: item.defaultColor 
      };
      setFurniture(prev => [...prev, newItem]);
      setSelectedFurnitureId(newItem.id);
      setMode('view'); 
  };

  const updateFurniturePos = (id: string, x: number, y: number) => {
      setFurniture(prev => prev.map(f => f.id === id ? { ...f, x, y } : f));
  };
  
  const updateFurnitureDim = (id: string, dim: 'width' | 'depth', value: number) => {
      setFurniture(prev => prev.map(f => f.id === id ? { ...f, [dim]: value } : f));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
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
      color: '#dc2626',
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

    const dx = currentLine.end.x - currentLine.start.x;
    const dy = currentLine.end.y - currentLine.start.y;
    if (Math.hypot(dx, dy) < 5) {
        setCurrentLine(null);
        return;
    }

    const newLine: Line = {
      id: currentLine.id!,
      start: currentLine.start,
      end: currentLine.end,
      name: currentLine.name || `Measurement`,
      color: currentLine.color || '#dc2626'
    };

    if (mode === 'calibrate') {
      // Store calibration line separately, do not add to measurements
      setCalibrationLine(newLine);
      setCurrentLine(null);
      setShowCalibrationDialog(true);
    } else if (mode === 'measure') {
      if (scale) {
        const pxLen = Math.hypot(newLine.end.x - newLine.start.x, newLine.end.y - newLine.start.y);
        newLine.length = pxLen / scale;
        newLine.unit = unit;
        setLines(prev => [...prev, newLine]);
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
      setPolygons(prev => [...prev, newPoly]);
      setCurrentPoly([]);
  };

  const handleCalibrate = () => {
    if (!calibrationLine) return;
    const dist = parseFloat(calibrationDistance);
    
    if (!isNaN(dist) && dist > 0) {
      const pxLen = Math.hypot(calibrationLine.end.x - calibrationLine.start.x, calibrationLine.end.y - calibrationLine.start.y);
      const newScale = pxLen / dist;
      
      // Recalculate ALL existing measurements with new scale
      setLines(prev => prev.map(l => {
          const lPx = Math.hypot(l.end.x - l.start.x, l.end.y - l.start.y);
          return { ...l, length: lPx / newScale, unit };
      }));
      
      setPolygons(prev => prev.map(p => {
          const area = calculatePolygonArea(p.points, newScale);
          return { ...p, area, unit: 'sq ' + unit };
      }));

      // Update global state
      setScale(newScale);
      setMode('measure');
      setCalibrationLine(null);
      setShowCalibrationDialog(false);
    }
  };

  const updateItemName = (id: string, name: string) => {
      setLines(lines.map(l => l.id === id ? { ...l, name } : l));
      setPolygons(polygons.map(p => p.id === id ? { ...p, name } : p));
      setFurniture(furniture.map(f => f.id === id ? { ...f, name } : f));
  };
  const updateItemColor = (id: string, color: string) => {
      setLines(lines.map(l => l.id === id ? { ...l, color } : l));
      setPolygons(polygons.map(p => p.id === id ? { ...p, color } : p));
      setFurniture(furniture.map(f => f.id === id ? { ...f, color } : f));
  };
  const deleteItem = (id: string) => {
      setLines(lines.filter(l => l.id !== id));
      setPolygons(polygons.filter(p => p.id !== id));
      setFurniture(furniture.filter(f => f.id !== id));
  };

  const renderTShapes = (start: Point, end: Point, color: string) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return null;
    const px = -dy / len;
    const py = dx / len;
    const size = 6;
    return (
        <>
            <line x1={start.x - px * size} y1={start.y - py * size} x2={start.x + px * size} y2={start.y + py * size} stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <line x1={end.x - px * size} y1={end.y - py * size} x2={end.x + px * size} y2={end.y + py * size} stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />

      {/* Magnifier Portal */}
      {showMagnifier && magnifierPos && imageSrc && (
          <div 
            className="fixed z-50 pointer-events-none rounded-full border-4 border-white shadow-xl overflow-hidden bg-white"
            style={{
                left: magnifierPos.x + 20,
                top: magnifierPos.y + 20,
                width: 150,
                height: 150,
                backgroundImage: `url(${imageSrc})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${(imgRef.current?.width || 0) * 2}px ${(imgRef.current?.height || 0) * 2}px`,
                backgroundPosition: `${magnifierPos.bgX}px ${magnifierPos.bgY}px`
            }}
          >
              <div className="absolute top-1/2 left-1/2 w-2 h-0.5 bg-red-500/50 -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-red-500/50 -translate-x-1/2 -translate-y-1/2"></div>
          </div>
      )}

      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-xl z-10 h-screen">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-lg">Tools</h2>
            <button onClick={onReset} className="text-gray-400 hover:text-red-500">
                <X size={20} />
            </button>
        </div>
        
        <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0">
            {/* Calibration & Precision Section */}
            {(!scale || mode === 'calibrate') ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Calculator size={16} /> {mode === 'calibrate' && scale ? 'Recalibrating...' : 'Calibration Needed'}
                    </h3>
                    <p className="text-xs text-blue-700 mb-3">
                        {mode === 'calibrate' ? 'Draw a new line over a known distance to update the scale.' : 'Draw a line over a known distance to start.'}
                    </p>
                    {mode !== 'calibrate' && (
                        <button onClick={() => { setMode('calibrate'); }} className={cn("w-full py-2 px-4 rounded-md text-sm font-medium border bg-blue-600 text-white border-blue-600")}>
                            Start Calibration
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowMagnifier(!showMagnifier)} 
                        className={cn(
                            "flex-1 flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium border transition-all",
                            showMagnifier 
                                ? "bg-blue-50 border-blue-200 text-blue-700" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Search size={16} />
                            <span>Precision</span>
                        </div>
                        <div className={cn(
                            "w-8 h-4 rounded-full relative transition-colors duration-200 ease-in-out",
                            showMagnifier ? "bg-blue-600" : "bg-gray-300"
                        )}>
                            <div className={cn(
                                "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
                                showMagnifier ? "translate-x-4" : "translate-x-0"
                            )} />
                        </div>
                    </button>
                    <button 
                        onClick={() => { setMode('calibrate'); setCalibrationLine(null); }} 
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all text-sm font-medium" 
                        title="Recalibrate"
                    >
                        <RefreshCw size={16} />
                        <span>Recalibrate</span>
                    </button>
                </div>
            )}

            {/* Mode Selector (Tools Grid) */}
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setMode('view')} className={cn("flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all", mode === 'view' ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900")}>
                    <MousePointer2 size={14} /> Pan
                </button>
                 <button onClick={() => setMode('measure')} disabled={!scale} className={cn("flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all disabled:opacity-50", mode === 'measure' ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900")}>
                    <Ruler size={14} /> Measure
                </button>
                <button onClick={() => setMode('area')} disabled={!scale} className={cn("flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all disabled:opacity-50", mode === 'area' ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900")}>
                    <Square size={14} /> Area
                </button>
            </div>

            {scale && (
                <>
                    {/* Furniture Tab */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2"><Armchair size={14}/> Furniture Library</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {FURNITURE_CATALOG.map(item => (
                                <button key={item.type} onClick={() => handleAddFurniture(item)} className="flex flex-col items-center justify-center p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-xs gap-1">
                                    <span className="text-xl">{item.icon}</span>
                                    <span>{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grouped Items List */}
                    <div className="space-y-3 pt-2">
                        {/* Measurements */}
                        <SidebarGroup title="Measurements" count={lines.length} isOpen={isMeasurementsOpen} onToggle={() => setIsMeasurementsOpen(!isMeasurementsOpen)}>
                            {lines.map(item => (
                                <div key={item.id} className="bg-gray-50 p-2 rounded text-xs border border-gray-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <input 
                                            type="text" value={item.name} onChange={(e) => updateItemName(item.id, e.target.value)}
                                            className="bg-transparent font-medium text-gray-900 focus:outline-none focus:border-b border-blue-500 w-full mr-2"
                                        />
                                        <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="relative w-4 h-4 rounded-full overflow-hidden border border-gray-200">
                                            <input type="color" value={item.color} onChange={(e) => updateItemColor(item.id, e.target.value)} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 cursor-pointer border-none" />
                                        </div>
                                        <span className="text-gray-500 font-mono">
                                            {item.length?.toFixed(2)} {item.unit}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </SidebarGroup>

                        {/* Areas */}
                        <SidebarGroup title="Areas" count={polygons.length} isOpen={isAreasOpen} onToggle={() => setIsAreasOpen(!isAreasOpen)}>
                            {polygons.map(item => (
                                <div key={item.id} className="bg-gray-50 p-2 rounded text-xs border border-gray-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <input 
                                            type="text" value={item.name} onChange={(e) => updateItemName(item.id, e.target.value)}
                                            className="bg-transparent font-medium text-gray-900 focus:outline-none focus:border-b border-blue-500 w-full mr-2"
                                        />
                                        <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="relative w-4 h-4 rounded-full overflow-hidden border border-gray-200">
                                            <input type="color" value={item.color} onChange={(e) => updateItemColor(item.id, e.target.value)} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 cursor-pointer border-none" />
                                        </div>
                                        <span className="text-gray-500 font-mono">
                                            {item.area?.toFixed(2)} {item.unit}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </SidebarGroup>

                        {/* Furniture */}
                        <SidebarGroup title="Furniture" count={furniture.length} isOpen={isFurnitureOpen} onToggle={() => setIsFurnitureOpen(!isFurnitureOpen)}>
                            {furniture.map(item => (
                                <div key={item.id} className={cn("bg-gray-50 p-2 rounded text-xs border transition-colors", selectedFurnitureId === item.id ? "border-blue-500 bg-blue-50" : "border-gray-100")} onClick={() => setSelectedFurnitureId(item.id)}>
                                    <div className="flex items-center justify-between mb-1">
                                        <input 
                                            type="text" value={item.name} onChange={(e) => updateItemName(item.id, e.target.value)}
                                            className="bg-transparent font-medium text-gray-900 focus:outline-none focus:border-b border-blue-500 w-24"
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex gap-2 items-center text-gray-500">
                                            <span>W:</span>
                                            <input type="number" step="0.1" value={item.width} onChange={(e) => updateFurnitureDim(item.id, 'width', parseFloat(e.target.value))} className="w-10 bg-white border rounded px-1" />
                                            <span>D:</span>
                                            <input type="number" step="0.1" value={item.depth} onChange={(e) => updateFurnitureDim(item.id, 'depth', parseFloat(e.target.value))} className="w-10 bg-white border rounded px-1" />
                                        </div>
                                        <div className="relative w-4 h-4 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                            <input type="color" value={item.color} onChange={(e) => updateItemColor(item.id, e.target.value)} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 cursor-pointer border-none" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </SidebarGroup>
                        
                        {(lines.length === 0 && polygons.length === 0 && furniture.length === 0) && (
                            <p className="text-xs text-gray-400 text-center italic py-4">No items yet</p>
                        )}
                    </div>
                </>
            )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative bg-gray-100 flex flex-col">
        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-4">
            <div className="flex flex-col gap-2 bg-white/90 backdrop-blur shadow-lg rounded-lg p-2 border border-gray-200">
                <button onClick={() => transformComponentRef.current?.zoomIn()} className="p-2 hover:bg-gray-100 rounded text-gray-700"><ZoomIn size={20} /></button>
                <button onClick={() => transformComponentRef.current?.zoomOut()} className="p-2 hover:bg-gray-100 rounded text-gray-700"><ZoomOut size={20} /></button>
                <button onClick={() => transformComponentRef.current?.resetTransform()} className="p-2 hover:bg-gray-100 rounded text-gray-700"><RotateCcw size={20} /></button>
            </div>
            
            <div className="flex flex-col gap-2 bg-white/90 backdrop-blur shadow-lg rounded-lg p-2 border border-gray-200">
                <button onClick={handleSaveProject} className="p-2 hover:bg-gray-100 rounded text-gray-700" title="Save Project"><Save size={20} /></button>
                <button onClick={handleImportClick} className="p-2 hover:bg-gray-100 rounded text-gray-700" title="Import Project"><FolderOpen size={20} /></button>
            </div>

            <div className="bg-blue-600 shadow-lg rounded-lg p-2 border border-blue-700">
                <button onClick={handleExportImage} className="p-2 hover:bg-blue-700 rounded text-white transition-colors" title="Download Image">
                    <Download size={20} />
                </button>
            </div>
        </div>

        {/* Polygon Helper UI */}
        {mode === 'area' && (
            <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-md text-sm border border-gray-200">
                <p>Click to add points. <button onClick={finishPolygon} className="text-blue-600 font-bold hover:underline">Click here to Finish</button></p>
            </div>
        )}

        {imageSrc && (
             <TransformWrapper
                ref={transformComponentRef}
                disabled={mode !== 'view'} 
                wheel={{ disabled: mode !== 'view' }} 
                panning={{ disabled: mode !== 'view' }}
                onTransformed={(e) => setZoomScale(e.state.scale)} 
             >
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                    <div 
                        ref={contentRef}
                        className="relative shadow-2xl"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onTouchStart={(e) => handleMouseDown(e as unknown as React.MouseEvent)} 
                        onTouchMove={(e) => handleMouseMove(e as unknown as React.MouseEvent)}
                        onTouchEnd={handleMouseUp}
                    >
                        <img 
                            ref={imgRef}
                            src={imageSrc} 
                            alt="House Plan" 
                            className="max-w-none block select-none"
                            onDragStart={(e) => e.preventDefault()}
                        />
                        
                        {/* SVG Layer */}
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                            {/* Polygons */}
                            {polygons.map(poly => (
                                <g key={poly.id}>
                                    <polygon 
                                        points={poly.points.map(p => `${p.x},${p.y}`).join(' ')}
                                        fill={poly.color} fillOpacity={0.2} stroke={poly.color} strokeWidth={2} vectorEffect="non-scaling-stroke"
                                    />
                                    <text 
                                        x={poly.points.reduce((a,b)=>a+b.x,0)/poly.points.length} 
                                        y={poly.points.reduce((a,b)=>a+b.y,0)/poly.points.length} 
                                        textAnchor="middle" fontSize={14} fill="white" stroke="black" strokeWidth={3} paintOrder="stroke" fontWeight="bold"
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
                            {lines.map((line) => (
                                <g key={line.id}>
                                    <line x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} stroke={line.color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                                    {renderTShapes(line.start, line.end, line.color)}
                                    {line.length && (
                                        <g>
                                            <rect 
                                                x={(line.start.x + line.end.x) / 2 - 25} 
                                                y={(line.start.y + line.end.y) / 2 - 12} 
                                                width={50} height={24} 
                                                fill="white" fillOpacity={0.9} rx={4}
                                                stroke={line.color} strokeWidth={1}
                                            />
                                            <text 
                                                x={(line.start.x + line.end.x) / 2} 
                                                y={(line.start.y + line.end.y) / 2 + 5} 
                                                textAnchor="middle" 
                                                fontSize={12} 
                                                fill="black" 
                                                fontWeight="bold" 
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
                                            const dx = currentLine.end!.x - currentLine.start!.x;
                                            const dy = currentLine.end!.y - currentLine.start!.y;
                                            const pxLen = Math.hypot(dx, dy);
                                            const realLen = pxLen / scale;
                                            const offsetX = pxLen > 0 ? (-dy / pxLen) * 15 : 0;
                                            const offsetY = pxLen > 0 ? (dx / pxLen) * 15 : 0;
                                            return (
                                                <text 
                                                    x={(currentLine.start!.x + currentLine.end!.x) / 2 + offsetX} 
                                                    y={(currentLine.start!.y + currentLine.end!.y) / 2 + offsetY} 
                                                    textAnchor="middle" fontSize={12} fill={currentLine.color || '#dc2626'} fontWeight="bold" style={{ textShadow: '0px 0px 3px white' }}
                                                >
                                                    {realLen.toFixed(2)}
                                                </text>
                                            );
                                        })()
                                    )}
                                </g>
                            )}
                        </svg>

                        {/* Furniture Layer (HTML) */}
                        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
                            {furniture.map((item) => (
                                <DraggableFurnitureItem 
                                    key={item.id} 
                                    item={item} 
                                    calibrationScale={scale || 1}
                                    zoomScale={zoomScale} 
                                    updatePos={updateFurniturePos}
                                    isSelected={selectedFurnitureId === item.id}
                                    onSelect={() => setSelectedFurnitureId(item.id)}
                                />
                            ))}
                        </div>

                    </div>
                </TransformComponent>
            </TransformWrapper>
        )}
      </main>

      {/* Dialogs */}
      {showCalibrationDialog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Calibrate Scale</h3>
                  <p className="text-sm text-gray-500 mb-4">
                      Enter the real-world distance for the line you just drew.
                  </p>
                  <div className="flex gap-2 mb-4">
                       <input type="number" value={calibrationDistance} onChange={(e) => setCalibrationDistance(e.target.value)} placeholder="Known distance" className="flex-1 px-3 py-2 border border-gray-300 rounded-md" autoFocus />
                       <select value={unit} onChange={(e) => setUnit(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md bg-white">
                           <option value="m">m</option>
                           <option value="cm">cm</option>
                           <option value="ft">ft</option>
                       </select>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => { setShowCalibrationDialog(false); setCalibrationLine(null); setMode('view'); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">Cancel</button>
                      <button onClick={handleCalibrate} className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">Apply</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}