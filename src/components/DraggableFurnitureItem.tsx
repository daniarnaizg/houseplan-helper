import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { cn } from '@/lib/utils';
import { FurnitureItem } from './types';

interface DraggableFurnitureItemProps {
  item: FurnitureItem;
  calibrationScale: number;
  zoomScale: number;
  updatePos: (id: string, x: number, y: number) => void;
  isSelected: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
}

export const DraggableFurnitureItem: React.FC<DraggableFurnitureItemProps> = ({ 
  item, 
  calibrationScale,
  zoomScale, 
  updatePos, 
  isSelected,
  onSelect,
  onHover
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  const widthPx = item.width * calibrationScale;
  const depthPx = item.depth * calibrationScale;

  // Determine if rotation is approximately 90 or 270 degrees
  // This allows us to swap the bounding box dimensions for better hit testing
  const normalizedRotation = ((item.rotation % 360) + 360) % 360;
  const isRotated90or270 = Math.abs(normalizedRotation - 90) < 1 || Math.abs(normalizedRotation - 270) < 1;

  const boxWidth = isRotated90or270 ? depthPx : widthPx;
  const boxHeight = isRotated90or270 ? widthPx : depthPx;
  
  return (
      <Draggable
          nodeRef={nodeRef}
          position={{ x: item.x, y: item.y }}
          scale={zoomScale}
          onStart={(e: any) => {
              e.stopPropagation(); 
              onSelect();
          }}
          onStop={(e: any, data: any) => {
              e.stopPropagation();
              updatePos(item.id, data.x, data.y);
          }}
          onMouseDown={(e: any) => e.stopPropagation()}
      >
          <div 
              ref={nodeRef}
              onMouseEnter={() => onHover(item.id)}
              onMouseLeave={() => onHover(null)}
              className={cn(
                  "absolute cursor-move pointer-events-auto transition-all",
                  isSelected ? "z-50" : "hover:brightness-95"
              )}
              style={{
                  width: boxWidth,
                  height: boxHeight,
              }}
          >
              <div 
                  className="flex flex-col items-center justify-center relative"
                  style={{
                      backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: item.color,
                      borderWidth: '2px',
                      borderStyle: isSelected ? 'dashed' : 'solid',
                      boxShadow: isSelected ? '0 0 0 2px white' : 'none',
                      
                      // Center the visual representation within the bounding box
                      position: 'absolute',
                      width: widthPx,
                      height: depthPx,
                      left: '50%',
                      top: '50%',
                      marginLeft: -widthPx / 2,
                      marginTop: -depthPx / 2,
                      
                      transform: `rotate(${item.rotation}deg)`,
                      transformOrigin: 'center center'
                  }}
              >
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] pointer-events-none" />
                  
                  <span className="text-[10px] font-mono font-bold leading-none pointer-events-none truncate max-w-full px-1 bg-white/80" style={{ color: item.color }}>
                      {item.name}
                  </span>
                  
                  {(isSelected || (item.width * calibrationScale) > 60) && (
                      <span className="text-[8px] font-mono leading-none pointer-events-none mt-0.5 bg-white/80 px-1 border border-gray-200" style={{ color: '#000' }}>
                          {item.width}m x {item.depth}m
                      </span>
                  )}
                  
                  {/* Corner Handles for visual effect */}
                  {isSelected && (
                      <>
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-black" />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-black" />
                          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-black" />
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-black" />
                      </>
                  )}
              </div>
          </div>
      </Draggable>
  );
};