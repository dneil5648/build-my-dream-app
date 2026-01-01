import React, { useState, useMemo } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { AssetIcon } from './AssetIcon';
import { AccountBalanceItem } from '@/api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export interface AssetMapping {
  assetId: string;
  customName: string;
  iconColor?: string;
  customIcon?: string;
}

interface BalancesTableProps {
  balances: AccountBalanceItem[];
  isLoading?: boolean;
  showZeroBalances?: boolean;
  emptyMessage?: string;
  assetMappings?: AssetMapping[];
  allowedAssets?: string[];
  aggregateMode?: boolean; // When true, combine balances for the same asset
}

export const BalancesTable: React.FC<BalancesTableProps> = ({
  balances,
  isLoading,
  showZeroBalances: initialShowZero = false,
  emptyMessage = 'No balances found',
  assetMappings = [],
  allowedAssets,
  aggregateMode = false,
}) => {
  const [showZeroBalances, setShowZeroBalances] = useState(initialShowZero);

  // Aggregate balances by asset if in aggregate mode
  const aggregatedBalances = useMemo(() => {
    if (!aggregateMode) return balances;
    
    const balanceMap: Record<string, AccountBalanceItem> = {};
    balances.forEach((b) => {
      const existing = balanceMap[b.asset];
      if (existing) {
        balanceMap[b.asset] = {
          asset: b.asset,
          available: (parseFloat(existing.available) + parseFloat(b.available)).toString(),
          trading: (parseFloat(existing.trading || '0') + parseFloat(b.trading || '0')).toString(),
        };
      } else {
        balanceMap[b.asset] = { ...b };
      }
    });
    
    return Object.values(balanceMap).sort((a, b) => 
      parseFloat(b.available) + parseFloat(b.trading || '0') - 
      parseFloat(a.available) - parseFloat(a.trading || '0')
    );
  }, [balances, aggregateMode]);

  // First filter by allowed assets if specified
  const assetFilteredBalances = useMemo(() => {
    if (!allowedAssets || allowedAssets.length === 0) {
      return aggregatedBalances;
    }
    return aggregatedBalances.filter((b) => allowedAssets.includes(b.asset));
  }, [aggregatedBalances, allowedAssets]);

  const filteredBalances = useMemo(() => {
    if (showZeroBalances) {
      return assetFilteredBalances;
    }
    return assetFilteredBalances.filter(
      (b) => parseFloat(b.available) > 0 || parseFloat(b.trading) > 0
    );
  }, [assetFilteredBalances, showZeroBalances]);

  const hasZeroBalances = useMemo(() => {
    return assetFilteredBalances.some(
      (b) => parseFloat(b.available) === 0 && parseFloat(b.trading) === 0
    );
  }, [assetFilteredBalances]);

  // Get asset display info from mappings
  const getAssetInfo = (asset: string) => {
    const mapping = assetMappings.find(m => m.assetId === asset);
    return {
      displayName: mapping?.customName || asset,
      customIcon: mapping?.customIcon,
      iconColor: mapping?.iconColor,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
        <p className="text-sm">Deposit funds to see your balance</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Zero balance toggle */}
      {hasZeroBalances && (
        <div className="flex items-center justify-end gap-2">
          <Switch
            id="show-zero"
            checked={showZeroBalances}
            onCheckedChange={setShowZeroBalances}
          />
          <Label htmlFor="show-zero" className="text-sm text-muted-foreground cursor-pointer">
            {showZeroBalances ? (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Showing all assets
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <EyeOff className="h-3.5 w-3.5" />
                Hiding zero balances
              </span>
            )}
          </Label>
        </div>
      )}

      {filteredBalances.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No assets with balance</p>
          <button
            onClick={() => setShowZeroBalances(true)}
            className="text-sm text-primary hover:underline"
          >
            Show all assets
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="font-semibold">Asset</TableHead>
                <TableHead className="text-right font-semibold">Available</TableHead>
                <TableHead className="text-right font-semibold">Trading</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBalances.map((balance) => {
                const assetInfo = getAssetInfo(balance.asset);
                return (
                  <TableRow key={balance.asset} className="hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {assetInfo.customIcon ? (
                          <img 
                            src={assetInfo.customIcon} 
                            alt={assetInfo.displayName}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : assetInfo.iconColor ? (
                          <div 
                            className="h-6 w-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: assetInfo.iconColor }}
                          >
                            {assetInfo.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        ) : (
                          <AssetIcon asset={balance.asset} size="sm" />
                        )}
                        <span className="font-medium">{assetInfo.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(balance.available).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {parseFloat(balance.trading).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-muted-foreground text-right">
        Showing {filteredBalances.length} of {assetFilteredBalances.length} assets
      </p>
    </div>
  );
};
