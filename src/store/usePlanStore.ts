import { create } from 'zustand';
import { temporal, type TemporalState } from 'zundo';
import { Line, Polygon, FurnitureItem, Annotation, ProjectData, Mode } from '@/components/types';

interface PlanState {
    // Domain Data
    lines: Line[];
    polygons: Polygon[];
    furniture: FurnitureItem[];
    annotations: Annotation[];
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
    setAnnotations: (annotations: Annotation[]) => void;

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

    // Annotation Actions
    addAnnotation: (annotation: Annotation) => void;
    updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
    removeAnnotation: (id: string) => void;

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
            annotations: [],
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
            setAnnotations: (annotations) => set({ annotations }),

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

            addAnnotation: (annotation) => set((state) => ({ annotations: [...state.annotations, annotation] })),
            updateAnnotation: (id, updates) => set((state) => ({
                annotations: state.annotations.map((a) => (a.id === id ? { ...a, ...updates } : a)),
            })),
            removeAnnotation: (id) => set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) })),

            loadProject: (data) => {
                // Migrate old furniture items that use 'type' instead of 'templateId'
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const migratedFurniture = (data.furniture || []).map((item: any) => {
                    // Check if item has old 'type' field instead of 'templateId'
                    if ('type' in item && !('templateId' in item)) {
                        // Map old types to new template IDs
                        const typeToTemplateMap: Record<string, string> = {
                            'bed': 'bed-queen',
                            'sofa': 'sofa-3seat',
                            'table': 'dining-table-4',
                            'toilet': 'desk-small',  // Note: 'toilet' type was actually 'Desk' in old code
                            'custom': 'custom'
                        };
                        return {
                            id: item.id,
                            templateId: typeToTemplateMap[item.type] || 'custom',
                            name: item.name,
                            width: item.width,
                            depth: item.depth,
                            x: item.x,
                            y: item.y,
                            rotation: item.rotation,
                            color: item.color
                        };
                    }
                    return item;
                });

                set({
                    lines: data.lines || [],
                    polygons: data.polygons || [],
                    furniture: migratedFurniture,
                    annotations: data.annotations || [],
                    scale: data.scale || null,
                    unit: data.unit || 'm',
                });
            },
            
            reset: () => set({
                lines: [],
                polygons: [],
                furniture: [],
                annotations: [],
                scale: null,
                unit: 'm',
                mode: 'view',
                selectedFurnitureId: null
            })
        }),
        {
            partialize: (state) => {
                const { lines, polygons, furniture, annotations, scale, unit } = state;
                return { lines, polygons, furniture, annotations, scale, unit };
            },
            limit: 100 // Limit history stack
        }
    )
);

// Helper hook for using the temporal store
import { useStore } from 'zustand';

type PlanStatePartial = Pick<PlanState, 'lines' | 'polygons' | 'furniture' | 'annotations' | 'scale' | 'unit'>;

export const useTemporalStore = <T>(
  selector: (state: TemporalState<PlanStatePartial>) => T,
) => useStore(usePlanStore.temporal, selector);