import React from 'react';
import { useLocation } from 'wouter';
import { ChevronRight, List, Grid, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Folder } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

interface BreadcrumbNavigationProps {
  currentFolderId?: number | null;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onInfoToggle?: () => void;
}

export function BreadcrumbNavigation({ 
  currentFolderId, 
  viewMode, 
  onViewModeChange,
  onInfoToggle
}: BreadcrumbNavigationProps) {
  const [, navigate] = useLocation();
  
  // Fetch current folder information if needed
  const { data: currentFolder } = useQuery<Folder>({
    queryKey: ['/api/folders', currentFolderId],
    enabled: !!currentFolderId,
  });
  
  // Fetch parent folder if current folder has a parent
  const { data: parentFolder } = useQuery<Folder>({
    queryKey: ['/api/folders', currentFolder?.parentId],
    enabled: !!currentFolder?.parentId,
  });
  
  const handleFolderClick = (folderId?: number | null) => {
    if (folderId) {
      navigate(`/?folder=${folderId}`);
    } else {
      navigate('/');
    }
  };
  
  return (
    <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <button 
          className="text-neutral-700 hover:text-primary"
          onClick={() => handleFolderClick(null)}
        >
          My Files
        </button>
        
        {parentFolder && (
          <>
            <ChevronRight className="text-neutral-500 h-4 w-4" />
            <button 
              className="text-neutral-700 hover:text-primary"
              onClick={() => handleFolderClick(parentFolder.id)}
            >
              {parentFolder.name}
            </button>
          </>
        )}
        
        {currentFolder && (
          <>
            <ChevronRight className="text-neutral-500 h-4 w-4" />
            <span className="text-neutral-900 font-medium">
              {currentFolder.name}
            </span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          title="List view"
          onClick={() => onViewModeChange('list')}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          title="Grid view"
          onClick={() => onViewModeChange('grid')}
        >
          <Grid className="h-4 w-4" />
        </Button>
        
        {onInfoToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Info panel"
            onClick={onInfoToggle}
          >
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
