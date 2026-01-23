import React from 'react';
import { FurnitureItem } from './types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface FurnitureListProps {
  items: FurnitureItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateDim: (id: string, dim: 'width' | 'depth', value: number) => void;
  onUpdateColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

export const FurnitureList = React.memo(({ 
  items, 
  selectedId,
  onSelect,
  onUpdateName, 
  onUpdateDim,
  onUpdateColor, 
  onDelete,
  hoveredId,
  onHover
}: FurnitureListProps) => {
  return (
      <>
          {items.map(item => (
              <div 
                  key={item.id} 
                  className={cn(
                      "p-2 text-xs border-l-4 transition-all cursor-pointer", 
                      selectedId === item.id ? "border-l-secondary bg-blue-50" : (hoveredId === item.id ? "border-l-secondary/50 bg-gray-50" : "border-l-transparent hover:border-l-border")
                  )} 
                  onClick={() => onSelect(item.id)}
                  onMouseEnter={() => onHover(item.id)}
                  onMouseLeave={() => onHover(null)}
              >
                  <div className="flex items-center justify-between mb-1">
                      <input 
                          type="text" value={item.name} onChange={(e) => onUpdateName(item.id, e.target.value)}
                          className="bg-transparent font-mono text-primary focus:outline-none border-b border-transparent focus:border-secondary w-24 text-[10px] uppercase"
                      />
                      <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="text-muted-foreground hover:text-red-500"><X size={12}/></button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-2 items-center text-muted-foreground font-mono text-[10px]">
                          <span>W:</span>
                          <input type="number" step="0.1" value={item.width} onChange={(e) => onUpdateDim(item.id, 'width', parseFloat(e.target.value))} className="w-10 bg-white border border-border px-1 focus:border-secondary outline-none" />
                          <span>D:</span>
                          <input type="number" step="0.1" value={item.depth} onChange={(e) => onUpdateDim(item.id, 'depth', parseFloat(e.target.value))} className="w-10 bg-white border border-border px-1 focus:border-secondary outline-none" />
                      </div>
                      <div className="relative w-3 h-3 border border-border bg-white shrink-0">
                          <input type="color" value={item.color} onChange={(e) => onUpdateColor(item.id, e.target.value)} className="absolute inset-0 w-full h-full p-0 cursor-pointer opacity-0" />
                           <div className="absolute inset-0" style={{ backgroundColor: item.color }} />
                      </div>
                  </div>
              </div>
          ))}
      </>
  );
});
FurnitureList.displayName = 'FurnitureList';