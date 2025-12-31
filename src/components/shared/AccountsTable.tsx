import React from 'react';
import { Building2, Loader2, Wallet, MapPin, ExternalLink, Copy } from 'lucide-react';
import { PaxosAccount, CryptoAddress, CryptoDestinationAddress } from '@/api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AccountsTableProps {
  accounts: PaxosAccount[];
  isLoading?: boolean;
  onSelect?: (account: PaxosAccount) => void;
  selectedId?: string;
  depositAddresses?: CryptoAddress[];
  destinationAddresses?: CryptoDestinationAddress[];
  showAddressColumns?: boolean;
}

export const AccountsTable: React.FC<AccountsTableProps> = ({
  accounts,
  isLoading,
  onSelect,
  selectedId,
  depositAddresses = [],
  destinationAddresses = [],
  showAddressColumns = false,
}) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Helper to find deposit address for an account
  const getDepositAddress = (accountId: string): CryptoAddress | undefined => {
    return depositAddresses.find(addr => addr.paxos_account_id === accountId || addr.id === accountId);
  };

  // Helper to find destination address for an account
  const getDestinationAddress = (accountId: string): CryptoDestinationAddress | undefined => {
    return destinationAddresses.find(dest => dest.account_id === accountId || dest.paxos_account_id === accountId);
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
            <TableHead>Nickname</TableHead>
            <TableHead>Account ID</TableHead>
            {showAddressColumns && (
              <>
                <TableHead>Deposit Address</TableHead>
                <TableHead>Destination ID</TableHead>
              </>
            )}
            {!showAddressColumns && <TableHead>Description</TableHead>}
            <TableHead>Profile</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const depositAddr = getDepositAddress(account.id);
            const destAddr = getDestinationAddress(account.id);
            
            return (
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
                <TableCell className="font-medium text-foreground">
                  {account.nickname || '—'}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {account.paxos_account_id?.slice(0, 16)}...
                </TableCell>
                
                {showAddressColumns && (
                  <>
                    <TableCell>
                      {depositAddr ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              {depositAddr.source_asset} on {depositAddr.network}
                            </span>
                            <span className="font-mono text-xs text-foreground">
                              {depositAddr.wallet_address?.slice(0, 10)}...{depositAddr.wallet_address?.slice(-6)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(depositAddr.wallet_address, 'Deposit address');
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {destAddr ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              {destAddr.nickname || destAddr.crypto_network}
                            </span>
                            <span className="font-mono text-xs text-foreground">
                              {destAddr.paxos_crypto_destination_id?.slice(0, 12)}...
                            </span>
                          </div>
                          {destAddr.paxos_crypto_destination_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(destAddr.paxos_crypto_destination_id!, 'Destination ID');
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </>
                )}
                
                {!showAddressColumns && (
                  <TableCell className="text-muted-foreground">
                    {account.description || '—'}
                  </TableCell>
                )}
                
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
