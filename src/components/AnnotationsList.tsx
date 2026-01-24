import React from 'react';
import { Annotation } from './types';
import { cn } from '@/lib/utils';
import { X, Type } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AnnotationsListProps {
    items: Annotation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onUpdateText: (id: string, text: string) => void;
    onUpdateFontSize: (id: string, fontSize: number) => void;
    onUpdateColor: (id: string, color: string) => void;
    onUpdateBgColor: (id: string, bgColor: string | null) => void;
    onDelete: (id: string) => void;
    hoveredId: string | null;
    onHover: (id: string | null) => void;
}

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32];

export const AnnotationsList = React.memo(({
    items,
    selectedId,
    onSelect,
    onUpdateText,
    onUpdateFontSize,
    onUpdateColor,
    onUpdateBgColor,
    onDelete,
    hoveredId,
    onHover
}: AnnotationsListProps) => {
    const t = useTranslations('annotations');
    return (
        <>
            {items.map(item => (
                <div
                    key={item.id}
                    className={cn(
                        "p-2 text-xs border-l-4 transition-all cursor-pointer",
                        selectedId === item.id 
                            ? "border-l-secondary bg-blue-50" 
                            : (hoveredId === item.id 
                                ? "border-l-secondary/50 bg-gray-50" 
                                : "border-l-transparent hover:border-l-border")
                    )}
                    onClick={() => onSelect(item.id)}
                    onMouseEnter={() => onHover(item.id)}
                    onMouseLeave={() => onHover(null)}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <Type size={10} className="text-muted-foreground shrink-0" />
                            <input
                                type="text"
                                value={item.text}
                                onChange={(e) => onUpdateText(item.id, e.target.value)}
                                placeholder={t('enterText')}
                                className="bg-transparent font-mono text-primary focus:outline-none border-b border-transparent focus:border-secondary flex-1 min-w-0 text-[10px] truncate"
                            />
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                            className="text-muted-foreground hover:text-red-500 shrink-0 ml-1"
                        >
                            <X size={12} />
                        </button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 gap-2">
                        {/* Font Size Selector */}
                        <div className="flex items-center gap-1">
                            <span className="text-muted-foreground font-mono text-[10px]">{t('size')}</span>
                            <select
                                value={item.fontSize}
                                onChange={(e) => onUpdateFontSize(item.id, parseInt(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] bg-white border border-border px-1 focus:border-secondary outline-none font-mono"
                            >
                                {FONT_SIZES.map(size => (
                                    <option key={size} value={size}>{size}px</option>
                                ))}
                            </select>
                        </div>

                        {/* Color Pickers */}
                        <div className="flex items-center gap-2">
                            {/* Text Color */}
                            <div className="relative w-4 h-4 border border-border bg-white shrink-0" title={t('textColor')}>
                                <input
                                    type="color"
                                    value={item.color}
                                    onChange={(e) => onUpdateColor(item.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute inset-0 w-full h-full p-0 cursor-pointer opacity-0"
                                />
                                <div className="absolute inset-0.5" style={{ backgroundColor: item.color }} />
                                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white mix-blend-difference">T</span>
                            </div>
                            
                            {/* Background Color */}
                            <div className="relative w-4 h-4 border border-border bg-white shrink-0" title={t('backgroundColor')}>
                                <input
                                    type="color"
                                    value={item.backgroundColor || '#ffffff'}
                                    onChange={(e) => onUpdateBgColor(item.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute inset-0 w-full h-full p-0 cursor-pointer opacity-0"
                                />
                                <div 
                                    className="absolute inset-0.5" 
                                    style={{ 
                                        backgroundColor: item.backgroundColor || 'transparent',
                                        backgroundImage: !item.backgroundColor 
                                            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
                                            : 'none',
                                        backgroundSize: '4px 4px',
                                        backgroundPosition: '0 0, 2px 2px'
                                    }} 
                                />
                            </div>
                            
                            {/* Clear Background Button */}
                            {item.backgroundColor && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateBgColor(item.id, null); }}
                                    className="text-[8px] text-muted-foreground hover:text-primary font-mono"
                                    title={t('removeBackground')}
                                >
                                    {t('clear')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
});

AnnotationsList.displayName = 'AnnotationsList';
