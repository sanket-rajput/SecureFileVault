import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { File, Folder } from '@shared/schema';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { BreadcrumbNavigation } from '@/components/breadcrumb-navigation';
import { UploadArea } from '@/components/upload-area';
import { FileCard } from '@/components/ui/file-card';
import { FolderCard } from '@/components/ui/folder-card';
import { FilePreviewModal } from '@/components/modals/file-preview-modal';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HomePage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  
  // Parse the current folder ID from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const currentFolderId = urlParams.get('folder') ? Number(urlParams.get('folder')) : null;
  
  // Fetch folders
  const { 
    data: folders = [], 
    isLoading: foldersLoading,
    error: foldersError
  } = useQuery<Folder[]>({
    queryKey: ['/api/folders', currentFolderId ? { parentId: currentFolderId } : null],
    queryFn: async ({ queryKey }) => {
      const [endpoint, params] = queryKey;
      const url = params ? `${endpoint}?parentId=${params.parentId}` : endpoint;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch folders');
      return await res.json();
    },
  });
  
  // Fetch files
  const { 
    data: files = [], 
    isLoading: filesLoading,
    error: filesError
  } = useQuery<File[]>({
    queryKey: searchQuery 
      ? ['/api/files/search', { q: searchQuery }] 
      : ['/api/files', currentFolderId ? { folderId: currentFolderId } : null],
    queryFn: async ({ queryKey }) => {
      if (queryKey[0] === '/api/files/search') {
        const [endpoint, params] = queryKey;
        const url = `${endpoint}?q=${params.q}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to search files');
        return await res.json();
      } else {
        const [endpoint, params] = queryKey;
        const url = params ? `${endpoint}?folderId=${params.folderId}` : endpoint;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch files');
        return await res.json();
      }
    },
  });
  
  // File actions
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest('DELETE', `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/storage'] });
      toast({
        title: 'File deleted',
        description: 'The file has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete file',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Folder actions
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      await apiRequest('DELETE', `/api/folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      toast({
        title: 'Folder deleted',
        description: 'The folder and its contents have been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete folder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // File handlers
  const handlePreviewFile = (file: File) => {
    setSelectedFile(file);
  };
  
  const handleDownloadFile = (file: File) => {
    window.open(`/api/files/${file.id}/download`, '_blank');
  };
  
  const handleDeleteFile = (file: File) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteFileMutation.mutate(file.id);
    }
  };
  
  const handleDeleteFolder = (folder: Folder) => {
    if (confirm('Are you sure you want to delete this folder and all its contents?')) {
      deleteFolderMutation.mutate(folder.id);
    }
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Clear search query when location changes
  useEffect(() => {
    setSearchQuery(null);
  }, [location]);
  
  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setShowSidebar(prev => !prev);
  };
  
  // Loading state
  const isLoading = foldersLoading || filesLoading;
  const hasError = foldersError || filesError;
  
  return (
    <div className="h-screen flex flex-col">
      <Header 
        onMobileMenuToggle={toggleMobileSidebar} 
        onSearch={handleSearch}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          className={`w-60 ${showSidebar ? 'block' : 'hidden'} md:block transition-all duration-300 ease-in-out overflow-y-auto`}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <BreadcrumbNavigation 
            currentFolderId={currentFolderId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          
          <UploadArea 
            folderId={currentFolderId}
            onUploadComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/files'] });
            }}
          />
          
          {/* Quick access folders */}
          {!searchQuery && folders.length > 0 && (
            <div className="p-4 border-b border-neutral-100">
              <h2 className="text-lg font-medium mb-3">Quick access</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {folders.map((folder, index) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    fileCount={0} // Would need a separate query to count files
                    onDelete={handleDeleteFolder}
                    // Rotate colors
                    color={(['blue', 'green', 'yellow', 'red'] as const)[index % 4]}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Files list/grid */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">
                {searchQuery ? `Search results for "${searchQuery}"` : 'Files'}
              </h2>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : hasError ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load files. Please try again later.
                </AlertDescription>
              </Alert>
            ) : files.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                {searchQuery 
                  ? 'No files matching your search' 
                  : 'No files in this location. Upload files to get started.'}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" 
                : "space-y-2"
              }>
                {files.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onPreview={handlePreviewFile}
                    onDownload={handleDownloadFile}
                    onDelete={handleDeleteFile}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* File preview modal */}
      {selectedFile && (
        <FilePreviewModal
          file={selectedFile}
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
          onDownload={handleDownloadFile}
          totalFiles={files.length}
          currentIndex={files.findIndex(f => f.id === selectedFile.id)}
          onPrevious={() => {
            const currentIndex = files.findIndex(f => f.id === selectedFile.id);
            if (currentIndex > 0) {
              setSelectedFile(files[currentIndex - 1]);
            }
          }}
          onNext={() => {
            const currentIndex = files.findIndex(f => f.id === selectedFile.id);
            if (currentIndex < files.length - 1) {
              setSelectedFile(files[currentIndex + 1]);
            }
          }}
        />
      )}
    </div>
  );
}
