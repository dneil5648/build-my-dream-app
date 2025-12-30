import React from 'react';
import { Building2, Loader2, Wallet } from 'lucide-react';
import { PaxosAccount } from '@/api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="w-12"></TableHead>
            <TableHead>Account ID</TableHead>
            <TableHead>Identity ID</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Profile</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow
              key={account.id}
              onClick={() => onSelect?.(account)}
              className={`cursor-pointer transition-colors ${
                selectedId === account.id
                  ? 'bg-primary/10 hover:bg-primary/15'
                  : 'hover:bg-secondary/50'
              }`}
            >
              <TableCell className="w-12">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm text-foreground">
                {account.paxos_account_id?.slice(0, 16)}...
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {account.paxos_identity_id?.slice(0, 12)}...
              </TableCell>
              <TableCell className="text-muted-foreground">
                {account.description || '—'}
              </TableCell>
              <TableCell>
                {account.paxos_profile_id ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">
                    Has Profile
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {new Date(account.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
