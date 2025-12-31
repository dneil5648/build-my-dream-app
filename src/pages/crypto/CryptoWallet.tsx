import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Plus, Loader2, Wallet, Clock, History } from 'lucide-react';
import { BalancesTable } from '@/components/shared/BalancesTable';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { WalletOnboardingWizard } from '@/components/shared/WalletOnboardingWizard';
import { CryptoAddressList } from '@/components/shared/CryptoAddressList';
import { DepositAddressDetailModal } from '@/components/shared/DepositAddressDetailModal';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { useTransactions } from '@/hooks/useTransactions';
import { useCryptoAddresses } from '@/hooks/useCrypto';
import { CreateIdentityRequest, CreateAccountRequest, PaxosIdentity, Transaction, CryptoAddress, AccountBalanceItem } from '@/api/types';
import { toast } from 'sonner';

// Stablecoins only for this wallet
const SUPPORTED_STABLECOINS = ['USDC', 'USDT', 'USDP', 'PYUSD', 'USDG', 'DAI', 'BUSD'];

const CryptoWallet: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<CryptoAddress | null>(null);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'CRYPTO_WALLET' });
  const { data: identitiesResponse } = useIdentities({ module: 'CRYPTO_WALLET' });
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
  // Filter to only addresses belonging to accounts in CRYPTO_WALLET module
  const moduleAddresses = allCryptoAddresses.filter((addr: CryptoAddress) => 
    moduleAccountIds.includes(addr.paxos_account_id)
  );
  // Further filter to selected account if one is selected
  const cryptoAddresses = selectedAccountData 
    ? moduleAddresses.filter((addr: CryptoAddress) => addr.paxos_account_id === selectedAccountData.paxos_account_id)
    : moduleAddresses;

  React.useEffect(() => {
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

  // Calculate total balance (sum of all stablecoin balances)
  const totalBalance = balances.reduce((sum, b) => {
    const val = parseFloat(b.available) || 0;
    return sum + val;
  }, 0);

  const selectedWallet = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Stablecoin Wallet</h2>
          <p className="text-muted-foreground">Manage your stablecoin assets</p>
        </div>
        <div className="flex items-center gap-3">
          <AccountSelector
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccount={setSelectedAccountId}
            onCreateAccount={() => setShowOnboarding(true)}
            isLoading={loadingAccounts}
            label="Wallet"
          />
          <Button 
            onClick={() => setShowOnboarding(true)} 
            variant="outline"
            className="border-module-crypto text-module-crypto hover:bg-module-crypto/10"
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
            <div className="h-10 w-10 rounded-lg bg-module-crypto/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-module-crypto" />
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
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-module-crypto data-[state=active]:text-white">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="deposit" className="data-[state=active]:bg-module-crypto data-[state=active]:text-white">
            Receive
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="data-[state=active]:bg-module-crypto data-[state=active]:text-white">
            Send
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-module-crypto data-[state=active]:text-white">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Total Balance Card */}
              <div className="glass rounded-2xl p-8 gradient-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2">Total Balance</p>
                    <h1 className="text-4xl font-bold text-foreground">
                      {loadingBalances ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      Aggregate stablecoin balance
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link to="/app/crypto/deposit">
                      <Button className="bg-success hover:bg-success/90 text-success-foreground">
                        <ArrowDownToLine className="h-4 w-4 mr-2" />
                        Receive
                      </Button>
                    </Link>
                    <Link to="/app/crypto/withdraw">
                      <Button variant="outline" className="border-warning text-warning hover:bg-warning/10">
                        <ArrowUpFromLine className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Per-Asset Balance Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                {loadingBalances ? (
                  <div className="col-span-2 flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : balances.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-muted-foreground glass rounded-xl p-6">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stablecoin balances yet</p>
                    <p className="text-sm">Deposit stablecoins to get started</p>
                  </div>
                ) : (
                  balances.map((balance: AccountBalanceItem) => (
                    <div key={balance.asset} className="glass rounded-xl p-5 border border-border hover:border-module-crypto/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <AssetIcon asset={balance.asset} size="md" />
                        <div>
                          <p className="font-semibold text-foreground">{balance.asset}</p>
                          <p className="text-xs text-muted-foreground">Stablecoin</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Available</span>
                          <span className="font-medium text-foreground">{parseFloat(balance.available).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                        </div>
                        {balance.trading && parseFloat(balance.trading) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">In Transit</span>
                            <span className="text-sm text-muted-foreground">{parseFloat(balance.trading).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link to="/app/crypto/deposit" className="block">
                    <Button variant="outline" className="w-full justify-start border-border hover:border-success/50 hover:bg-success/5">
                      <ArrowDownToLine className="h-4 w-4 mr-3 text-success" />
                      <span>Receive Stablecoins</span>
                    </Button>
                  </Link>
                  <Link to="/app/crypto/withdraw" className="block">
                    <Button variant="outline" className="w-full justify-start border-border hover:border-warning/50 hover:bg-warning/5">
                      <ArrowUpFromLine className="h-4 w-4 mr-3 text-warning" />
                      <span>Send Stablecoins</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Recent Activity</h3>
                  <Link to="/app/crypto/activity" className="text-sm text-primary hover:underline">
                    View All
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
                    {transactions.slice(0, 4).map((tx: Transaction) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            tx.transaction_type === 'CRYPTO_DEPOSIT' ? 'bg-success/20' : 'bg-warning/20'
                          }`}>
                            {tx.transaction_type === 'CRYPTO_DEPOSIT' ? (
                              <ArrowDownToLine className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowUpFromLine className="h-4 w-4 text-warning" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {tx.transaction_type === 'CRYPTO_DEPOSIT' ? 'Received' : 'Sent'} {tx.source_asset}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${tx.transaction_type === 'CRYPTO_DEPOSIT' ? 'text-success' : 'text-warning'}`}>
                            {tx.transaction_type === 'CRYPTO_DEPOSIT' ? '+' : '-'}{tx.amount}
                          </p>
                          <TransactionStatusBadge status={tx.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Receive Tab */}
        <TabsContent value="deposit" className="mt-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Deposit Addresses</h3>
                  <p className="text-sm text-muted-foreground">Receive stablecoins to your wallet</p>
                </div>
                <Link to="/app/crypto/deposit">
                  <Button className="bg-module-crypto hover:bg-module-crypto/90">
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
                <Clock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
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
        <TabsContent value="withdraw" className="mt-6">
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
                <Link to="/app/crypto/withdraw">
                  <Button className="bg-warning hover:bg-warning/90 text-warning-foreground">
                    <ArrowUpFromLine className="h-4 w-4 mr-2" />
                    New Withdrawal
                  </Button>
                </Link>
              </div>
            </div>

            {/* Withdrawal Notice */}
            <div className="rounded-xl bg-muted/50 border border-border p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Withdrawal Processing</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Withdrawals are processed on the blockchain and may take time depending on network congestion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
              <Link to="/app/crypto/activity">
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
                {transactions.map((tx: Transaction) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.transaction_type === 'CRYPTO_DEPOSIT' ? 'bg-success/20' : 'bg-warning/20'
                      }`}>
                        {tx.transaction_type === 'CRYPTO_DEPOSIT' ? (
                          <ArrowDownToLine className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowUpFromLine className="h-5 w-5 text-warning" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {tx.transaction_type === 'CRYPTO_DEPOSIT' ? 'Received' : 'Sent'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tx.source_asset} • {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${tx.transaction_type === 'CRYPTO_DEPOSIT' ? 'text-success' : 'text-warning'}`}>
                        {tx.transaction_type === 'CRYPTO_DEPOSIT' ? '+' : '-'}{tx.amount} {tx.source_asset}
                      </p>
                      <TransactionStatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
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
            module="CRYPTO_WALLET"
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

export default CryptoWallet;