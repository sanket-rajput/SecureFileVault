import React from 'react';
import { 
  FileText, FileSpreadsheet, FilePen, 
  Image, Video, FileArchive, FileIcon as LucideFileIcon, File, Music
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  fileType: string;
  className?: string;
  size?: number | string;
  color?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ 
  fileType, 
  className,
  size = 24,
  color
}) => {
  const getIconByType = () => {
    const type = fileType.toLowerCase();
    
    // Document types
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(type)) {
      return <FileText size={size} />;
    }
    
    // Spreadsheet types
    if (['xls', 'xlsx', 'csv', 'ods'].includes(type)) {
      return <FileSpreadsheet size={size} />;
    }
    
    // Presentation types
    if (['ppt', 'pptx', 'odp'].includes(type)) {
      return <FilePen size={size} />;
    }
    
    // Image types
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(type)) {
      return <Image size={size} />;
    }
    
    // Video types
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
      return <Video size={size} />;
    }
    
    // Archive types
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
      return <FileArchive size={size} />;
    }
    
    // PDF type
    if (type === 'pdf') {
      return <File size={size} />;
    }
    
    // Audio types
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(type)) {
      return <Music size={size} />;
    }
    
    // Default file icon
    return <File size={size} />;
  };

  // Color mapping based on file type
  const getColorClass = () => {
    const type = fileType.toLowerCase();
    
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(type)) {
      return 'text-blue-500';
    }
    
    if (['xls', 'xlsx', 'csv', 'ods'].includes(type)) {
      return 'text-green-500';
    }
    
    if (['ppt', 'pptx', 'odp'].includes(type)) {
      return 'text-orange-500';
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(type)) {
      return 'text-purple-500';
    }
    
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
      return 'text-red-500';
    }
    
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
      return 'text-gray-500';
    }
    
    if (type === 'pdf') {
      return 'text-red-600';
    }
    
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(type)) {
      return 'text-yellow-500';
    }
    
    return 'text-gray-400';
  };

  return (
    <div className={cn(color || getColorClass(), className)}>
      {getIconByType()}
    </div>
  );
};
