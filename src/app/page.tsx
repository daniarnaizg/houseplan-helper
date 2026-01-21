'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { PlanEditor } from '@/components/PlanEditor';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  if (file) {
    return <PlanEditor file={file} onReset={() => setFile(null)} />;
  }

  return <FileUpload onFileSelect={setFile} />;
}