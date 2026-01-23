import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Annotation } from './types';
import { cn } from '@/lib/utils';

interface AnnotationLayerProps {
    annotations: Annotation[];
    isVisible: boolean;
    selectedId: string | null;
    hoveredId: string | null;
    onSelect: (id: string | null) => void;
    onHover: (id: string | null) => void;
    onUpdate: (id: string, updates: Partial<Annotation>) => void;
    onDelete: (id: string) => void;
    zoomScale: number;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
    annotations,
    isVisible,
    selectedId,
    hoveredId,
    onSelect,
    onHover,
    onUpdate,
    onDelete,
    zoomScale
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    if (!isVisible) return null;

    const handleDoubleClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setEditingId(id);
    };

    const handleBlur = (id: string, text: string) => {
        onUpdate(id, { text });
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string, text: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBlur(id, text);
        }
        if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    const handleDeleteKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Delete' && !editingId && selectedId === id) {
            e.preventDefault();
            onDelete(id);
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
            {annotations.map((annotation) => {
                const isSelected = selectedId === annotation.id;
                const isHovered = hoveredId === annotation.id;
                const isEditing = editingId === annotation.id;
                const nodeRef = useRef<HTMLDivElement>(null);

                return (
                    <Draggable
                        key={annotation.id}
                        nodeRef={nodeRef}
                        position={{ x: annotation.x, y: annotation.y }}
                        scale={zoomScale}
                        disabled={isEditing}
                        onStart={(e: any) => {
                            e.stopPropagation();
                            onSelect(annotation.id);
                        }}
                        onStop={(e: any, data: any) => {
                            e.stopPropagation();
                            onUpdate(annotation.id, { x: data.x, y: data.y });
                        }}
                        onMouseDown={(e: any) => e.stopPropagation()}
                    >
                        <div
                            ref={nodeRef}
                            className={cn(
                                "absolute pointer-events-auto cursor-move transition-shadow",
                                isSelected && "ring-2 ring-secondary ring-offset-1",
                                isHovered && !isSelected && "ring-1 ring-secondary/50"
                            )}
                            style={{
                                // Rotation is handled by inner wrapper to avoid conflict with Draggable
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(annotation.id);
                            }}
                            onDoubleClick={(e) => handleDoubleClick(e, annotation.id)}
                            onMouseEnter={() => onHover(annotation.id)}
                            onMouseLeave={() => onHover(null)}
                            onKeyDown={(e) => handleDeleteKeyDown(e, annotation.id)}
                            tabIndex={0}
                        >
                            <div
                                style={{
                                    transform: `rotate(${annotation.rotation}deg)`,
                                    transformOrigin: 'top left',
                                }}
                            >
                                {isEditing ? (
                                    <textarea
                                        ref={inputRef}
                                        defaultValue={annotation.text}
                                        onBlur={(e) => handleBlur(annotation.id, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, annotation.id, e.currentTarget.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="bg-white border-2 border-secondary outline-none resize-none p-1 font-mono"
                                        style={{
                                            fontSize: annotation.fontSize,
                                            color: annotation.color,
                                            minWidth: '100px',
                                            minHeight: '24px',
                                        }}
                                    />
                                ) : (
                                    <div
                                        className={cn(
                                            "px-2 py-1 font-mono whitespace-pre-wrap select-none",
                                            annotation.backgroundColor && "rounded"
                                        )}
                                        style={{
                                            fontSize: annotation.fontSize,
                                            color: annotation.color,
                                            backgroundColor: annotation.backgroundColor || 'transparent',
                                            textShadow: !annotation.backgroundColor 
                                                ? '0 0 3px white, 0 0 3px white, 0 0 3px white' 
                                                : 'none',
                                        }}
                                    >
                                        {annotation.text || 'Double-click to edit'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Draggable>
                );
            })}
        </div>
    );
};

AnnotationLayer.displayName = 'AnnotationLayer';
