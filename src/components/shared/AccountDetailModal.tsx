import React from 'react';
import { Wallet, Building2, Copy, Bitcoin, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BalancesTable } from '@/components/shared/BalancesTable';
import { CryptoAddressList } from '@/components/shared/CryptoAddressList';
import { PaxosAccount, AccountBalanceItem, CryptoAddress } from '@/api/types';
import { toast } from 'sonner';

interface AccountDetailModalProps {
  account: PaxosAccount | null;
  balances: AccountBalanceItem[];
  cryptoAddresses: CryptoAddress[];
  isLoadingBalances?: boolean;
  isLoadingAddresses?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCreateAddress?: () => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  balances,
  cryptoAddresses,
  isLoadingBalances,
  isLoadingAddresses,
  isOpen,
  onClose,
  onCreateAddress,
}) => {
  if (!account) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-foreground">{account.description || 'Account Details'}</span>
              <p className="text-sm text-muted-foreground font-normal">
                Created {new Date(account.created_at).toLocaleDateString()}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Account Info */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Paxos Account ID</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-foreground truncate">
                  {account.paxos_account_id}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(account.paxos_account_id)}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Identity ID</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-foreground truncate">
                  {account.paxos_identity_id}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(account.paxos_identity_id)}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {account.paxos_profile_id && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Profile ID</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm text-foreground truncate">
                    {account.paxos_profile_id}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(account.paxos_profile_id)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                account.status === 'ACTIVE' || !account.status 
                  ? 'bg-success/20 text-success' 
                  : 'bg-warning/20 text-warning'
              }`}>
                {account.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          <Tabs defaultValue="balances" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="balances" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Wallet className="h-4 w-4 mr-2" />
                Balances
              </TabsTrigger>
              <TabsTrigger value="addresses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Bitcoin className="h-4 w-4 mr-2" />
                Deposit Addresses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="balances" className="mt-4">
              {isLoadingBalances ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : balances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No balances yet</p>
                  <p className="text-sm">Deposit funds to see balances</p>
                </div>
              ) : (
                <BalancesTable balances={balances} isLoading={isLoadingBalances} />
              )}
            </TabsContent>

            <TabsContent value="addresses" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {cryptoAddresses.length} deposit address{cryptoAddresses.length !== 1 ? 'es' : ''}
                </p>
                {onCreateAddress && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onCreateAddress}
                    className="border-module-payins text-module-payins hover:bg-module-payins/10"
                  >
                    <Bitcoin className="h-4 w-4 mr-2" />
                    New Address
                  </Button>
                )}
              </div>
              <CryptoAddressList
                addresses={cryptoAddresses}
                isLoading={isLoadingAddresses}
                emptyMessage="No deposit addresses for this account"
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};