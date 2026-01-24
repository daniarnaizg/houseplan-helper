import React from 'react';
import { FurnitureTemplate } from './types';
import { useFurnitureLibraryStore } from '@/store/useFurnitureLibraryStore';
import { cn } from '@/lib/utils';
import { Library } from 'lucide-react';

interface FurnitureQuickAccessProps {
    onSelectTemplate: (template: FurnitureTemplate) => void;
    onOpenLibrary: () => void;
    isDisabled: boolean;
}

export const FurnitureQuickAccess: React.FC<FurnitureQuickAccessProps> = ({
    onSelectTemplate,
    onOpenLibrary,
    isDisabled
}) => {
    const { getRecentTemplates, addToRecent } = useFurnitureLibraryStore();
    const recentTemplates = getRecentTemplates();

    const handleSelect = (template: FurnitureTemplate) => {
        addToRecent(template.id);
        onSelectTemplate(template);
    };

    return (
        <div className="space-y-2">
            {/* Recent Items */}
            {recentTemplates.length > 0 && (
                <div className="space-y-1">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Recent</p>
                    <div className="grid grid-cols-2 gap-1">
                        {recentTemplates.map(template => (
                            <button
                                type="button"
                                key={template.id}
                                onClick={() => handleSelect(template)}
                                disabled={isDisabled}
                                className={cn(
                                    "flex items-center p-2 bg-white hover:bg-muted border border-border hover:border-primary transition-colors gap-2 group disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-border"
                                )}
                            >
                                <span className="text-base filter grayscale group-hover:grayscale-0 transition-all">
                                    {template.icon}
                                </span>
                                <div className="flex-1 min-w-0 text-left">
                                    <span className="text-[10px] font-mono font-bold text-primary block truncate">
                                        {template.name}
                                    </span>
                                    <span className="text-[8px] text-muted-foreground font-mono">
                                        {template.width}x{template.depth}m
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Open Library Button */}
            <button
                type="button"
                onClick={onOpenLibrary}
                disabled={isDisabled}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold uppercase tracking-wider border-2 transition-all",
                    "bg-white text-primary border-border hover:border-primary hover:bg-muted disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-border"
                )}
            >
                <Library size={14} />
                {recentTemplates.length > 0 ? 'Browse All Furniture' : 'Open Furniture Library'}
            </button>
        </div>
    );
};

FurnitureQuickAccess.displayName = 'FurnitureQuickAccess';
