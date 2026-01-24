export type Mode = 'view' | 'calibrate' | 'measure' | 'area' | 'annotate';

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  id: string;
  start: Point;
  end: Point;
  length?: number;
  unit?: string;
  name: string;
  color: string;
}

export interface Polygon {
  id: string;
  points: Point[];
  area?: number;
  unit?: string;
  name: string;
  color: string;
}

// Furniture template for the library
export interface FurnitureTemplate {
  id: string;
  name: string;
  width: number;        // meters
  depth: number;        // meters
  icon: string;         // emoji or icon identifier
  defaultColor: string;
  category: string;     // 'bedroom', 'living', 'kitchen', 'office', 'bathroom', 'custom'
  isBuiltIn: boolean;   // true for default items, false for user-created
}

export interface FurnitureItem {
  id: string;
  templateId: string;     // Reference to template instead of hardcoded type
  name: string;
  width: number; // Real world width in meters
  depth: number; // Real world depth in meters
  x: number;
  y: number;
  rotation: number;
  color: string;
}

export interface Annotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;      // in pixels (default: 14)
  color: string;
  backgroundColor: string | null;  // null = transparent
  rotation: number;      // degrees (default: 0)
}

export interface ProjectData {
    lines: Line[];
    polygons: Polygon[];
    furniture: FurnitureItem[];
    annotations: Annotation[];
    scale: number | null;
    unit: string;
}