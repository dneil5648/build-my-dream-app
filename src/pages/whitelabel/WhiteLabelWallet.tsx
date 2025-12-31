import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, History, Plus, Loader2, Wallet } from 'lucide-react';
import { BalancesTable } from '@/components/shared/BalancesTable';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { WalletOnboardingWizard } from '@/components/shared/WalletOnboardingWizard';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { useTransactions } from '@/hooks/useTransactions';
import { useCryptoAddresses } from '@/hooks/useCrypto';
import { CryptoAddressList } from '@/components/shared/CryptoAddressList';
import { DepositAddressDetailModal } from '@/components/shared/DepositAddressDetailModal';
import { CreateIdentityRequest, CreateAccountRequest, PaxosIdentity, Transaction, CryptoAddress, AccountBalanceItem } from '@/api/types';
import { getWhiteLabelConfig, WhiteLabelConfig } from '@/pages/config/ConfigPage';
import { toast } from 'sonner';

// Stablecoins only for this wallet
const SUPPORTED_STABLECOINS = ['USDC', 'USDT', 'USDP', 'PYUSD', 'USDG', 'DAI', 'BUSD'];

const WhiteLabelWallet: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<CryptoAddress | null>(null);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'WHITE_LABEL' });
  const { data: identitiesResponse } = useIdentities({ module: 'WHITE_LABEL' });
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const { transactions: allTransactions, isLoading: loadingTransactions } = useTransactions({ 
    limit: 5,
    account_id: selectedAccountId || undefined,
  });
  const { data: cryptoAddressesResponse, isLoading: loadingAddresses } = useCryptoAddresses(
    selectedAccountId ? { account_id: selectedAccountId } : undefined
  );
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();

  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const allBalances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  // Filter to only show stablecoins
  const balances = allBalances.filter((b: AccountBalanceItem) => SUPPORTED_STABLECOINS.includes(b.asset));
  const transactions = allTransactions.filter(
    (tx: Transaction) => tx.transaction_type === 'CRYPTO_DEPOSIT' || tx.transaction_type === 'CRYPTO_WITHDRAWAL'
  );

  // Get addresses for selected account - only show addresses belonging to accounts in this module
  const selectedAccountData = accounts.find(acc => acc.id === selectedAccountId);
  const moduleAccountIds = accounts.map(acc => acc.paxos_account_id);
  const allCryptoAddresses = cryptoAddressesResponse?.data || [];
  // Filter to only addresses belonging to accounts in WHITE_LABEL module
  const moduleAddresses = allCryptoAddresses.filter((addr: CryptoAddress) => 
    moduleAccountIds.includes(addr.paxos_account_id)
  );
  // Further filter to selected account if one is selected
  const cryptoAddresses = selectedAccountData 
    ? moduleAddresses.filter((addr: CryptoAddress) => addr.paxos_account_id === selectedAccountData.paxos_account_id)
    : moduleAddresses;

  // Load white label config
  useEffect(() => {
    const config = getWhiteLabelConfig();
    if (config) {
      setWhiteLabelConfig(config);
    }
  }, []);

  // Auto-select first account if available
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleCreateIdentity = async (data: CreateIdentityRequest): Promise<PaxosIdentity | void> => {
    try {
      const result = await createIdentity.mutateAsync(data);
      return result.data;
    } catch (error) {
      toast.error('Failed to create identity');
      throw error;
    }
  };

  const handleCreateWallet = async (data: CreateAccountRequest) => {
    try {
      await createAccount.mutateAsync(data);
      toast.success('Wallet created successfully');
      setShowOnboarding(false);
    } catch (error) {
      toast.error('Failed to create wallet');
      throw error;
    }
  };

  // Get custom asset name from config
  const getAssetDisplayName = (asset: string): string => {
    if (!whiteLabelConfig) return asset;
    const mapping = whiteLabelConfig.assetMappings.find(m => m.assetId === asset);
    return mapping?.customName || asset;
  };

  // Calculate total from balances
  const totalValue = balances.reduce((sum, b) => {
    const val = parseFloat(b.available) || 0;
    return sum + val;
  }, 0);

  const walletName = whiteLabelConfig?.walletName || 'My Wallet';
  const selectedWallet = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{walletName}</h2>
          <p className="text-muted-foreground">Manage your stablecoin assets</p>
        </div>
        <div className="flex items-center gap-3">
          <AccountSelector
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccount={setSelectedAccountId}
            onCreateAccount={() => setShowOnboarding(true)}
            isLoading={loadingAccounts}
            label="Select Wallet"
          />
          <Button 
            onClick={() => setShowOnboarding(true)} 
            variant="outline"
            className="border-module-whitelabel text-module-whitelabel hover:bg-module-whitelabel/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Wallet
          </Button>
        </div>
      </div>

      {/* Wallet Info Bar */}
      {selectedWallet && (
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-module-whitelabel/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-module-whitelabel" />
            </div>
            <div>
              <p className="font-medium text-foreground">{selectedWallet.nickname || `Wallet ${selectedWallet.paxos_account_id.slice(0, 8)}...`}</p>
              <p className="text-sm text-muted-foreground">
                {balances.length} asset{balances.length !== 1 ? 's' : ''} • {cryptoAddresses.length} deposit address{cryptoAddresses.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-secondary/50 p-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-module-whitelabel data-[state=active]:text-white">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="receive" className="data-[state=active]:bg-module-whitelabel data-[state=active]:text-white">
            Receive
          </TabsTrigger>
          <TabsTrigger value="send" className="data-[state=active]:bg-module-whitelabel data-[state=active]:text-white">
            Send
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-module-whitelabel data-[state=active]:text-white">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Header Card - Total Balance */}
            <div className="rounded-3xl bg-gradient-to-br from-module-whitelabel via-module-whitelabel/80 to-module-whitelabel/60 p-8 text-center">
              <p className="text-white/80 text-sm mb-2">Total Balance</p>
              <h1 className="text-4xl font-bold text-white mb-1">
                {loadingBalances ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                ) : (
                  `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </h1>
              <p className="text-white/80 text-sm">
                Aggregate stablecoin balance
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              <Link to="/app/white-label/receive" className="text-center group">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
                  <ArrowDownToLine className="h-7 w-7 text-module-whitelabel" />
                </div>
                <span className="text-sm text-muted-foreground mt-2 block">Receive</span>
              </Link>
              <Link to="/app/white-label/send" className="text-center group">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
                  <ArrowUpFromLine className="h-7 w-7 text-module-whitelabel" />
                </div>
                <span className="text-sm text-muted-foreground mt-2 block">Send</span>
              </Link>
              <Link to="/app/white-label/activity" className="text-center group">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
                  <History className="h-7 w-7 text-module-whitelabel" />
                </div>
                <span className="text-sm text-muted-foreground mt-2 block">Activity</span>
              </Link>
            </div>

            {/* Per-Asset Balance Cards */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Your Assets</h3>
              {loadingBalances ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : balances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground glass rounded-xl p-6">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No stablecoin balances yet</p>
                  <p className="text-sm">Deposit stablecoins to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {balances.map((balance: AccountBalanceItem) => {
                    const mapping = whiteLabelConfig?.assetMappings.find(m => m.assetId === balance.asset);
                    const displayName = mapping?.customName || balance.asset;
                    
                    return (
                      <div key={balance.asset} className="glass rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {mapping?.customIcon ? (
                            <img src={mapping.customIcon} alt={displayName} className="h-10 w-10 rounded-full" />
                          ) : (
                            <AssetIcon asset={balance.asset} size="md" />
                          )}
                          <div>
                            <p className="font-semibold text-foreground">{displayName}</p>
                            <p className="text-xs text-muted-foreground">Stablecoin</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {parseFloat(balance.available).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                          </p>
                          <p className="text-xs text-muted-foreground">Available</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Activity</h3>
                <Link to="/app/white-label/activity" className="text-sm text-module-whitelabel hover:underline">
                  See all
                </Link>
              </div>
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 4).map((tx: Transaction) => {
                    const isDeposit = tx.transaction_type === 'CRYPTO_DEPOSIT';
                    const displayName = getAssetDisplayName(tx.source_asset);
                    
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            isDeposit ? 'bg-success/20' : 'bg-warning/20'
                          }`}>
                            {isDeposit ? (
                              <ArrowDownToLine className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowUpFromLine className="h-4 w-4 text-warning" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {isDeposit ? 'Received' : 'Sent'} {displayName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${isDeposit ? 'text-success' : 'text-warning'}`}>
                            {isDeposit ? '+' : '-'}{tx.amount}
                          </p>
                          <TransactionStatusBadge status={tx.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Receive Tab */}
        <TabsContent value="receive" className="mt-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Deposit Addresses</h3>
                  <p className="text-sm text-muted-foreground">Receive stablecoins to your wallet</p>
                </div>
                <Link to="/app/white-label/receive">
                  <Button className="bg-module-whitelabel hover:bg-module-whitelabel/90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Address
                  </Button>
                </Link>
              </div>
              
              <CryptoAddressList 
                addresses={cryptoAddresses} 
                isLoading={loadingAddresses}
                emptyMessage="No deposit addresses yet. Create one to receive stablecoins."
                onSelect={(addr) => setSelectedAddress(addr)}
              />
            </div>

            {/* Safety Notice */}
            <div className="rounded-xl bg-warning/10 border border-warning/30 p-4">
              <div className="flex items-start gap-3">
                <ArrowDownToLine className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">Network Matching Required</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Only send stablecoins on the correct network to each address. Funds sent on the wrong network may be permanently lost.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Send Tab */}
        <TabsContent value="send" className="mt-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Send Stablecoins</h3>
                  <p className="text-sm text-muted-foreground">Withdraw to external wallets</p>
                </div>
              </div>
              
              <div className="text-center py-8">
                <ArrowUpFromLine className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">Send stablecoins to an external wallet address</p>
                <Link to="/app/white-label/send">
                  <Button className="bg-warning hover:bg-warning/90 text-warning-foreground">
                    <ArrowUpFromLine className="h-4 w-4 mr-2" />
                    New Withdrawal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
              <Link to="/app/white-label/activity">
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Full History
                </Button>
              </Link>
            </div>
            
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx: Transaction) => {
                  const isDeposit = tx.transaction_type === 'CRYPTO_DEPOSIT';
                  const displayName = getAssetDisplayName(tx.source_asset);
                  
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isDeposit ? 'bg-success/20' : 'bg-warning/20'
                        }`}>
                          {isDeposit ? (
                            <ArrowDownToLine className="h-5 w-5 text-success" />
                          ) : (
                            <ArrowUpFromLine className="h-5 w-5 text-warning" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {isDeposit ? 'Received' : 'Sent'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {displayName} • {new Date(tx.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${isDeposit ? 'text-success' : 'text-warning'}`}>
                          {isDeposit ? '+' : '-'}{tx.amount} {displayName}
                        </p>
                        <TransactionStatusBadge status={tx.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Wallet Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create New Wallet</DialogTitle>
          </DialogHeader>
          <WalletOnboardingWizard
            onCreateIdentity={handleCreateIdentity}
            onCreateWallet={handleCreateWallet}
            existingIdentities={identities}
            isLoading={createIdentity.isPending || createAccount.isPending}
            onCancel={() => setShowOnboarding(false)}
            module="WHITE_LABEL"
          />
        </DialogContent>
      </Dialog>

      {/* Deposit Address Detail Modal */}
      <DepositAddressDetailModal
        address={selectedAddress}
        isOpen={!!selectedAddress}
        onClose={() => setSelectedAddress(null)}
      />
    </div>
  );
};

export default WhiteLabelWallet;