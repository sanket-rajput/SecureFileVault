import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface FileWithPreview extends File {
  preview?: string;
  progress?: number;
  id: string;
}

interface DropzoneProps {
  onFilesAdded: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

export function Dropzone({
  onFilesAdded,
  maxFiles = 10,
  maxSize = 10485760, // 10MB
  className,
  disabled = false,
}: DropzoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => 
        Object.assign(file, {
          preview: URL.createObjectURL(file),
          progress: 0,
          id: Math.random().toString(36).substr(2, 9),
        })
      );
      
      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      onFilesAdded(updatedFiles);
    },
    [files, maxFiles, onFilesAdded]
  );
  
  const removeFile = (id: string) => {
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    onFilesAdded(updatedFiles);
  };
  
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    disabled,
  });
  
  const isFilesLimitReached = files.length >= maxFiles;
  
  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-colors',
          'flex flex-col items-center justify-center text-center cursor-pointer',
          isDragActive 
            ? 'border-primary/50 bg-primary/5' 
            : 'border-neutral-200 hover:border-primary/30 hover:bg-primary/5',
          isFilesLimitReached || disabled ? 'opacity-60 cursor-not-allowed' : '',
          className
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-10 w-10 text-primary mb-2" />
        <h3 className="font-medium text-neutral-900 mb-1">Upload files</h3>
        
        {isFilesLimitReached ? (
          <p className="text-sm text-neutral-500">
            Maximum number of files reached ({maxFiles})
          </p>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-3">
              Drag & drop files here or click to browse
            </p>
            <Button variant="default" size="sm">
              Select files
            </Button>
            <p className="text-xs text-neutral-500 mt-2">
              Max file size: {formatBytes(maxSize)}
            </p>
          </>
        )}
      </div>
      
      {fileRejections.length > 0 && (
        <div className="text-sm text-red-500 mt-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="mb-1">
              <strong>{file.name}</strong>: {errors.map(e => e.message).join(', ')}
            </div>
          ))}
        </div>
      )}
      
      {files.length > 0 && (
        <div className="space-y-3 mt-4">
          {files.map((file) => (
            <div key={file.id} className="flex items-center space-x-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <span className="text-xs text-neutral-500">({formatBytes(file.size)})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Progress value={file.progress || 0} className="h-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
