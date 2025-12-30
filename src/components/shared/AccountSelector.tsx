import React from 'react';
import { ChevronDown, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaxosAccount } from '@/api/types';

interface AccountSelectorProps {
  accounts: PaxosAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  onCreateAccount?: () => void;
  isLoading?: boolean;
  label?: string;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onCreateAccount,
  isLoading,
  label = 'Account',
}) => {
  const selectedAccount = accounts.find(
    (a) => a.paxos_account_id === selectedAccountId || a.id === selectedAccountId
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between border-border bg-secondary">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="truncate">
              {isLoading 
                ? 'Loading...' 
                : selectedAccount 
                  ? `Account ${selectedAccount.paxos_account_id.slice(0, 8)}...` 
                  : accounts.length > 0 
                    ? 'Select Account' 
                    : 'No Accounts'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] bg-popover border-border">
        {accounts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No accounts found
          </div>
        ) : (
          accounts.map((account) => (
            <DropdownMenuItem
              key={account.id}
              onClick={() => onSelectAccount(account.paxos_account_id)}
              className={`cursor-pointer ${
                selectedAccountId === account.paxos_account_id ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-3 w-3 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {account.paxos_account_id.slice(0, 8)}...
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(account.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        {onCreateAccount && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateAccount} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Create New Account
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
