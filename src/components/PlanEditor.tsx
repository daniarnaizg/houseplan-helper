import React, { useEffect, useState, useRef, useCallback } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { Ruler, MousePointer2, Calculator, X, ZoomIn, ZoomOut, RotateCcw, Save, Download, Search, Square, Armchair, FolderOpen, ChevronDown, ChevronRight, RefreshCw, Eye, EyeOff, Check, ArrowRight } from 'lucide-react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';
import { Mode, Line, Polygon, FurnitureItem, Point, ProjectData } from './types';
import { rotateImage } from '@/lib/imageUtils';
import { calculatePolygonArea, calculateDistance, pixelsToUnit } from '@/lib/geometry';
import { DraggableFurnitureItem } from './DraggableFurnitureItem';
import { SidebarGroup } from './SidebarGroup';
import { MeasurementsList } from './MeasurementsList';
import { AreasList } from './AreasList';
import { FurnitureList } from './FurnitureList';
import { PlanLayer } from './PlanLayer';

interface PlanEditorProps {
  file?: File;
  initialImageSrc?: string;
  onReset: () => void;
}

const FURNITURE_CATALOG = [
    { type: 'bed', name: 'Bed', width: 1.5, depth: 2.0, icon: '🛏️', defaultColor: '#3b82f6' },
    { type: 'sofa', name: 'Sofa', width: 2.4, depth: 1.0, icon: '🛋️', defaultColor: '#6b7280' },
    { type: 'table', name: 'Table', width: 0.9, depth: 1.2, icon: '🪑', defaultColor: '#854d0e' },
    { type: 'toilet', name: 'Desk', width: 2.1, depth: 0.67, icon: '🖥️', defaultColor: '#d97706' },
    { type: 'custom', name: 'Custom', width: 1.0, depth: 1.0, icon: '📦', defaultColor: '#ef4444' },
];











