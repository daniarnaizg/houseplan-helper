'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileUpload } from '@/components/FileUpload';
import { PlanEditor } from '@/components/PlanEditor';

const PdfProcessor = dynamic(() => import('@/components/PdfProcessor').then(mod => mod.PdfProcessor), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center text-gray-500">Loading PDF Processor...</div>
});

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setIsProcessingPdf(true);
    } else {
      setFile(selectedFile);
      setProcessedImageSrc(null);
    }
  };

  const handlePdfComplete = (imageSrc: string) => {
    setProcessedImageSrc(imageSrc);
    setIsProcessingPdf(false);
  };
  
  const handleReset = () => {
    setFile(null);
    setProcessedImageSrc(null);
    setIsProcessingPdf(false);
  };

  if (isProcessingPdf && file) {
    return (
      <PdfProcessor 
        file={file} 
        onComplete={handlePdfComplete} 
        onCancel={handleReset} 
      />
    );
  }

  if (file || processedImageSrc) {
    return (
      <PlanEditor 
        file={file || undefined} 
        initialImageSrc={processedImageSrc || undefined} 
        onReset={handleReset} 
      />
    );
  }

  return <FileUpload onFileSelect={handleFileSelect} />;
}