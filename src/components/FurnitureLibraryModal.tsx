import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { FurnitureTemplate } from './types';
import { useFurnitureLibraryStore, FURNITURE_CATEGORIES, BUILT_IN_TEMPLATES } from '@/store/useFurnitureLibraryStore';
import { cn } from '@/lib/utils';
import { X, Plus, Trash2, Copy, Search, ChevronDown, ChevronRight } from 'lucide-react';

interface FurnitureLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: FurnitureTemplate) => void;
}

export const FurnitureLibraryModal: React.FC<FurnitureLibraryModalProps> = ({
    isOpen,
    onClose,
    onSelectTemplate
}) => {
    const t = useTranslations('furniture');
    const tCommon = useTranslations('common');
    
    const { 
        customTemplates,
        addTemplate, 
        removeTemplate, 
        duplicateTemplate, 
        addToRecent 
    } = useFurnitureLibraryStore();

    // Stable computation of all templates
    const allTemplates = useMemo(() => 
        [...BUILT_IN_TEMPLATES, ...customTemplates], 
        [customTemplates]
    );

    const getTemplatesByCategory = useCallback((category: string) => 
        allTemplates.filter(t => t.category === category),
        [allTemplates]
    );
    
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        bedroom: true,
        living: false,
        kitchen: false,
        office: false,
        bathroom: false,
        custom: true,
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    // Form state for creating custom items
    const [formData, setFormData] = useState({
        name: '',
        width: 1.0,
        depth: 1.0,
        icon: '📦',
        defaultColor: '#6b7280',
        category: 'custom'
    });

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleSelect = (template: FurnitureTemplate) => {
        addToRecent(template.id);
        onSelectTemplate(template);
        onClose();
    };

    const handleCreateTemplate = () => {
        if (!formData.name.trim()) return;
        
        addTemplate({
            name: formData.name,
            width: formData.width,
            depth: formData.depth,
            icon: formData.icon,
            defaultColor: formData.defaultColor,
            category: formData.category,
        });
        
        setFormData({ name: '', width: 1.0, depth: 1.0, icon: '📦', defaultColor: '#6b7280', category: 'custom' });
        setShowCreateForm(false);
    };

    // Filter templates by search query
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return null;
        
        const query = searchQuery.toLowerCase();
        return allTemplates.filter(t => t.name.toLowerCase().includes(query));
    }, [searchQuery, allTemplates]);

    const EMOJI_OPTIONS = ['📦', '🪑', '🛏️', '🛋️', '🚪', '📺', '🖥️', '💺', '📚', '🪵', '🧊', '🍳', '🚽', '🛁', '🚿', '🚰', '🪴', '💡', '🖼️', '⭐'];

    // Helper function to get translated name for a template
    const getTranslatedName = useCallback((template: FurnitureTemplate) => {
        // For built-in templates, use translation; for custom templates, use the name directly
        if (template.isBuiltIn) {
            return t(`items.${template.id}`);
        }
        return template.name;
    }, [t]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="furniture-library-title"
        >
            <div className="bg-white w-full max-w-2xl max-h-[80vh] flex flex-col border-2 border-border shadow-[8px_8px_0px_#00000020]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-border">
                    <h2 id="furniture-library-title" className="text-sm font-bold uppercase tracking-wider">{t('library')}</h2>
                    <button type="button" onClick={onClose} className="p-1 hover:bg-muted" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-border">
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('search')}
                            className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-border focus:border-secondary outline-none"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {/* Search Results */}
                    {filteredCategories !== null ? (
                        <div className="space-y-1">
                            <p className="text-[10px] font-mono text-muted-foreground mb-2">
                                {filteredCategories.length} results for "{searchQuery}"
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {filteredCategories.map(template => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        translatedName={getTranslatedName(template)}
                                        onSelect={handleSelect}
                                        onDuplicate={duplicateTemplate}
                                        onDelete={removeTemplate}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Category Lists */
                        FURNITURE_CATEGORIES.map(category => {
                            const templates = getTemplatesByCategory(category.id);
                            const isExpanded = expandedCategories[category.id];
                            
                            return (
                                <div key={category.id} className="border border-border">
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(category.id)}
                                        className="w-full flex items-center justify-between p-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{category.icon}</span>
                                            <span className="text-[10px] font-mono font-bold uppercase">{t(`categories.${category.id}`)}</span>
                                            <span className="text-[9px] text-muted-foreground">({templates.length})</span>
                                        </div>
                                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </button>
                                    
                                    {isExpanded && (
                                        <div className="p-2 grid grid-cols-3 gap-2">
                                            {templates.map(template => (
                                                <TemplateCard
                                                    key={template.id}
                                                    template={template}
                                                    translatedName={getTranslatedName(template)}
                                                    onSelect={handleSelect}
                                                    onDuplicate={duplicateTemplate}
                                                    onDelete={removeTemplate}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer - Create Custom */}
                <div className="p-3 border-t-2 border-border">
                    {!showCreateForm ? (
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold uppercase tracking-wider bg-white text-primary border-2 border-border hover:border-primary transition-all"
                        >
                            <Plus size={14} />
                            {t('createCustom')}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder={t('itemName')}
                                    className="flex-1 px-2 py-1 text-xs font-mono border border-border focus:border-secondary outline-none"
                                />
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="px-2 py-1 text-xs font-mono border border-border focus:border-secondary outline-none"
                                >
                                    {FURNITURE_CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{t(`categories.${cat.id}`)}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[9px] text-muted-foreground font-mono">{t('width', { unit: 'm' })}</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={formData.width}
                                        onChange={(e) => setFormData(prev => ({ ...prev, width: parseFloat(e.target.value) || 0.1 }))}
                                        className="w-full px-2 py-1 text-xs font-mono border border-border focus:border-secondary outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[9px] text-muted-foreground font-mono">{t('depth', { unit: 'm' })}</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={formData.depth}
                                        onChange={(e) => setFormData(prev => ({ ...prev, depth: parseFloat(e.target.value) || 0.1 }))}
                                        className="w-full px-2 py-1 text-xs font-mono border border-border focus:border-secondary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-muted-foreground font-mono">{t('color')}</label>
                                    <input
                                        type="color"
                                        value={formData.defaultColor}
                                        onChange={(e) => setFormData(prev => ({ ...prev, defaultColor: e.target.value }))}
                                        className="w-full h-[26px] border border-border cursor-pointer"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[9px] text-muted-foreground font-mono">{t('icon')}</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            type="button"
                                            key={emoji}
                                            onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                                            className={cn(
                                                "w-7 h-7 flex items-center justify-center text-sm border",
                                                formData.icon === emoji
                                                    ? "border-secondary bg-secondary/10"
                                                    : "border-border hover:border-primary"
                                            )}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-3 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary"
                                >
                                    {tCommon('cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateTemplate}
                                    disabled={!formData.name.trim()}
                                    className="px-3 py-1 text-[10px] font-mono font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {tCommon('create')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Template Card Component
interface TemplateCardProps {
    template: FurnitureTemplate;
    translatedName: string;
    onSelect: (template: FurnitureTemplate) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, translatedName, onSelect, onDuplicate, onDelete }) => {
    return (
        <div className="group relative">
            <button
                type="button"
                onClick={() => onSelect(template)}
                className="w-full flex items-center p-2 bg-white hover:bg-muted border border-border hover:border-primary transition-all gap-2 text-left"
            >
                <span className="text-lg filter grayscale group-hover:grayscale-0 transition-all">
                    {template.icon}
                </span>
                <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-primary block truncate">
                        {translatedName}
                    </span>
                    <span className="text-[8px] text-muted-foreground font-mono">
                        {template.width}x{template.depth}m
                    </span>
                </div>
            </button>
            
            {/* Actions for custom templates */}
            {!template.isBuiltIn && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDuplicate(template.id); }}
                        className="p-1 bg-white border border-border hover:border-primary text-muted-foreground hover:text-primary"
                        title="Duplicate"
                        aria-label="Duplicate template"
                    >
                        <Copy size={10} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
                        className="p-1 bg-white border border-border hover:border-red-500 text-muted-foreground hover:text-red-500"
                        title="Delete"
                        aria-label="Delete template"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
            )}
        </div>
    );
};

FurnitureLibraryModal.displayName = 'FurnitureLibraryModal';
