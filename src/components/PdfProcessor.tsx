'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { ChevronLeft, ChevronRight, Check, X, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-image-crop/dist/ReactCrop.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfProcessorProps {
  file: File;
  onComplete: (imageSrc: string) => void;
  onCancel: () => void;
}

export function PdfProcessor({ file, onComplete, onCancel }: PdfProcessorProps) {
  const t = useTranslations('pdfProcessor');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(1.0);
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null); // Store the PDF document proxy

  function onDocumentLoadSuccess(pdf: PDFDocumentProxy) {
    setNumPages(pdf.numPages);
    pdfDocumentRef.current = pdf;
    setIsLoading(false);
  }

  function onPageLoadSuccess(page: { width: number; height: number }) {
    setPageWidth(page.width);
    setPageHeight(page.height);
    // Initial crop selection
    if (!crop) {
        setCrop({
            unit: '%',
            x: 10,
            y: 10,
            width: 80,
            height: 80
        });
    }
  }

  const handleCropComplete = async () => {
    if (!pdfDocumentRef.current || !canvasRef.current) return;

    // Default to full page if no crop
    const activeCrop = completedCrop || { x: 0, y: 0, width: canvasRef.current.width, height: canvasRef.current.height, unit: 'px' };
    
    // Safety check for zero dimensions
    if (activeCrop.width <= 0 || activeCrop.height <= 0) return;

    try {
        const page = await pdfDocumentRef.current.getPage(pageNumber);
        const unscaledViewport = page.getViewport({ scale: 1 });
        
        // Use getBoundingClientRect for precise sub-pixel dimensions
        const rect = canvasRef.current.getBoundingClientRect();
        const displayedWidth = rect.width;
        const displayedHeight = rect.height;

        const cropXPercent = activeCrop.x / displayedWidth;
        const cropYPercent = activeCrop.y / displayedHeight;
        const cropWPercent = activeCrop.width / displayedWidth;
        const cropHPercent = activeCrop.height / displayedHeight;

        // Target dimension for the longest side of the crop
        const TARGET_SIZE = 1000;
        
        const cropWUnscaled = unscaledViewport.width * cropWPercent;
        const cropHUnscaled = unscaledViewport.height * cropHPercent;

        // Calculate scale to make the *crop* equal to TARGET_SIZE
        const scaleNeeded = Math.min(
            5.0, // Cap max scale to avoid memory issues with tiny crops
            Math.max(
                1.5, // Minimum scale
                TARGET_SIZE / Math.max(cropWUnscaled, cropHUnscaled)
            )
        );

        const viewport = page.getViewport({ scale: scaleNeeded });
        
        // Calculate pixel coordinates in the scaled viewport
        const pixelX = Math.floor(viewport.width * cropXPercent);
        const pixelY = Math.floor(viewport.height * cropYPercent);
        const pixelWidth = Math.floor(viewport.width * cropWPercent);
        const pixelHeight = Math.floor(viewport.height * cropHPercent);

        // Create canvas for the specific crop size
        const canvas = document.createElement('canvas');
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill with white background to prevent transparency issues
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Translate context to shift the viewport so the crop area aligns with (0,0)
        ctx.translate(-pixelX, -pixelY);

        await page.render({
            canvasContext: ctx,
            viewport: viewport
            // Cast to any because the type definition incorrectly requires 'canvas' 
            // when 'canvasContext' is provided.
        } as any).promise;
        
        const base64 = canvas.toDataURL('image/png');
        onComplete(base64);

    } catch (err) {
        console.error("Error generating high-res crop:", err);
        // Fallback to screen capture if PDF render fails
        if (canvasRef.current) {
             const base64 = canvasRef.current.toDataURL('image/png');
             onComplete(base64);
        }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-3">
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <X size={20} />
                </button>
                <div>
                    <h2 className="font-semibold text-gray-900">{t('title')}</h2>
                    <p className="text-xs text-gray-500">{t('pageOf', { current: pageNumber, total: numPages })}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    disabled={pageNumber <= 1} 
                    onClick={() => setPageNumber(prev => prev - 1)}
                    className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50 text-gray-600 border border-gray-200"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-medium w-8 text-center">{pageNumber}</span>
                <button 
                    disabled={pageNumber >= numPages} 
                    onClick={() => setPageNumber(prev => prev + 1)}
                    className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50 text-gray-600 border border-gray-200"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <button 
                onClick={handleCropComplete}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
                <Check size={18} />
                <span>{t('importSelection')}</span>
            </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto flex justify-center p-8 relative">
             <div className="bg-white shadow-2xl relative h-fit">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex items-center justify-center h-96 w-96 text-gray-400">
                            <Loader2 className="animate-spin w-8 h-8" />
                        </div>
                    }
                    error={
                        <div className="flex items-center justify-center h-96 w-96 text-red-500">
                            {t('loadFailed')}
                        </div>
                    }
                >
                     {/* 
                       ReactCrop requires the child to be the media.
                       Page renders a canvas. 
                       We need to ensure ReactCrop can measure it.
                     */}
                    <ReactCrop 
                        crop={crop} 
                        onChange={(c) => setCrop(c)} 
                        onComplete={(c) => setCompletedCrop(c)}
                        className="block"
                    >
                        <Page 
                            pageNumber={pageNumber} 
                            renderTextLayer={false} 
                            renderAnnotationLayer={false}
                            scale={scale}
                            canvasRef={canvasRef}
                            onLoadSuccess={onPageLoadSuccess}
                            width={800} // Fixed width for consistency, or responsive?
                        />
                    </ReactCrop>
                </Document>
             </div>
        </div>
        
        {/* Zoom Controls Overlay */}
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col p-1">
             <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className="p-2 hover:bg-gray-100 rounded text-gray-600"><ZoomIn size={20}/></button>
             <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="p-2 hover:bg-gray-100 rounded text-gray-600"><ZoomOut size={20}/></button>
        </div>
    </div>
  );
}
