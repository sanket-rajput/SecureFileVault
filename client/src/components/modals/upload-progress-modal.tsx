import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { FileIcon } from '@/components/ui/file-icon';
import { formatBytes, getFileTypeFromName } from '@/lib/utils';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  size: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: UploadingFile[];
  onCancelAll: () => void;
  onMinimize?: () => void;
}

export function UploadProgressModal({
  isOpen,
  onClose,
  files,
  onCancelAll,
  onMinimize,
}: UploadProgressModalProps) {
  const hasErrors = files.some(file => file.status === 'error');
  const allCompleted = files.every(file => file.status === 'success' || file.status === 'error');
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>
            {allCompleted ? 'Upload complete' : 'Uploading files'}
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[300px] overflow-y-auto py-2">
          {files.map((file) => (
            <div key={file.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 max-w-[75%]">
                  <FileIcon 
                    fileType={getFileTypeFromName(file.name)} 
                    size={18} 
                  />
                  <span className="text-sm truncate" title={file.name}>{file.name}</span>
                </div>
                <div className="flex items-center">
                  {file.status === 'error' ? (
                    <span className="text-xs font-medium text-red-500">Failed</span>
                  ) : file.status === 'success' ? (
                    <span className="text-xs font-medium text-green-500">100%</span>
                  ) : (
                    <span className="text-xs font-medium">{Math.round(file.progress)}%</span>
                  )}
                  <span className="text-xs text-neutral-500 ml-2">
                    {formatBytes(file.size)}
                  </span>
                </div>
              </div>
              
              <Progress 
                value={file.status === 'error' ? 100 : file.progress} 
                className="h-1.5" 
                indicatorClassName={
                  file.status === 'error' 
                    ? 'bg-red-500' 
                    : file.status === 'success' 
                      ? 'bg-green-500' 
                      : undefined
                }
              />
              
              {file.status === 'error' && file.error && (
                <p className="text-xs text-red-500">{file.error}</p>
              )}
            </div>
          ))}
        </div>
        
        <DialogFooter className="sm:justify-between flex-row gap-3">
          {!allCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelAll}
            >
              Cancel all
            </Button>
          )}
          
          {hasErrors && (
            <Button
              variant="destructive"
              size="sm"
            >
              Retry failed
            </Button>
          )}
          
          <div className="flex gap-2">
            {onMinimize && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMinimize}
              >
                Minimize
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={onClose}
            >
              {allCompleted ? 'Close' : 'Continue in background'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
