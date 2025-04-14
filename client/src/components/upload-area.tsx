import React, { useState, useCallback } from 'react';
import { Dropzone, FileWithPreview } from '@/components/ui/dropzone';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UploadProgressModal } from './modals/upload-progress-modal';
import { useAuth } from '@/hooks/use-auth';

interface UploadAreaProps {
  folderId?: number | null;
  onUploadComplete?: () => void;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  size: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function UploadArea({ folderId, onUploadComplete }: UploadAreaProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  
  const uploadMutation = useMutation({
    mutationFn: async (file: FileWithPreview) => {
      const formData = new FormData();
      formData.append('file', file);
      
      if (folderId) {
        formData.append('folderId', folderId.toString());
      }
      
      // We need to track upload progress
      const xhr = new XMLHttpRequest();
      
      return new Promise<void>((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            
            setUploadingFiles(prev => 
              prev.map(f => 
                f.id === file.id 
                  ? { ...f, progress: percentComplete }
                  : f
              )
            );
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadingFiles(prev => 
              prev.map(f => 
                f.id === file.id 
                  ? { ...f, progress: 100, status: 'success' }
                  : f
              )
            );
            resolve();
          } else {
            const errorMsg = xhr.responseText || `Upload failed with status ${xhr.status}`;
            setUploadingFiles(prev => 
              prev.map(f => 
                f.id === file.id 
                  ? { ...f, status: 'error', error: errorMsg }
                  : f
              )
            );
            reject(new Error(errorMsg));
          }
        });
        
        xhr.addEventListener('error', () => {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === file.id 
                ? { ...f, status: 'error', error: 'Network error occurred' }
                : f
            )
          );
          reject(new Error('Network error occurred'));
        });
        
        xhr.addEventListener('abort', () => {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === file.id 
                ? { ...f, status: 'error', error: 'Upload aborted' }
                : f
            )
          );
          reject(new Error('Upload aborted'));
        });
        
        xhr.open('POST', '/api/files/upload');
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/storage'] });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleFilesAdded = useCallback((files: FileWithPreview[]) => {
    if (files.length === 0) return;
    
    // Setup initial tracking for all files
    const newUploadingFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      progress: 0,
      size: file.size,
      status: 'uploading' as const,
    }));
    
    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);
    setShowModal(true);
    
    // Upload each file
    files.forEach(file => {
      uploadMutation.mutate(file);
    });
  }, [uploadMutation]);
  
  const handleCancelAll = () => {
    // Implementation would need to actually abort the XHR requests
    toast({
      title: 'Uploads cancelled',
      description: 'All uploads have been cancelled.',
    });
    setShowModal(false);
    setUploadingFiles([]);
  };
  
  // Calculate max upload size based on user's remaining storage
  const maxUploadSize = user ? (user.storageLimit - user.storageUsed) : 10485760; // 10MB default
  
  return (
    <>
      <div className="p-4 border-b border-neutral-100">
        <Dropzone 
          onFilesAdded={handleFilesAdded}
          maxSize={maxUploadSize}
          disabled={uploadMutation.isPending}
        />
      </div>
      
      <UploadProgressModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        files={uploadingFiles}
        onCancelAll={handleCancelAll}
        onMinimize={() => setShowModal(false)}
      />
    </>
  );
}
