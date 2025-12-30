import React from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { PaxosAccount } from '@/api/types';

interface AccountsTableProps {
  accounts: PaxosAccount[];
  isLoading?: boolean;
  onSelect?: (account: PaxosAccount) => void;
  selectedId?: string;
}

export const AccountsTable: React.FC<AccountsTableProps> = ({
  accounts,
  isLoading,
  onSelect,
  selectedId,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No accounts found</p>
        <p className="text-sm">Create an identity first, then create an account</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <div
          key={account.id}
          onClick={() => onSelect?.(account)}
          className={`p-4 rounded-lg border transition-colors cursor-pointer ${
            selectedId === account.id
              ? 'bg-primary/10 border-primary'
              : 'bg-secondary/50 border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Account {account.paxos_account_id?.slice(0, 8)}...
                </p>
                <p className="text-sm text-muted-foreground">
                  Identity: {account.paxos_identity_id?.slice(0, 8)}...
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {new Date(account.created_at).toLocaleDateString()}
              </p>
              {account.paxos_profile_id && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                  Has Profile
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
