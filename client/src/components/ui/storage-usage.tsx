import React from 'react';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/utils';

interface StorageUsageProps {
  used: number;
  total: number;
  onUpgradeClick?: () => void;
}

export function StorageUsage({ used, total, onUpgradeClick }: StorageUsageProps) {
  const percentUsed = Math.min(Math.round((used / total) * 100), 100);
  const isLowStorage = percentUsed > 90;
  
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-500">Storage</p>
      
      <Progress 
        value={percentUsed} 
        className="h-2"
        indicatorClassName={isLowStorage ? "bg-red-500" : undefined}
      />
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-700">
          {formatBytes(used)} of {formatBytes(total)} used
        </p>
        <p className="text-sm font-medium">
          {percentUsed}%
        </p>
      </div>
      
      {onUpgradeClick && (
        <button 
          onClick={onUpgradeClick}
          className="text-sm text-primary font-medium hover:underline"
        >
          Upgrade storage
        </button>
      )}
    </div>
  );
}
