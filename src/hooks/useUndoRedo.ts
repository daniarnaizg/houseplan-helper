import { useEffect } from 'react';
import { useTemporalStore } from '@/store/usePlanStore';

export function useUndoRedo() {
    const { undo, redo, pastStates, futureStates } = useTemporalStore((state) => state);
    
    const pastLength = pastStates.length;
    const futureLength = futureStates.length;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } 
            // Check for Ctrl+Y or Cmd+Y (Redo)
            else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return {
        undo,
        redo,
        canUndo: pastLength > 0,
        canRedo: futureLength > 0
    };
}
