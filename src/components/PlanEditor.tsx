import React, { useEffect, useState, useRef, useCallback } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { Ruler, MousePointer2, Calculator, X, ZoomIn, ZoomOut, RotateCcw, Save, Download, Search, Square, Armchair, FolderOpen, ChevronDown, ChevronRight, RefreshCw, Eye, EyeOff, Check, ArrowRight, Undo2, Redo2, Type } from 'lucide-react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';
import { Mode, Line, Polygon, FurnitureItem, FurnitureTemplate, Point, ProjectData } from './types';
import { rotateImage } from '@/lib/imageUtils';
import { calculatePolygonArea, calculateDistance, pixelsToUnit } from '@/lib/geometry';
import { DraggableFurnitureItem } from './DraggableFurnitureItem';
import { SidebarGroup } from './SidebarGroup';
import { MeasurementsList } from './MeasurementsList';
import { AreasList } from './AreasList';
import { FurnitureList } from './FurnitureList';
import { AnnotationsList } from './AnnotationsList';
import { PlanLayer } from './PlanLayer';
import { AnnotationLayer } from './AnnotationLayer';
import { ScaleBar } from './ScaleBar';
import { FurnitureQuickAccess } from './FurnitureQuickAccess';
import { FurnitureLibraryModal } from './FurnitureLibraryModal';
import { Annotation } from './types';
import { usePlanStore } from '@/store/usePlanStore';
import { useCanvasLogic } from '@/hooks/useCanvasLogic';
import { useUndoRedo } from '@/hooks/useUndoRedo';

interface PlanEditorProps {
  file?: File;
  initialImageSrc?: string;
  onReset: () => void;
}











