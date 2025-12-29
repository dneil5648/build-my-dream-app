import React from 'react';
import { AssetIcon } from './AssetIcon';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  asset: string;
  balance: string;
  usdValue: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  asset,
  balance,
  usdValue,
  change,
  changeType = 'neutral',
  className,
}) => {
  return (
    <div className={cn("glass rounded-xl p-6 hover:border-primary/50 transition-all duration-300", className)}>
      <div className="flex items-center gap-4">
        <AssetIcon asset={asset} size="lg" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{asset}</span>
            {change && (
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                changeType === 'positive' && "bg-success/20 text-success",
                changeType === 'negative' && "bg-destructive/20 text-destructive",
                changeType === 'neutral' && "bg-muted text-muted-foreground"
              )}>
                {change}
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground">{balance}</p>
          <p className="text-sm text-muted-foreground">≈ {usdValue}</p>
        </div>
      </div>
    </div>
  );
};
