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

