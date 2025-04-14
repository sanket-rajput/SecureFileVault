import React from 'react';
import { Folder as FolderType } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Folder, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

interface FolderCardProps {
  folder: FolderType;
  fileCount?: number;
  onDelete?: (folder: FolderType) => void;
  className?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export function FolderCard({ 
  folder, 
  fileCount = 0, 
  onDelete,
  className,
  color = 'blue'
}: FolderCardProps) {
  const [, navigate] = useLocation();
  
  // Color mapping
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-primary',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
    },
    yellow: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
    },
  };
  
  const handleClick = () => {
    navigate(`/?folder=${folder.id}`);
  };
  
  return (
    <Card 
      className={cn(
        "border border-neutral-100 hover:border-primary/30 hover:shadow-md transition p-3 cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      <div className={cn("w-full aspect-square rounded-lg flex items-center justify-center mb-2", colorClasses[color].bg)}>
        <Folder className={cn("text-4xl", colorClasses[color].text)} size={48} />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium truncate" title={folder.name}>
            {folder.name}
          </h3>
          <p className="text-xs text-neutral-500">
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </p>
        </div>
        
        {onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-neutral-500 hover:text-neutral-700"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(folder);
                }}
                className="text-red-500"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
}
