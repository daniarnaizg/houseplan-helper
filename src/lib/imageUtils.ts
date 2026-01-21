export const rotateImage = (src: string, direction: 'cw' | 'ccw'): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.height;
            canvas.height = img.width;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No context');

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(direction === 'cw' ? 90 * Math.PI / 180 : -90 * Math.PI / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            
            resolve(canvas.toDataURL());
        };
        img.onerror = reject;
    });
};

// Calculate polygon area (Shoelace formula)
export const calculatePolygonArea = (points: {x: number, y: number}[], scale: number): number => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return (Math.abs(area) / 2) / (scale * scale);
};