export function PlanEditor({ file, initialImageSrc, onReset }: PlanEditorProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc || null);
  const [imgDimensions, setImgDimensions] = useState<{width: number, height: number} | null>(null);

  const {
      lines, polygons, furniture, annotations, scale, unit, mode, selectedFurnitureId,
      setMode, 
      setFurniture,
      updateLine, removeLine,
      updatePolygon, removePolygon,
      addFurniture, updateFurniture, removeFurniture, setSelectedFurnitureId,
      addAnnotation, updateAnnotation, removeAnnotation,
      loadProject,
      setUnit
  } = usePlanStore();

  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const transformComponentRef = useRef<ReactZoomPanPinchContentRef>(null);
  const contentRef = useRef<HTMLDivElement>(null); 
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
      zoomScale,
      setZoomScale,
      currentLine,
      currentPoly,
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
  } = useCanvasLogic({ imgRef, transformComponentRef });
  
  // UI State
  const [isMeasurementsOpen, setIsMeasurementsOpen] = useState(true);
  const [isAreasOpen, setIsAreasOpen] = useState(true);
  const [isFurnitureOpen, setIsFurnitureOpen] = useState(true);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(true);
  const [isMeasurementsVisible, setIsMeasurementsVisible] = useState(true);
  const [isAreasVisible, setIsAreasVisible] = useState(true);
  const [isFurnitureVisible, setIsFurnitureVisible] = useState(true);
  const [isAnnotationsVisible, setIsAnnotationsVisible] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  // Interaction State
  // Keyboard Nudging and Rotation for Furniture
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const { furniture, selectedFurnitureId, updateFurniture } = usePlanStore.getState();
          if (!selectedFurnitureId) return;
          
          if (document.activeElement instanceof HTMLInputElement || 
              document.activeElement instanceof HTMLTextAreaElement) return;

          let dx = 0;
          let dy = 0;
          let rotation: number | null = null;

          switch (e.key) {
              case 'ArrowUp': dy = -1; break;
              case 'ArrowDown': dy = 1; break;
              case 'ArrowLeft': dx = -1; break;
              case 'ArrowRight': dx = 1; break;
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
      const { annotations } = usePlanStore.getState();
      const data: ProjectData = { lines, polygons, furniture, annotations, scale, unit };
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
                  loadProject(data);
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

  const handleAddFurniture = useCallback((template: FurnitureTemplate) => {
      if (!scale) {
          alert("Please calibrate the plan first!");
          return;
      }
      const centerX = imgRef.current ? imgRef.current.width / 2 - (template.width * scale / 2) : 0;
      const centerY = imgRef.current ? imgRef.current.height / 2 - (template.depth * scale / 2) : 0;

      const newItem: FurnitureItem = {
          id: Math.random().toString(36).substring(2, 11),
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

  const updateFurniturePos = useCallback((id: string, x: number, y: number) => {
      updateFurniture(id, { x, y });
  }, [updateFurniture]);
  
  const updateFurnitureDim = useCallback((id: string, dim: 'width' | 'depth', value: number) => {
      updateFurniture(id, { [dim]: value });
  }, [updateFurniture]);

  const updateFurnitureRotation = useCallback((id: string, rotation: number) => {
      updateFurniture(id, { rotation });
  }, [updateFurniture]);

  const updateItemName = useCallback((id: string, name: string) => {
      updateLine(id, { name });
      updatePolygon(id, { name });
      updateFurniture(id, { name });
  }, [updateLine, updatePolygon, updateFurniture]);

  const updateItemColor = useCallback((id: string, color: string) => {
      updateLine(id, { color });
      updatePolygon(id, { color });
      updateFurniture(id, { color });
  }, [updateLine, updatePolygon, updateFurniture]);

  const deleteItem = useCallback((id: string) => {
      removeLine(id);
      removePolygon(id);
      removeFurniture(id);
  }, [removeLine, removePolygon, removeFurniture]);

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

  const toggleAnnotationsVisibility = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setIsAnnotationsVisible(v => !v);
  }, []);

  const handleAnnotationClick = useCallback((e: React.MouseEvent) => {
      if (mode !== 'annotate' || !imgRef.current) return;
      
      const rect = imgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoomScale;
      const y = (e.clientY - rect.top) / zoomScale;
      
      const newAnnotation: Annotation = {
          id: Math.random().toString(36).substr(2, 9),
          text: 'New text',
          x,
          y,
          fontSize: 14,
          color: '#1e293b',
          backgroundColor: null,
          rotation: 0
      };
      
      addAnnotation(newAnnotation);
      setSelectedAnnotationId(newAnnotation.id);
  }, [mode, zoomScale, addAnnotation]);

  
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
                 <div className="grid grid-cols-4 gap-2">
                    {[
                        { id: 'view', label: 'PAN', icon: MousePointer2 },
                        { id: 'measure', label: 'RULER', icon: Ruler },
                        { id: 'area', label: 'AREA', icon: Square },
                        { id: 'annotate', label: 'TEXT', icon: Type }
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
                    {/* Furniture Library */}
                    <div className="space-y-2">
                         <p className="technical-text mb-2">Asset Library</p>
                        <FurnitureQuickAccess
                            onSelectTemplate={handleAddFurniture}
                            onOpenLibrary={() => setIsLibraryOpen(true)}
                            isDisabled={!scale}
                        />
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
                                onUpdateRotation={updateFurnitureRotation}
                                onUpdateColor={updateItemColor} 
                                onDelete={deleteItem} 
                                hoveredId={hoveredId}
                                onHover={setHoveredId}
                            />
                        </SidebarGroup>

                        {/* Annotations */}
                        <SidebarGroup 
                            title="Notes" 
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
                                onUpdateBgColor={(id, backgroundColor) => updateAnnotation(id, { backgroundColor })}
                                onDelete={removeAnnotation} 
                                hoveredId={hoveredId}
                                onHover={setHoveredId}
                            />
                        </SidebarGroup>
                        
                        {(lines.length === 0 && polygons.length === 0 && furniture.length === 0 && annotations.length === 0) && (
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
                <button onClick={() => undo()} disabled={!canUndo} className="p-2 hover:bg-muted text-primary transition-colors disabled:opacity-30 disabled:hover:bg-transparent" title="Undo (Ctrl+Z)"><Undo2 size={20} strokeWidth={1.5} /></button>
                <button onClick={() => redo()} disabled={!canRedo} className="p-2 hover:bg-muted text-primary transition-colors disabled:opacity-30 disabled:hover:bg-transparent" title="Redo (Ctrl+Y)"><Redo2 size={20} strokeWidth={1.5} /></button>
                <div className="h-px bg-border my-1" />
                <button onClick={handleSaveProject} className="p-2 hover:bg-muted text-primary transition-colors" title="Save Project"><Save size={20} strokeWidth={1.5} /></button>
                <button onClick={handleImportClick} className="p-2 hover:bg-muted text-primary transition-colors" title="Import Project"><FolderOpen size={20} strokeWidth={1.5} /></button>
            </div>

            <div className="bg-secondary border-2 border-secondary flex flex-col p-1 shadow-[4px_4px_0px_#cbd5e1]">
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
                        onClick={handleAnnotationClick}
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

                        {/* Annotation Layer (HTML) */}
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

      {/* Furniture Library Modal */}
      <FurnitureLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onSelectTemplate={handleAddFurniture}
      />
    </div>
  );
}