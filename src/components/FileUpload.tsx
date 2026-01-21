import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      // 'application/pdf': ['.pdf'] // Future support
    },
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          HousePlan Helper
        </h1>
        <p className="text-gray-500">
          Upload your house plan to start measuring and planning.
        </p>

        <div
          {...getRootProps()}
          className={cn(
            "relative group cursor-pointer flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out",
            isDragActive
              ? "border-blue-500 bg-blue-50 scale-[1.02]"
              : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 hover:shadow-lg"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className={cn(
              "p-4 rounded-full transition-colors duration-300",
              isDragActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
            )}>
              {isDragActive ? (
                <Upload className="w-8 h-8" />
              ) : (
                <FileImage className="w-8 h-8" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {isDragActive ? "Drop the file here" : "Click or drag to upload"}
              </p>
              <p className="text-xs text-gray-500">
                Supports JPG, PNG, WEBP
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
