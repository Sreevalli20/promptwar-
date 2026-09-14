'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
  accept?: string;
}

export function DocumentUpload({ onUpload, disabled = false, accept = '.pdf,.docx,.txt,.md' }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const supportedTypes = ['pdf', 'docx', 'txt', 'md'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!supportedTypes.includes(extension)) {
      return { valid: false, error: `Unsupported file type: .${extension}. Supported types: PDF, DOCX, TXT, MD` };
    }
    
    return { valid: true };
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    setSelectedFile(file);
    onUpload(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const input = document.getElementById('file-upload') as HTMLInputElement;
      input?.click();
    }
  }, []);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload document"
        onKeyDown={handleKeyDown}
      >
        {!selectedFile ? (
          <>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept={accept}
              onChange={handleFileInput}
              disabled={disabled}
              aria-describedby="file-upload-description"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer"
            >
              <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-700 mb-2">
                {isDragging ? 'Drop your document here' : 'Upload a legal document'}
              </p>
              <p className="text-xs text-slate-500 mb-4" id="file-upload-description">
                Drag and drop, or click to browse
              </p>
              <p className="text-xs text-slate-400">
                Supported formats: PDF, DOCX, TXT, MD (max 10MB)
              </p>
            </label>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-slate-600" aria-hidden="true" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
              disabled={disabled}
              aria-label="Remove file"
            >
              <X className="h-5 w-5 text-slate-500" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-red-600" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}