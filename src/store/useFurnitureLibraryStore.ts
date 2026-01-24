import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FurnitureTemplate } from '@/components/types';

// Built-in furniture templates
const BUILT_IN_TEMPLATES: FurnitureTemplate[] = [
    // Bedroom
    { id: 'bed-single', name: 'Single Bed', width: 0.9, depth: 1.9, icon: '🛏️', defaultColor: '#3b82f6', category: 'bedroom', isBuiltIn: true },
    { id: 'bed-double', name: 'Double Bed', width: 1.4, depth: 1.9, icon: '🛏️', defaultColor: '#3b82f6', category: 'bedroom', isBuiltIn: true },
    { id: 'bed-queen', name: 'Queen Bed', width: 1.5, depth: 2.0, icon: '🛏️', defaultColor: '#3b82f6', category: 'bedroom', isBuiltIn: true },
    { id: 'bed-king', name: 'King Bed', width: 1.8, depth: 2.0, icon: '🛏️', defaultColor: '#3b82f6', category: 'bedroom', isBuiltIn: true },
    { id: 'wardrobe', name: 'Wardrobe', width: 1.2, depth: 0.6, icon: '🚪', defaultColor: '#78716c', category: 'bedroom', isBuiltIn: true },
    { id: 'nightstand', name: 'Nightstand', width: 0.5, depth: 0.4, icon: '🪑', defaultColor: '#a8a29e', category: 'bedroom', isBuiltIn: true },

    // Living Room
    { id: 'sofa-2seat', name: '2-Seat Sofa', width: 1.6, depth: 0.9, icon: '🛋️', defaultColor: '#6b7280', category: 'living', isBuiltIn: true },
    { id: 'sofa-3seat', name: '3-Seat Sofa', width: 2.4, depth: 0.9, icon: '🛋️', defaultColor: '#6b7280', category: 'living', isBuiltIn: true },
    { id: 'armchair', name: 'Armchair', width: 0.9, depth: 0.85, icon: '🪑', defaultColor: '#6b7280', category: 'living', isBuiltIn: true },
    { id: 'coffee-table', name: 'Coffee Table', width: 1.2, depth: 0.6, icon: '🪵', defaultColor: '#854d0e', category: 'living', isBuiltIn: true },
    { id: 'tv-stand', name: 'TV Stand', width: 1.5, depth: 0.45, icon: '📺', defaultColor: '#1c1917', category: 'living', isBuiltIn: true },

    // Kitchen/Dining
    { id: 'dining-table-4', name: 'Dining Table (4)', width: 1.2, depth: 0.8, icon: '🪑', defaultColor: '#854d0e', category: 'kitchen', isBuiltIn: true },
    { id: 'dining-table-6', name: 'Dining Table (6)', width: 1.8, depth: 0.9, icon: '🪑', defaultColor: '#854d0e', category: 'kitchen', isBuiltIn: true },
    { id: 'dining-chair', name: 'Dining Chair', width: 0.45, depth: 0.45, icon: '🪑', defaultColor: '#a8a29e', category: 'kitchen', isBuiltIn: true },
    { id: 'fridge', name: 'Refrigerator', width: 0.7, depth: 0.7, icon: '🧊', defaultColor: '#e5e5e5', category: 'kitchen', isBuiltIn: true },
    { id: 'stove', name: 'Stove/Oven', width: 0.6, depth: 0.6, icon: '🍳', defaultColor: '#404040', category: 'kitchen', isBuiltIn: true },

    // Office
    { id: 'desk-small', name: 'Small Desk', width: 1.2, depth: 0.6, icon: '🖥️', defaultColor: '#d97706', category: 'office', isBuiltIn: true },
    { id: 'desk-large', name: 'Large Desk', width: 1.8, depth: 0.8, icon: '🖥️', defaultColor: '#d97706', category: 'office', isBuiltIn: true },
    { id: 'office-chair', name: 'Office Chair', width: 0.6, depth: 0.6, icon: '💺', defaultColor: '#1e293b', category: 'office', isBuiltIn: true },
    { id: 'bookshelf', name: 'Bookshelf', width: 0.8, depth: 0.3, icon: '📚', defaultColor: '#78716c', category: 'office', isBuiltIn: true },

    // Bathroom
    { id: 'toilet', name: 'Toilet', width: 0.4, depth: 0.65, icon: '🚽', defaultColor: '#fafafa', category: 'bathroom', isBuiltIn: true },
    { id: 'bathtub', name: 'Bathtub', width: 0.7, depth: 1.7, icon: '🛁', defaultColor: '#fafafa', category: 'bathroom', isBuiltIn: true },
    { id: 'shower', name: 'Shower', width: 0.9, depth: 0.9, icon: '🚿', defaultColor: '#e5e5e5', category: 'bathroom', isBuiltIn: true },
    { id: 'sink-bathroom', name: 'Bathroom Sink', width: 0.6, depth: 0.45, icon: '🚰', defaultColor: '#fafafa', category: 'bathroom', isBuiltIn: true },

    // Generic
    { id: 'custom', name: 'Custom', width: 1.0, depth: 1.0, icon: '📦', defaultColor: '#ef4444', category: 'custom', isBuiltIn: true },
];

