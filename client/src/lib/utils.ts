import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Format: "Jun 15, 2023"
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function getFileTypeFromName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return extension;
}

export function getFileTypeIcon(fileType: string): string {
  const iconMap: Record<string, string> = {
    pdf: 'file-pdf',
    doc: 'file-text',
    docx: 'file-text',
    txt: 'file-text',
    xls: 'file-spreadsheet',
    xlsx: 'file-spreadsheet',
    csv: 'file-spreadsheet',
    ppt: 'file-presentation',
    pptx: 'file-presentation',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    svg: 'image',
    mp3: 'audio',
    wav: 'audio',
    mp4: 'video',
    mov: 'video',
    avi: 'video',
    zip: 'file-archive',
    rar: 'file-archive',
    '7z': 'file-archive',
  };

  return iconMap[fileType] || 'file';
}

export function isPreviewable(mimeType: string): boolean {
  const previewableMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    // PDFs
    'application/pdf',
    // Text
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    // Audio
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
  ];

  return previewableMimeTypes.includes(mimeType);
}
