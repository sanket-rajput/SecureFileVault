import React from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { StorageUsage } from '@/components/ui/storage-usage';
import { useAuth } from '@/hooks/use-auth';
import {
  Home,
  Share,
  Clock,
  Star,
  Trash,
  Plus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  className?: string;
  onNewFolderCreated?: () => void;
}

export function Sidebar({ className, onNewFolderCreated }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  
  // Get storage information
  const { data: storageInfo } = useQuery({
    queryKey: ['/api/users/storage'],
    enabled: !!user,
  });
  
  // Create folder mutation
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: 'Error',
        description: 'Folder name cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Get the current folder ID from URL if available
      const urlParams = new URLSearchParams(window.location.search);
      const parentId = urlParams.get('folder') ? Number(urlParams.get('folder')) : null;
      
      await apiRequest('POST', '/api/folders', {
        name: newFolderName.trim(),
        parentId: parentId || undefined,
      });
      
      toast({
        title: 'Success',
        description: 'Folder created successfully',
      });
      
      // Invalidate folders query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      
      // Reset state
      setNewFolderName('');
      setIsCreateFolderOpen(false);
      
      // Callback if provided
      if (onNewFolderCreated) {
        onNewFolderCreated();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create folder',
        variant: 'destructive',
      });
    }
  };

  const navItems = [
    { name: 'My Files', icon: <Home className="text-xl" />, path: '/' },
    { name: 'Shared with me', icon: <Share className="text-xl" />, path: '/shared' },
    { name: 'Recent', icon: <Clock className="text-xl" />, path: '/recent' },
    { name: 'Starred', icon: <Star className="text-xl" />, path: '/starred' },
    { name: 'Trash', icon: <Trash className="text-xl" />, path: '/trash' },
  ];
  
  return (
    <aside className={`bg-white border-r border-neutral-100 ${className}`}>
      <div className="p-4">
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 w-full" variant="outline">
              <Plus className="h-4 w-4" />
              <span className="font-medium">New</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createFolder}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <nav className="mt-8">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = 
                (item.path === '/' && (location === '/' || location.startsWith('/?folder='))) || 
                (item.path !== '/' && location === item.path);
              
              return (
                <li key={item.name}>
                  <Link href={item.path}>
                    <a className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                      isActive 
                        ? 'text-primary bg-blue-50' 
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}>
                      {item.icon}
                      <span>{item.name}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {storageInfo && (
          <div className="mt-8 pt-6 border-t border-neutral-100">
            <StorageUsage
              used={storageInfo.used}
              total={storageInfo.limit}
              onUpgradeClick={() => alert('Upgrade feature coming soon!')}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
