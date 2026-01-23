export interface Point {
    x: number;
    y: number;
}

/**
 * Calculates the Euclidean distance between two points.
 */
export const calculateDistance = (p1: Point, p2: Point): number => {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
};

/**
 * Calculates the area of a polygon using the Shoelace formula.
 * @param points Array of vertices
 * @param scale Pixels per unit (e.g., pixels per meter)
 * @returns Area in square units
 */
export const calculatePolygonArea = (points: Point[], scale: number): number => {
    const len = points.length;
    if (len < 3) return 0;
    let area = 0;
    for (let i = 0; i < len; i++) {
        const j = (i + 1) % len;
        const p1 = points[i];
        const p2 = points[j];
        area += p1.x * p2.y;
        area -= p2.x * p1.y;
    }
    return (Math.abs(area) / 2) / (scale * scale);
};

/**
 * Converts a pixel length to a real-world unit length based on scale.
 */
export const pixelsToUnit = (pixels: number, scale: number): number => {
    if (scale === 0) return 0;
    return pixels / scale;
};
