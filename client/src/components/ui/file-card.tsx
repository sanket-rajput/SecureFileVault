import React, { useState } from 'react';
import { File as FileType } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Eye, Download, Share, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIcon } from '@/components/ui/file-icon';
import { formatDate, getFileTypeFromName } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FileCardProps {
  file: FileType;
  onPreview: (file: FileType) => void;
  onDownload: (file: FileType) => void;
  onShare?: (file: FileType) => void;
  onDelete?: (file: FileType) => void;
  className?: string;
}

export function FileCard({ 
  file, 
  onPreview, 
  onDownload, 
  onShare, 
  onDelete,
  className 
}: FileCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const fileType = getFileTypeFromName(file.name);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType);
  
  // Function to determine if a preview should be shown as a thumbnail
  const isPreviewableImage = isImage && file.mimeType.startsWith('image/');
  
  return (
    <Card 
      className={cn(
        "overflow-hidden hover:shadow-md transition group",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {isPreviewableImage ? (
          <div className="w-full aspect-video bg-neutral-50 flex items-center justify-center overflow-hidden">
            <img 
              src={`/api/files/${file.id}/download`} 
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`w-full aspect-video flex items-center justify-center ${getColorForFile(fileType)}`}>
            <FileIcon fileType={fileType} size={48} />
          </div>
        )}
        
        {/* Overlay with action buttons on hover */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center gap-2",
            "transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/90 hover:bg-white text-neutral-900 h-8 w-8"
            onClick={() => onPreview(file)}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/90 hover:bg-white text-neutral-900 h-8 w-8"
            onClick={() => onDownload(file)}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          {onShare && (
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-white/90 hover:bg-white text-neutral-900 h-8 w-8"
              onClick={() => onShare(file)}
              title="Share"
            >
              <Share className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="overflow-hidden">
            <h3 className="font-medium text-sm truncate" title={file.name}>
              {file.name}
            </h3>
            <p className="text-xs text-neutral-500">
              Modified: {formatDate(file.updatedAt)}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-neutral-700">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(file)}>Preview</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(file)}>Download</DropdownMenuItem>
              {onShare && <DropdownMenuItem onClick={() => onShare(file)}>Share</DropdownMenuItem>}
              {onDelete && <DropdownMenuItem onClick={() => onDelete(file)} className="text-red-500">Delete</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

// Helper function to get background color based on file type
function getColorForFile(fileType: string): string {
  const type = fileType.toLowerCase();
  
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(type)) {
    return 'bg-blue-50';
  }
  
  if (['xls', 'xlsx', 'csv', 'ods'].includes(type)) {
    return 'bg-green-50';
  }
  
  if (['ppt', 'pptx', 'odp'].includes(type)) {
    return 'bg-amber-50';
  }
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(type)) {
    return 'bg-purple-50';
  }
  
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
    return 'bg-red-50';
  }
  
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
    return 'bg-gray-50';
  }
  
  if (type === 'pdf') {
    return 'bg-red-50';
  }
  
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(type)) {
    return 'bg-yellow-50';
  }
  
  return 'bg-gray-50';
}