export function PlanEditor({ file, initialImageSrc, onReset }: PlanEditorProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc || null);
  const [imgDimensions, setImgDimensions] = useState<{width: number, height: number} | null>(null);
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
  const [isMeasurementsVisible, setIsMeasurementsVisible] = useState(true);
  const [isAreasVisible, setIsAreasVisible] = useState(true);
  const [isFurnitureVisible, setIsFurnitureVisible] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Interaction State
  const [currentLine, setCurrentLine] = useState<Partial<Line> | null>(null);
  const [currentPoly, setCurrentPoly] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState<{x: number, y: number, bgX: number, bgY: number} | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  
  // Keyboard Nudging for Furniture
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (!selectedFurnitureId) return;
          
          if (document.activeElement instanceof HTMLInputElement) return;

          let dx = 0;
          let dy = 0;

          switch (e.key) {
              case 'ArrowUp': dy = -1; break;
              case 'ArrowDown': dy = 1; break;
              case 'ArrowLeft': dx = -1; break;
              case 'ArrowRight': dx = 1; break;
              default: return;
          }

          e.preventDefault();
          setFurniture(prev => prev.map(item => {
              if (item.id === selectedFurnitureId) {
                  return { ...item, x: item.x + dx, y: item.y + dy };
              }
              return item;
          }));
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFurnitureId]);
  
  // New Calibration State
  const [calibrationLine, setCalibrationLine] = useState<Line | null>(null);

  // Calibration Dialog
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [calibrationDistance, setCalibrationDistance] = useState<string>('');
  
  const transformComponentRef = useRef<ReactZoomPanPinchContentRef>(null);
  const contentRef = useRef<HTMLDivElement>(null); 
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Middle Mouse Panning State
  const panState = useRef<{
      isPanning: boolean;
      startX: number;
      startY: number;
      initialX: number;
      initialY: number;
      scale: number;
  }>({ isPanning: false, startX: 0, startY: 0, initialX: 0, initialY: 0, scale: 1 });

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
  }, []);

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

  useEffect(() => {
    if (initialImageSrc) {
        setImageSrc(initialImageSrc);
        return;
    }
    
    if (file) {
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        return () => URL.revokeObjectURL(url);
    }
  }, [file, initialImageSrc]);


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

  const handleAddFurniture = useCallback((item: typeof FURNITURE_CATALOG[0]) => {
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
  }, [scale]);

  const updateFurniturePos = useCallback((id: string, x: number, y: number) => {
      setFurniture(prev => prev.map(f => f.id === id ? { ...f, x, y } : f));
  }, []);
  
  const updateFurnitureDim = useCallback((id: string, dim: 'width' | 'depth', value: number) => {
      setFurniture(prev => prev.map(f => f.id === id ? { ...f, [dim]: value } : f));
  }, []);

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
      const pxLen = calculateDistance(calibrationLine.start, calibrationLine.end);
      const newScale = pxLen / dist;
      
      setLines(prev => prev.map(l => {
          const lPx = calculateDistance(l.start, l.end);
          return { ...l, length: pixelsToUnit(lPx, newScale), unit };
      }));
      
      setPolygons(prev => prev.map(p => {
          const area = calculatePolygonArea(p.points, newScale);
          return { ...p, area, unit: 'sq ' + unit };
      }));

      setScale(newScale);
      setMode('measure');
      setCalibrationLine(null);
      setShowCalibrationDialog(false);
    }
  };

  const updateItemName = useCallback((id: string, name: string) => {
      setLines(prev => prev.map(l => l.id === id ? { ...l, name } : l));
      setPolygons(prev => prev.map(p => p.id === id ? { ...p, name } : p));
      setFurniture(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  }, []);

  const updateItemColor = useCallback((id: string, color: string) => {
      setLines(prev => prev.map(l => l.id === id ? { ...l, color } : l));
      setPolygons(prev => prev.map(p => p.id === id ? { ...p, color } : p));
      setFurniture(prev => prev.map(f => f.id === id ? { ...f, color } : f));
  }, []);

  const deleteItem = useCallback((id: string) => {
      setLines(prev => prev.filter(l => l.id !== id));
      setPolygons(prev => prev.filter(p => p.id !== id));
      setFurniture(prev => prev.filter(f => f.id !== id));
  }, []);

  const toggleMeasurementsVisibility = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMeasurementsVisible(v => !v);
  }, []);

  const toggleAreasVisibility = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setIsAreasVisible(v => !v);
  }, []);

  const toggleFurnitureVisibility = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setIsFurnitureVisible(v => !v);
  }, []);

  
  return (
    <div className="flex h-screen overflow-hidden bg-grid-pattern">
      <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />

      {/* Magnifier Portal */}
      {showMagnifier && magnifierPos && imageSrc && (
        <div 
          className="fixed z-50 pointer-events-none rounded-full border-4 border-primary shadow-2xl overflow-hidden bg-white"
          style={{
              left: magnifierPos.x + 20,
              top: magnifierPos.y + 20,
              width: 150,
              height: 150,
              backgroundImage: `url(${imageSrc})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${(imgDimensions?.width || 0) * 2}px ${(imgDimensions?.height || 0) * 2}px`,
              backgroundPosition: `${magnifierPos.bgX}px ${magnifierPos.bgY}px`
          }}
        >
            <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-secondary -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-secondary -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-80 bg-white border-r-2 border-border flex flex-col z-10 h-screen shadow-2xl">
        <div className="p-4 border-b-2 border-border flex items-center justify-between shrink-0 bg-white">
            <h2 className="font-sans font-bold text-xl tracking-tighter text-primary">PROJECT<span className="text-secondary">TOOLS</span></h2>
            <button onClick={onReset} className="text-muted-foreground hover:text-red-500 transition-colors">
                <X size={24} strokeWidth={2.5} />
            </button>
        </div>
        
        <div className="p-4 space-y-6 flex-1 overflow-y-auto min-h-0">
            {/* Calibration & Precision Section */}
            {(!scale || mode === 'calibrate') ? (
                <div className="stencil-box p-4 bg-orange-50 border-secondary/30">
                    <h3 className="font-mono font-bold text-secondary mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                        <Calculator size={14} /> {mode === 'calibrate' && scale ? 'Recalibrating...' : 'Calibration Required'}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 font-mono leading-relaxed">
                        {mode === 'calibrate' ? 'ACTION: Draw reference line on plan.' : 'ACTION: Calibrate scale to begin.'}
                    </p>
                    {mode !== 'calibrate' && (
                        <button onClick={() => { setMode('calibrate'); }} className="w-full py-2 px-4 text-xs font-bold uppercase tracking-wider bg-secondary text-white border-2 border-secondary hover:bg-white hover:text-secondary transition-all shadow-[4px_4px_0px_#00000020] active:translate-y-[2px] active:shadow-none">
                            Start Calibration
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowMagnifier(!showMagnifier)} 
                        className={cn(
                            "flex-1 flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all shadow-[2px_2px_0px_#cbd5e1]",
                            showMagnifier 
                                ? "bg-secondary text-white border-secondary" 
                                : "bg-white text-primary border-border hover:border-primary"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Search size={14} />
                            <span>Precision</span>
                        </div>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            showMagnifier ? "bg-white" : "bg-muted-foreground"
                        )} />
                    </button>
                    <button 
                        onClick={() => { setMode('calibrate'); setCalibrationLine(null); }} 
                        className="flex items-center justify-center px-3 py-2 border-2 border-border bg-white text-muted-foreground hover:text-primary hover:border-primary transition-all text-xs font-bold shadow-[2px_2px_0px_#cbd5e1]" 
                        title="Recalibrate"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            )}

            {/* Mode Selector (Tools Grid) */}
            <div>
                 <p className="technical-text mb-2">Operation Mode</p>
                 <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'view', label: 'PAN', icon: MousePointer2 },
                        { id: 'measure', label: 'RULER', icon: Ruler },
                        { id: 'area', label: 'AREA', icon: Square }
                    ].map((tool) => (
                        <button 
                            key={tool.id}
                            onClick={() => setMode(tool.id as Mode)} 
                            disabled={tool.id !== 'view' && !scale}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-3 border-2 transition-all",
                                mode === tool.id 
                                    ? "bg-primary text-white border-primary shadow-[4px_4px_0px_#cbd5e1] -translate-y-1" 
                                    : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary disabled:opacity-50 disabled:hover:border-border"
                            )}
                        >
                            <tool.icon size={18} strokeWidth={2} />
                            <span className="text-[10px] font-mono font-bold">{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {scale !== null && (
                <>
                    {/* Furniture Tab */}
                    <div className="space-y-2">
                         <p className="technical-text mb-2">Asset Library</p>
                        <div className="grid grid-cols-2 gap-2">
                            {FURNITURE_CATALOG.map(item => (
                                <button key={item.type} onClick={() => handleAddFurniture(item)} className="flex items-center p-2 bg-white hover:bg-muted border border-border hover:border-primary transition-colors gap-3 group">
                                    <span className="text-xl filter grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
                                    <span className="text-xs font-mono font-bold text-primary">{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grouped Items List */}
                    <div className="space-y-3 pt-2 border-t-2 border-dashed border-border">
                        <p className="technical-text mb-2 mt-2">Layer Management</p>
                        {/* Measurements */}
                        <SidebarGroup 
                            title="Linear" 
                            count={lines.length} 
                            isOpen={isMeasurementsOpen} 
                            onToggle={() => setIsMeasurementsOpen(!isMeasurementsOpen)}
                            isVisible={isMeasurementsVisible}
                            onToggleVisibility={toggleMeasurementsVisibility}
                        >
                            <MeasurementsList 
                                items={lines} 
                                onUpdateName={updateItemName} 
                                onUpdateColor={updateItemColor} 
                                onDelete={deleteItem} 
                                hoveredId={hoveredId}
                                onHover={setHoveredId}
                            />
                        </SidebarGroup>

                        {/* Areas */}
                        <SidebarGroup 
                            title="Zones" 
                            count={polygons.length} 
                            isOpen={isAreasOpen} 
                            onToggle={() => setIsAreasOpen(!isAreasOpen)}
                            isVisible={isAreasVisible}
                            onToggleVisibility={toggleAreasVisibility}
                        >
                            <AreasList 
                                items={polygons} 
                                onUpdateName={updateItemName} 
                                onUpdateColor={updateItemColor} 
                                onDelete={deleteItem} 
                                hoveredId={hoveredId}
                                onHover={setHoveredId}
                            />
                        </SidebarGroup>

                        {/* Furniture */}
                        <SidebarGroup 
                            title="Assets" 
                            count={furniture.length} 
                            isOpen={isFurnitureOpen} 
                            onToggle={() => setIsFurnitureOpen(!isFurnitureOpen)}
                            isVisible={isFurnitureVisible}
                            onToggleVisibility={toggleFurnitureVisibility}
                        >
                            <FurnitureList 
                                items={furniture} 
                                selectedId={selectedFurnitureId}
                                onSelect={setSelectedFurnitureId}
                                onUpdateName={updateItemName} 
                                onUpdateDim={updateFurnitureDim}
                                onUpdateColor={updateItemColor} 
                                onDelete={deleteItem} 
                                hoveredId={hoveredId}
                                onHover={setHoveredId}
                            />
                        </SidebarGroup>
                        
                        {(lines.length === 0 && polygons.length === 0 && furniture.length === 0) && (
                            <div className="border-2 border-dashed border-border p-4 text-center">
                                <p className="text-[10px] font-mono text-muted-foreground">NO_DATA_POINTS</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col" onMouseDown={handleGlobalMouseDown}>
        {/* Top Controls */}
        <div className="absolute top-6 right-6 z-20 flex flex-col gap-4">
            <div className="stencil-box flex flex-col p-1 gap-1">
                <button onClick={() => transformComponentRef.current?.zoomIn()} className="p-2 hover:bg-muted text-primary transition-colors"><ZoomIn size={20} strokeWidth={1.5} /></button>
                <button onClick={() => transformComponentRef.current?.zoomOut()} className="p-2 hover:bg-muted text-primary transition-colors"><ZoomOut size={20} strokeWidth={1.5} /></button>
                <div className="h-px bg-border my-1" />
                <button onClick={handleRotate} className="p-2 hover:bg-muted text-primary transition-colors" title="Rotate Image"><RotateCcw size={20} strokeWidth={1.5} /></button>
            </div>
            
            <div className="stencil-box flex flex-col p-1 gap-1">
                <button onClick={handleSaveProject} className="p-2 hover:bg-muted text-primary transition-colors" title="Save Project"><Save size={20} strokeWidth={1.5} /></button>
                <button onClick={handleImportClick} className="p-2 hover:bg-muted text-primary transition-colors" title="Import Project"><FolderOpen size={20} strokeWidth={1.5} /></button>
            </div>

            <div className="stencil-box bg-primary border-primary flex flex-col p-1">
                <button onClick={handleExportImage} className="p-2 hover:bg-white/10 text-white transition-colors" title="Download Image">
                    <Download size={20} strokeWidth={2} />
                </button>
            </div>
        </div>

        {/* Polygon Helper UI */}
        {mode === 'area' && (
            <div className="absolute top-6 left-6 z-20 stencil-box p-3 flex items-center gap-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-mono font-bold text-primary">RECORDING_ZONE</span>
                </div>
                <button onClick={finishPolygon} className="text-xs font-bold uppercase tracking-wider bg-primary text-white px-3 py-1 hover:bg-primary/90 flex items-center gap-2">
                    Finish <Check size={12} />
                </button>
            </div>
        )}

        {imageSrc && (
             <TransformWrapper
                ref={transformComponentRef}
                minScale={0.1}
                limitToBounds={false}
                centerOnInit={true}
                wheel={{ disabled: false }} 
                panning={{ disabled: false, excluded: ['no-pan'] }}
                pinch={{ disabled: false }}
                onTransformed={(e) => setZoomScale(e.state.scale)} 
             >
                <TransformComponent wrapperClass="!w-full !h-full" contentClass={cn("!w-full !h-full flex items-center justify-center", mode !== 'view' && "no-pan")}>
                    <div 
                        ref={contentRef}
                        className="relative shadow-[0_0_50px_rgba(0,0,0,0.1)]"
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
                            className="max-w-none block select-none bg-white"
                            onDragStart={(e) => e.preventDefault()}
                            onLoad={(e) => setImgDimensions({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
                        />
                        
                                                {/* SVG Layer */}
                                                <PlanLayer 
                                                    lines={lines}
                                                    polygons={polygons}
                                                    currentLine={currentLine}
                                                    currentPoly={currentPoly}
                                                    mode={mode}
                                                    scale={scale}
                                                    calibrationLine={calibrationLine}
                                                    hoveredId={hoveredId}
                                                    setHoveredId={setHoveredId}
                                                    isAreasVisible={isAreasVisible}
                                                    isMeasurementsVisible={isMeasurementsVisible}
                                                />
                        {/* Furniture Layer (HTML) */}
                        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
                            {isFurnitureVisible && furniture.map((item) => (
                                <DraggableFurnitureItem 
                                    key={item.id} 
                                    item={item} 
                                    calibrationScale={scale || 1}
                                    zoomScale={zoomScale} 
                                    updatePos={updateFurniturePos}
                                    isSelected={selectedFurnitureId === item.id}
                                    onSelect={() => setSelectedFurnitureId(item.id)}
                                    onHover={setHoveredId}
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
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <div className="bg-white p-6 border-2 border-primary shadow-[8px_8px_0px_#1e293b] w-full max-w-sm">
                  <h3 className="text-lg font-bold font-mono mb-1 text-primary">SCALE_CALIBRATION</h3>
                  <div className="h-0.5 w-full bg-border mb-4" />
                  <p className="text-xs font-mono text-muted-foreground mb-6 uppercase">
                      Input real-world distance for reference line
                  </p>
                  <div className="flex gap-2 mb-6">
                       <input 
                            type="number" 
                            value={calibrationDistance} 
                            onChange={(e) => setCalibrationDistance(e.target.value)} 
                            placeholder="DISTANCE" 
                            className="flex-1 px-3 py-2 border-b-2 border-border focus:border-secondary outline-none font-mono text-lg font-bold bg-muted/20 text-primary placeholder:text-muted-foreground/50 rounded-none" 
                            autoFocus 
                        />
                       <select 
                            value={unit} 
                            onChange={(e) => setUnit(e.target.value)} 
                            className="px-3 py-2 border-2 border-border font-mono text-sm focus:border-secondary outline-none bg-white"
                        >
                           <option value="m">M</option>
                           <option value="cm">CM</option>
                           <option value="ft">FT</option>
                       </select>
                  </div>
                  <div className="flex justify-end gap-3">
                      <button onClick={() => { setShowCalibrationDialog(false); setCalibrationLine(null); setMode('view'); }} className="px-4 py-2 text-xs font-bold uppercase hover:bg-muted text-muted-foreground transition-colors">Cancel</button>
                      <button onClick={handleCalibrate} className="px-6 py-2 text-xs font-bold uppercase text-white bg-primary hover:bg-primary/90 transition-colors shadow-[2px_2px_0px_#cbd5e1] active:translate-y-[1px] active:shadow-none">Apply</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}