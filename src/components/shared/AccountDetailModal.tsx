import React from 'react';
import { Wallet, Building2, Copy, MapPin, Loader2, Hash, ExternalLink, Bitcoin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BalancesTable } from '@/components/shared/BalancesTable';
import { CryptoAddressList } from '@/components/shared/CryptoAddressList';
import { PaxosAccount, AccountBalanceItem, CryptoAddress, CryptoDestinationAddress } from '@/api/types';
import { toast } from 'sonner';

interface AccountDetailModalProps {
  account: PaxosAccount | null;
  balances: AccountBalanceItem[];
  // Legacy props for PayIns
  cryptoAddresses?: CryptoAddress[];
  isLoadingAddresses?: boolean;
  onCreateAddress?: () => void;
  // New props for Treasury
  depositAddress?: CryptoAddress | null;
  destinationAddress?: CryptoDestinationAddress | null;
  showDetailsTab?: boolean;
  // Common props
  isLoadingBalances?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  balances,
  cryptoAddresses,
  isLoadingAddresses,
  onCreateAddress,
  depositAddress,
  destinationAddress,
  showDetailsTab = false,
  isLoadingBalances,
  isOpen,
  onClose,
}) => {
  if (!account) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // If showDetailsTab is true, use new layout with Details + Balances tabs
  if (showDetailsTab) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-foreground">{account.nickname || 'Account Details'}</span>
                <p className="text-sm text-muted-foreground font-normal">
                  Created {new Date(account.created_at).toLocaleDateString()}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 bg-secondary shrink-0">
              <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Building2 className="h-4 w-4 mr-2" />
                Account Details
              </TabsTrigger>
              <TabsTrigger value="balances" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Wallet className="h-4 w-4 mr-2" />
                Balances
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="details" className="m-0 space-y-6">
                {/* Account Info Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    Identifiers
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Nickname</p>
                      <p className="text-sm font-medium text-foreground">
                        {account.nickname || '—'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-foreground">
                        {account.description || '—'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Paxos Account ID</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-xs text-foreground truncate">
                          {account.paxos_account_id}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(account.paxos_account_id, 'Account ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Identity ID</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-xs text-foreground truncate">
                          {account.paxos_identity_id}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(account.paxos_identity_id, 'Identity ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {account.paxos_profile_id && (
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Profile ID</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-xs text-foreground truncate">
                            {account.paxos_profile_id}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(account.paxos_profile_id, 'Profile ID')}
                          >
                            <Copy className="h-3 w-3" />
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
                </div>

                {/* Deposit Address Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Deposit Address
                  </h3>
                  {depositAddress ? (
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Network</p>
                          <p className="text-sm font-medium text-foreground">{depositAddress.network}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Asset</p>
                          <p className="text-sm font-medium text-foreground">{depositAddress.source_asset}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
                        <div className="flex items-center justify-between gap-2 p-2 bg-background rounded border border-border">
                          <p className="font-mono text-xs text-foreground break-all">
                            {depositAddress.wallet_address}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(depositAddress.wallet_address, 'Deposit address')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-secondary/30 border border-dashed border-border text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">No deposit address configured</p>
                    </div>
                  )}
                </div>

                {/* Destination Address Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    Destination Address
                  </h3>
                  {destinationAddress ? (
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Nickname</p>
                          <p className="text-sm font-medium text-foreground">{destinationAddress.nickname || '—'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Network</p>
                          <p className="text-sm font-medium text-foreground">{destinationAddress.crypto_network}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Destination ID</p>
                        <div className="flex items-center justify-between gap-2 p-2 bg-background rounded border border-border">
                          <p className="font-mono text-xs text-foreground break-all">
                            {destinationAddress.paxos_crypto_destination_id || destinationAddress.id}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(destinationAddress.paxos_crypto_destination_id || destinationAddress.id, 'Destination ID')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Address</p>
                        <div className="flex items-center justify-between gap-2 p-2 bg-background rounded border border-border">
                          <p className="font-mono text-xs text-foreground break-all">
                            {destinationAddress.address}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(destinationAddress.address, 'Address')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-secondary/30 border border-dashed border-border text-center">
                      <ExternalLink className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">No destination address registered</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="balances" className="m-0">
                {isLoadingBalances ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : balances.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No balances yet</p>
                    <p className="text-sm">Deposit funds to see balances</p>
                  </div>
                ) : (
                  <BalancesTable balances={balances} isLoading={isLoadingBalances} />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }

  // Legacy layout for PayIns with Balances + Addresses tabs
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-foreground">{account.nickname || account.description || 'Account Details'}</span>
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
                  onClick={() => copyToClipboard(account.paxos_account_id, 'Account ID')}
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
                  onClick={() => copyToClipboard(account.paxos_identity_id, 'Identity ID')}
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
                    onClick={() => copyToClipboard(account.paxos_profile_id, 'Profile ID')}
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
                  {cryptoAddresses?.length || 0} deposit address{(cryptoAddresses?.length || 0) !== 1 ? 'es' : ''}
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
                addresses={cryptoAddresses || []}
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
