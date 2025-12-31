import React from 'react';
import { cn } from '@/lib/utils';

interface AssetIconProps {
  asset: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AssetIcon: React.FC<AssetIconProps> = ({ asset, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const iconPath = `/icons/${asset.toLowerCase()}.svg`;

  return (
    <img
      src={iconPath}
      alt={`${asset} icon`}
      className={cn(sizeClasses[size], className)}
      onError={(e) => {
        // Fallback to a simple circle with the first letter if icon doesn't exist
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = `${sizeClasses[size]} rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-xs`;
        fallback.textContent = asset.charAt(0);
        target.parentNode?.insertBefore(fallback, target);
      }}
    />
  );
};
