import React from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SidebarGroupProps { 
    title: string;
    count: number;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    isVisible: boolean;
    onToggleVisibility: (e: React.MouseEvent) => void;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({ 
    title, 
    count, 
    children, 
    isOpen, 
    onToggle,
    isVisible,
    onToggleVisibility
}) => {
    const t = useTranslations('sidebar');
    if (count === 0) return null;
    return (
        <div className="border-2 border-border bg-white mb-2">
            <div className="flex items-center justify-between bg-muted/30 p-2 hover:bg-muted/50 transition-colors">
                <button 
                    onClick={onToggle}
                    className="flex-1 flex items-center gap-2 text-left"
                >
                    {isOpen ? <ChevronDown size={14} className="text-primary" /> : <ChevronRight size={14} className="text-primary" />}
                    <span className="font-mono text-xs font-bold uppercase text-primary tracking-wider">{title}</span>
                    <span className="bg-primary text-primary-foreground px-1.5 py-0.5 text-[10px] font-mono ml-auto mr-2">{count}</span>
                </button>
                <button 
                    onClick={onToggleVisibility}
                    className="p-1 text-muted-foreground hover:text-primary hover:bg-white border border-transparent hover:border-border transition-all"
                    title={isVisible ? t('hideLayer') : t('showLayer')}
                >
                    {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
            </div>
            {isOpen && (
                <div className="p-2 space-y-2 border-t-2 border-border bg-white">
                    {children}
                </div>
            )}
        </div>
    );
};