import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Annotation } from './types';
import { cn } from '@/lib/utils';

interface DraggableAnnotationProps {
    annotation: Annotation;
    isSelected: boolean;
    isHovered: boolean;
    isEditing: boolean;
    zoomScale: number;
    onSelect: (id: string) => void;
    onHover: (id: string | null) => void;
    onUpdate: (id: string, updates: Partial<Annotation>) => void;
    onDelete: (id: string) => void;
    onStartEditing: (id: string) => void;
    onStopEditing: () => void;
}

const DraggableAnnotation: React.FC<DraggableAnnotationProps> = ({
    annotation,
    isSelected,
    isHovered,
    isEditing,
    zoomScale,
    onSelect,
    onHover,
    onUpdate,
    onDelete,
    onStartEditing,
    onStopEditing
}) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onStartEditing(annotation.id);
    };

    const handleBlur = (text: string) => {
        onUpdate(annotation.id, { text });
        onStopEditing();
    };

    const handleKeyDown = (e: React.KeyboardEvent, text: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBlur(text);
        }
        if (e.key === 'Escape') {
            onStopEditing();
        }
    };

    const handleDeleteKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Delete' && !isEditing && isSelected) {
            e.preventDefault();
            onDelete(annotation.id);
        }
    };

    return (
        <Draggable
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
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(annotation.id);
                }}
                onDoubleClick={handleDoubleClick}
                onMouseEnter={() => onHover(annotation.id)}
                onMouseLeave={() => onHover(null)}
                onKeyDown={handleDeleteKeyDown}
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
                            onBlur={(e) => handleBlur(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, e.currentTarget.value)}
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
};

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

    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
            {annotations.map((annotation) => (
                <DraggableAnnotation
                    key={annotation.id}
                    annotation={annotation}
                    isSelected={selectedId === annotation.id}
                    isHovered={hoveredId === annotation.id}
                    isEditing={editingId === annotation.id}
                    zoomScale={zoomScale}
                    onSelect={onSelect}
                    onHover={onHover}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onStartEditing={setEditingId}
                    onStopEditing={() => setEditingId(null)}
                />
            ))}
        </div>
    );
};

AnnotationLayer.displayName = 'AnnotationLayer';
