import React from 'react';
import { cn } from '@/lib/utils';

const assetColors: Record<string, string> = {
  BTC: 'bg-crypto-btc',
  ETH: 'bg-crypto-eth',
  USDC: 'bg-crypto-usdc',
  USD: 'bg-success',
  USDT: 'bg-success',
};

const assetSymbols: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  USDC: '$',
  USD: '$',
  USDT: '₮',
};

interface AssetIconProps {
  asset: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AssetIcon: React.FC<AssetIconProps> = ({ asset, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-lg',
  };

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-bold text-primary-foreground",
      assetColors[asset] || 'bg-secondary',
      sizeClasses[size],
      className
    )}>
      {assetSymbols[asset] || asset.charAt(0)}
    </div>
  );
};