const MAX_RECENT_ITEMS = 5;

interface FurnitureLibraryState {
    customTemplates: FurnitureTemplate[];
    recentTemplateIds: string[];  // Last 5 used template IDs
    
    // Actions
    addTemplate: (template: Omit<FurnitureTemplate, 'id' | 'isBuiltIn'>) => void;
    updateTemplate: (id: string, updates: Partial<FurnitureTemplate>) => void;
    removeTemplate: (id: string) => void;
    duplicateTemplate: (id: string) => void;
    addToRecent: (templateId: string) => void;
    
    // Getters
    getAllTemplates: () => FurnitureTemplate[];
    getTemplateById: (id: string) => FurnitureTemplate | undefined;
    getTemplatesByCategory: (category: string) => FurnitureTemplate[];
    getRecentTemplates: () => FurnitureTemplate[];
}

export const useFurnitureLibraryStore = create<FurnitureLibraryState>()(
    persist(
        (set, get) => ({
            customTemplates: [],
            recentTemplateIds: [],

            addTemplate: (template) => {
                const newTemplate: FurnitureTemplate = {
                    ...template,
                    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    isBuiltIn: false,
                };
                set((state) => ({
                    customTemplates: [...state.customTemplates, newTemplate]
                }));
            },

            updateTemplate: (id, updates) => {
                set((state) => ({
                    customTemplates: state.customTemplates.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    )
                }));
            },

            removeTemplate: (id) => {
                set((state) => ({
                    customTemplates: state.customTemplates.filter((t) => t.id !== id),
                    // Also remove from recent if present
                    recentTemplateIds: state.recentTemplateIds.filter((rid) => rid !== id)
                }));
            },

            duplicateTemplate: (id) => {
                const template = get().getTemplateById(id);
                if (template) {
                    get().addTemplate({
                        name: `${template.name} (Copy)`,
                        width: template.width,
                        depth: template.depth,
                        icon: template.icon,
                        defaultColor: template.defaultColor,
                        category: template.category,
                    });
                }
            },

            addToRecent: (templateId) => {
                set((state) => {
                    // Remove if already exists, then add to front
                    const filtered = state.recentTemplateIds.filter((id) => id !== templateId);
                    const updated = [templateId, ...filtered].slice(0, MAX_RECENT_ITEMS);
                    return { recentTemplateIds: updated };
                });
            },

            getAllTemplates: () => {
                return [...BUILT_IN_TEMPLATES, ...get().customTemplates];
            },

            getTemplateById: (id) => {
                return get().getAllTemplates().find((t) => t.id === id);
            },

            getTemplatesByCategory: (category) => {
                return get().getAllTemplates().filter((t) => t.category === category);
            },

            getRecentTemplates: () => {
                const { recentTemplateIds } = get();
                const allTemplates = get().getAllTemplates();
                return recentTemplateIds
                    .map((id) => allTemplates.find((t) => t.id === id))
                    .filter((t): t is FurnitureTemplate => t !== undefined);
            },
        }),
        {
            name: 'houseplan-furniture-library',
            version: 1,
        }
    )
);

// Export built-in templates for reference
export { BUILT_IN_TEMPLATES };

// Export categories
export const FURNITURE_CATEGORIES = [
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
    { id: 'living', name: 'Living Room', icon: '🛋️' },
    { id: 'kitchen', name: 'Kitchen/Dining', icon: '🍽️' },
    { id: 'office', name: 'Office', icon: '💼' },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿' },
    { id: 'custom', name: 'Custom', icon: '📦' },
];
