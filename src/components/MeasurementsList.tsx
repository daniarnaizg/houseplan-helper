import React from 'react';
import { Line } from './types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface MeasurementsListProps {
  items: Line[];
  onUpdateName: (id: string, name: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

export const MeasurementsList = React.memo(({ 
  items, 
  onUpdateName, 
  onUpdateColor, 
  onDelete,
  hoveredId,
  onHover
}: MeasurementsListProps) => {
  return (
      <>
          {items.map(item => (
              <div 
                  key={item.id} 
                  className={cn(
                      "p-2 text-xs border-l-4 transition-all hover:bg-muted/20",
                      hoveredId === item.id ? "border-l-secondary bg-blue-50/50" : "border-l-transparent hover:border-l-border"
                  )}
                  onMouseEnter={() => onHover(item.id)}
                  onMouseLeave={() => onHover(null)}
              >
                  <div className="flex items-center justify-between mb-1 gap-2">
                      <input 
                          type="text" value={item.name} onChange={(e) => onUpdateName(item.id, e.target.value)}
                          className="bg-transparent font-mono text-primary focus:outline-none border-b border-transparent focus:border-secondary w-full text-[10px] uppercase"
                      />
                      <button onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-red-500"><X size={12}/></button>
                  </div>
                  <div className="flex items-center justify-between">
                      <div className="relative w-3 h-3 border border-border bg-white">
                          <input type="color" value={item.color} onChange={(e) => onUpdateColor(item.id, e.target.value)} onClick={(e) => e.stopPropagation()} className="absolute inset-0 w-full h-full p-0 cursor-pointer opacity-0" />
                          <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: item.color }} />
                      </div>
                      <span className="text-primary font-mono font-bold">
                          {item.length?.toFixed(2)} {item.unit}
                      </span>
                  </div>
              </div>
          ))}
      </>
  );
});
MeasurementsList.displayName = 'MeasurementsList';