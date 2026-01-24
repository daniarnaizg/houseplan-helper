import React from 'react';
import { FurnitureItem } from './types';
import { cn } from '@/lib/utils';
import { X, RotateCcw, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FurnitureListProps {
  items: FurnitureItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateDim: (id: string, dim: 'width' | 'depth', value: number) => void;
  onUpdateRotation: (id: string, rotation: number) => void;
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
  onUpdateRotation,
  onUpdateColor, 
  onDelete,
  hoveredId,
  onHover
}: FurnitureListProps) => {
  const t = useTranslations('furniture');
  const tMeasurements = useTranslations('measurements');
  const tUnits = useTranslations('units');
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
                          <span>{tMeasurements('width')}</span>
                          <input type="number" step="0.1" value={item.width} onChange={(e) => onUpdateDim(item.id, 'width', parseFloat(e.target.value))} className="w-10 bg-white border border-border px-1 focus:border-secondary outline-none" />
                          <span>{tMeasurements('depth')}</span>
                          <input type="number" step="0.1" value={item.depth} onChange={(e) => onUpdateDim(item.id, 'depth', parseFloat(e.target.value))} className="w-10 bg-white border border-border px-1 focus:border-secondary outline-none" />
                      </div>
                      <div className="relative w-3 h-3 border border-border bg-white shrink-0">
                          <input type="color" value={item.color} onChange={(e) => onUpdateColor(item.id, e.target.value)} onClick={(e) => e.stopPropagation()} className="absolute inset-0 w-full h-full p-0 cursor-pointer opacity-0" />
                           <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: item.color }} />
                      </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                      <span className="text-muted-foreground font-mono text-[10px]">{tMeasurements('rotation')}</span>
                      <button 
                          onClick={(e) => { e.stopPropagation(); onUpdateRotation(item.id, (item.rotation - 90 + 360) % 360); }}
                          className="w-6 h-6 flex items-center justify-center bg-white border border-border hover:border-secondary transition-colors"
                          title={t('rotateLeft')}
                      >
                          <RotateCcw size={10} />
                      </button>
                      <input 
                          type="number" 
                          step="15" 
                          value={item.rotation} 
                          onChange={(e) => onUpdateRotation(item.id, ((parseFloat(e.target.value) || 0) % 360 + 360) % 360)} 
                          className="w-12 bg-white border border-border px-1 text-center focus:border-secondary outline-none text-[10px] font-mono"
                      />
                      <button 
                          onClick={(e) => { e.stopPropagation(); onUpdateRotation(item.id, (item.rotation + 90) % 360); }}
                          className="w-6 h-6 flex items-center justify-center bg-white border border-border hover:border-secondary transition-colors"
                          title={t('rotateRight')}
                      >
                          <RotateCw size={10} />
                      </button>
                      <span className="text-[8px] text-muted-foreground font-mono">{tUnits('degrees')}</span>
                  </div>
              </div>
          ))}
      </>
  );
});
FurnitureList.displayName = 'FurnitureList';