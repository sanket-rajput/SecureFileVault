import React from 'react';
import { File } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, isPreviewable } from '@/lib/utils';
import { FileIcon } from '@/components/ui/file-icon';

interface FilePreviewModalProps {
  file: File | null;
  onDownload: (file: File) => void;
  onShare?: (file: File) => void;
  onClose: () => void;
  isOpen: boolean;
  totalFiles?: number;
  currentIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function FilePreviewModal({
  file,
  onDownload,
  onShare,
  onClose,
  isOpen,
  totalFiles,
  currentIndex,
  onPrevious,
  onNext,
}: FilePreviewModalProps) {
  if (!file) return null;
  
  const fileType = file.fileType.toLowerCase();
  const isPreviable = isPreviewable(file.mimeType);
  
  const renderPreview = () => {
    // Image preview
    if (file.mimeType.startsWith('image/')) {
      return (
        <img 
          src={`/api/files/${file.id}/download`}
          alt={file.name}
          className="max-w-full max-h-full object-contain shadow-lg"
        />
      );
    }
    
    // PDF preview
    if (file.mimeType === 'application/pdf') {
      return (
        <iframe
          src={`/api/files/${file.id}/download`}
          className="w-full h-full border-0"
          title={file.name}
        />
      );
    }
    
    // Video preview
    if (file.mimeType.startsWith('video/')) {
      return (
        <video 
          src={`/api/files/${file.id}/download`} 
          controls
          className="max-w-full max-h-full"
        >
          Your browser does not support the video tag.
        </video>
      );
    }
    
    // Audio preview
    if (file.mimeType.startsWith('audio/')) {
      return (
        <audio 
          src={`/api/files/${file.id}/download`} 
          controls
          className="w-full"
        >
          Your browser does not support the audio tag.
        </audio>
      );
    }
    
    // Text preview (simplified)
    if (file.mimeType.startsWith('text/')) {
      return (
        <div className="bg-white p-4 rounded shadow-inner overflow-auto max-h-full w-full">
          <p>Text preview is not supported in this version.</p>
        </div>
      );
    }
    
    // Fallback for non-previewable files
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <FileIcon fileType={fileType} size={120} />
        <p className="mt-4 text-neutral-600">Preview not available for this file type</p>
        <Button 
          className="mt-4" 
          onClick={() => file && onDownload(file)}
        >
          <Download className="mr-2 h-4 w-4" />
          Download to view
        </Button>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl w-full flex flex-col h-[90vh] p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-neutral-100">
          <DialogTitle className="text-base font-medium">{file.name}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => file && onDownload(file)}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            {onShare && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => file && onShare(file)}
                title="Share"
              >
                <Share className="h-4 w-4" />
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-neutral-50 relative flex items-center justify-center p-6">
          {renderPreview()}
        </div>
        
        <DialogFooter className="p-4 border-t border-neutral-100 flex flex-row items-center justify-between">
          <div className="text-sm text-neutral-500">
            Last modified: {formatDate(file.updatedAt)}
          </div>
          
          {totalFiles && currentIndex !== undefined && onPrevious && onNext && (
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onPrevious}
                disabled={currentIndex === 0}
                title="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm">
                {currentIndex + 1} of {totalFiles}
              </span>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onNext}
                disabled={currentIndex === totalFiles - 1}
                title="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
