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

interface BalancesTableProps {
  balances: AccountBalanceItem[];
  isLoading?: boolean;
  showZeroBalances?: boolean;
  emptyMessage?: string;
}

export const BalancesTable: React.FC<BalancesTableProps> = ({
  balances,
  isLoading,
  showZeroBalances: initialShowZero = false,
  emptyMessage = 'No balances found',
}) => {
  const [showZeroBalances, setShowZeroBalances] = useState(initialShowZero);

  const filteredBalances = useMemo(() => {
    if (showZeroBalances) {
      return balances;
    }
    return balances.filter(
      (b) => parseFloat(b.available) > 0 || parseFloat(b.trading) > 0
    );
  }, [balances, showZeroBalances]);

  const hasZeroBalances = useMemo(() => {
    return balances.some(
      (b) => parseFloat(b.available) === 0 && parseFloat(b.trading) === 0
    );
  }, [balances]);

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
              {filteredBalances.map((balance) => (
                <TableRow key={balance.asset} className="hover:bg-secondary/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <AssetIcon asset={balance.asset} size="sm" />
                      <span className="font-medium">{balance.asset}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {parseFloat(balance.available).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {parseFloat(balance.trading).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-muted-foreground text-right">
        Showing {filteredBalances.length} of {balances.length} assets
      </p>
    </div>
  );
};
