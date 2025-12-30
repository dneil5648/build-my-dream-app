import React from 'react';
import { Building2, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FiatAccount } from '@/api/types';
import { toast } from 'sonner';

interface FiatAccountsListProps {
  accounts: FiatAccount[];
  isLoading?: boolean;
  emptyMessage?: string;
  onSelect?: (account: FiatAccount) => void;
}

const getNetworkLabel = (network: string): string => {
  const labels: Record<string, string> = {
    WIRE: 'Wire Transfer',
    CBIT: 'CBIT',
    DBS_ACT: 'DBS ACT',
    CUBIX: 'Cubix',
    SCB: 'Standard Chartered',
  };
  return labels[network] || network;
};

const getNetworkColor = (network: string): string => {
  const colors: Record<string, string> = {
    WIRE: 'bg-blue-500/20 text-blue-400',
    CBIT: 'bg-purple-500/20 text-purple-400',
    DBS_ACT: 'bg-red-500/20 text-red-400',
    CUBIX: 'bg-orange-500/20 text-orange-400',
    SCB: 'bg-green-500/20 text-green-400',
  };
  return colors[network] || 'bg-muted text-muted-foreground';
};

export const FiatAccountsList: React.FC<FiatAccountsListProps> = ({
  accounts,
  isLoading,
  emptyMessage = 'No fiat accounts found',
  onSelect,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <div
          key={account.id}
          onClick={() => onSelect?.(account)}
          className={`p-4 rounded-lg border border-border bg-secondary/50 hover:border-module-payins/50 transition-colors ${onSelect ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-module-payins/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-module-payins" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getNetworkColor(account.network)}`}>
                    {getNetworkLabel(account.network)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    account.status === 'APPROVED' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                  }`}>
                    {account.status}
                  </span>
                </div>
                <p className="font-medium text-foreground truncate">
                  {account.description || 'Fiat Account'}
                </p>
                {account.wire_account_number && (
                  <p className="text-sm text-muted-foreground font-mono">
                    ****{account.wire_account_number.slice(-4)}
                  </p>
                )}
                {account.bank_name && (
                  <p className="text-xs text-muted-foreground">{account.bank_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(account.paxos_fiat_account_id);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};