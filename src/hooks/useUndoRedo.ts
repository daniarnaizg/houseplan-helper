import { useEffect } from 'react';
import { useTemporalStore } from '@/store/usePlanStore';

export function useUndoRedo() {
    const { undo, redo, pastStates, futureStates } = useTemporalStore().getState();
    
    // Subscribe to store updates to trigger re-renders when history changes
    const pastLength = useTemporalStore((state) => state.pastStates.length);
    const futureLength = useTemporalStore((state) => state.futureStates.length);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return {
        undo,
        redo,
        canUndo: pastLength > 0,
        canRedo: futureLength > 0
    };
}
