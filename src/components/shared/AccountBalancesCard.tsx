import React from 'react';
import { BalancesTable } from './BalancesTable';
import { AccountBalanceItem } from '@/api/types';

interface AccountBalancesCardProps {
  balances: AccountBalanceItem[];
  isLoading?: boolean;
}

export const AccountBalancesCard: React.FC<AccountBalancesCardProps> = ({
  balances,
  isLoading,
}) => {
  return (
    <BalancesTable 
      balances={balances} 
      isLoading={isLoading}
      emptyMessage="No balances found"
    />
  );
};
