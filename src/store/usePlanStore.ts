import { create } from 'zustand';
import { temporal, type TemporalState } from 'zundo';
import { Line, Polygon, FurnitureItem, ProjectData, Mode } from '@/components/types';

interface PlanState {
    // Domain Data
    lines: Line[];
    polygons: Polygon[];
    furniture: FurnitureItem[];
    scale: number | null;
    unit: string;
    
    // Editor State
    mode: Mode;
    selectedFurnitureId: string | null;

    // Actions
    setMode: (mode: Mode) => void;
    setScale: (scale: number) => void;
    setUnit: (unit: string) => void;
    
    // Bulk Setters
    setLines: (lines: Line[]) => void;
    setPolygons: (polygons: Polygon[]) => void;
    setFurniture: (furniture: FurnitureItem[]) => void;

    // Line Actions
    addLine: (line: Line) => void;
    updateLine: (id: string, updates: Partial<Line>) => void;
    removeLine: (id: string) => void;

    // Polygon Actions
    addPolygon: (polygon: Polygon) => void;
    updatePolygon: (id: string, updates: Partial<Polygon>) => void;
    removePolygon: (id: string) => void;

    // Furniture Actions
    addFurniture: (item: FurnitureItem) => void;
    updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
    removeFurniture: (id: string) => void;
    setSelectedFurnitureId: (id: string | null) => void;

    // Project Actions
    loadProject: (data: ProjectData) => void;
    reset: () => void;
}

export const usePlanStore = create<PlanState>()(
    temporal(
        (set) => ({
            lines: [],
            polygons: [],
            furniture: [],
            scale: null,
            unit: 'm',
            mode: 'view',
            selectedFurnitureId: null,

            setMode: (mode) => set({ mode }),
            setScale: (scale) => set({ scale }),
            setUnit: (unit) => set({ unit }),

            setLines: (lines) => set({ lines }),
            setPolygons: (polygons) => set({ polygons }),
            setFurniture: (furniture) => set({ furniture }),

            addLine: (line) => set((state) => ({ lines: [...state.lines, line] })),
            updateLine: (id, updates) => set((state) => ({
                lines: state.lines.map((l) => (l.id === id ? { ...l, ...updates } : l)),
            })),
            removeLine: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),

            addPolygon: (polygon) => set((state) => ({ polygons: [...state.polygons, polygon] })),
            updatePolygon: (id, updates) => set((state) => ({
                polygons: state.polygons.map((p) => (p.id === id ? { ...p, ...updates } : p)),
            })),
            removePolygon: (id) => set((state) => ({ polygons: state.polygons.filter((p) => p.id !== id) })),

            addFurniture: (item) => set((state) => ({ furniture: [...state.furniture, item] })),
            updateFurniture: (id, updates) => set((state) => ({
                furniture: state.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
            })),
            removeFurniture: (id) => set((state) => ({ furniture: state.furniture.filter((f) => f.id !== id) })),
            setSelectedFurnitureId: (id) => set({ selectedFurnitureId: id }),

            loadProject: (data) => set({
                lines: data.lines || [],
                polygons: data.polygons || [],
                furniture: data.furniture || [],
                scale: data.scale || null,
                unit: data.unit || 'm',
            }),
            
            reset: () => set({
                lines: [],
                polygons: [],
                furniture: [],
                scale: null,
                unit: 'm',
                mode: 'view',
                selectedFurnitureId: null
            })
        }),
        {
            partialize: (state) => {
                const { lines, polygons, furniture, scale, unit } = state;
                return { lines, polygons, furniture, scale, unit };
            },
            limit: 100 // Limit history stack
        }
    )
);

// Helper hook for using the temporal store
import { useStore } from 'zustand';

export const useTemporalStore = <T>(
  selector: (state: TemporalState<PlanState>) => T,
) => useStore(usePlanStore.temporal, selector);