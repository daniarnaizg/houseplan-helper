import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, Ruler, DraftingCompass, PencilRuler } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { LanguageSelector } from './LanguageSelector';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const t = useTranslations('fileUpload');
  const titleParts = t('title').split('**');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf'] 
    },
    maxFiles: 1,
  });

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 bg-grid-pattern overflow-hidden">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      {/* Decorative Technical Elements */}
      <div className="absolute top-8 left-8 text-border opacity-50">
        <Ruler className="w-12 h-12" />
      </div>
      <div className="absolute bottom-8 right-8 text-border opacity-50">
        <DraftingCompass className="w-12 h-12" />
      </div>
      <div className="absolute top-1/4 right-1/4 w-64 h-px bg-border -rotate-45" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-px bg-border rotate-45" />

      <div className="z-10 w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-border rounded-full shadow-sm mb-4">
            <PencilRuler className="w-4 h-4 text-secondary" />
            <span className="font-mono text-xs font-semibold text-foreground tracking-wider">V 2.0 // ARCHITECT_MODE</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter text-primary font-sans">
            {titleParts[0]}<span className="text-secondary">{titleParts[1]}</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm max-w-sm mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            "relative group cursor-pointer transition-all duration-300 ease-in-out",
            "bg-white border-2 border-dashed border-border aspect-[4/3] flex flex-col items-center justify-center",
            "shadow-[8px_8px_0px_rgba(0,0,0,0.05)] hover:shadow-[12px_12px_0px_rgba(0,0,0,0.05)] hover:-translate-y-1",
            isDragActive ? "border-secondary bg-blue-50/10 scale-[1.02]" : "hover:border-primary"
          )}
        >
          {/* Corner marks for 'Lens' effect */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary -mt-1 -ml-1" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary -mt-1 -mr-1" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary -mb-1 -ml-1" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary -mb-1 -mr-1" />

          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center space-y-6 text-center p-8">
            <div className={cn(
              "p-6 rounded-none border-2 transition-colors duration-300",
              isDragActive 
                ? "bg-secondary/10 border-secondary text-secondary" 
                : "bg-muted border-primary text-primary group-hover:bg-primary group-hover:text-white"
            )}>
              {isDragActive ? (
                <Upload className="w-10 h-10" />
              ) : (
                <FileImage className="w-10 h-10" />
              )}
            </div>
            
            <div className="space-y-2">
              <p className="font-mono text-lg font-bold text-foreground">
                {isDragActive ? t('dropHere') : t('uploadSource')}
              </p>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                {t('supportedFormats')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-4 font-mono text-xs text-muted-foreground">
          <span>{t('systemReady')}</span>
          <span>{t('waitingForInput')}</span>
        </div>
      </div>
    </div>
  );
}