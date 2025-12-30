import React from 'react';
import { Loader2, Wallet } from 'lucide-react';
import { AssetIcon } from './AssetIcon';
import { AccountBalance } from '@/api/types';

interface AccountBalancesCardProps {
  balances: AccountBalance[];
  isLoading?: boolean;
}

export const AccountBalancesCard: React.FC<AccountBalancesCardProps> = ({
  balances,
  isLoading,
}) => {
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
        <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No balances found</p>
        <p className="text-sm">Deposit funds to see your balance</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {balances.map((balance) => (
        <div
          key={balance.asset}
          className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
        >
          <div className="flex items-center gap-3">
            <AssetIcon asset={balance.asset} size="sm" />
            <div>
              <p className="font-medium text-foreground">{balance.asset}</p>
              <p className="text-sm text-muted-foreground">
                Available: {balance.available}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-foreground">{balance.total}</p>
            {balance.trading !== '0' && (
              <p className="text-sm text-muted-foreground">
                In Trading: {balance.trading}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
