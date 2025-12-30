import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, Wallet, Plus, Loader2 } from 'lucide-react';
import { BalanceCard } from '@/components/shared/BalanceCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { WalletOnboardingWizard } from '@/components/shared/WalletOnboardingWizard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { useTransactions } from '@/hooks/useTransactions';
import { CreateIdentityRequest, CreateAccountRequest, PaxosIdentity, Transaction } from '@/api/types';
import { toast } from 'sonner';

const CryptoWallet: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: identitiesResponse } = useIdentities();
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const { data: transactionsResponse, isLoading: loadingTransactions } = useTransactions({ limit: 4 });
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();

  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  const transactions = (transactionsResponse?.data || []).filter(
    (tx: Transaction) => tx.type === 'deposit' || tx.type === 'withdrawal'
  );

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

  // Calculate total from balances
  const totalValue = balances.reduce((sum, b) => {
    const val = parseFloat(b.available) || 0;
    return sum + val;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Crypto Wallet</h2>
          <p className="text-muted-foreground">Manage your crypto assets and transactions</p>
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
            className="border-module-crypto text-module-crypto hover:bg-module-crypto/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Wallet
          </Button>
        </div>
      </div>

      {/* Total Value Card */}
      <div className="glass rounded-2xl p-8 gradient-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground mb-2">Total Portfolio Value</p>
            <h1 className="text-4xl font-bold text-foreground">
              {loadingBalances ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                `$${totalValue.toLocaleString()}`
              )}
            </h1>
            <p className="text-success mt-2 flex items-center gap-1">
              <span className="text-sm">Selected Wallet</span>
              <span className="text-xs text-muted-foreground">
                {selectedAccountId ? selectedAccountId.slice(0, 12) + '...' : 'None selected'}
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/app/crypto/deposit">
              <Button className="bg-success hover:bg-success/90 text-success-foreground">
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Deposit
              </Button>
            </Link>
            <Link to="/app/crypto/withdraw">
              <Button variant="outline" className="border-border">
                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </Link>
            <Link to="/app/treasury/convert">
              <Button variant="outline" className="border-border">
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Balances Grid */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Your Assets</h3>
        {loadingBalances ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground glass rounded-xl">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No assets found</p>
            <p className="text-sm">Deposit funds to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {balances.map((balance) => (
              <BalanceCard
                key={balance.asset}
                asset={balance.asset}
                balance={balance.available}
                usdValue={`$${parseFloat(balance.available).toLocaleString()}`}
                change={balance.trading !== '0' ? `${balance.trading} in trading` : ''}
                changeType="neutral"
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
          <Link to="/app/crypto/history" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        {loadingTransactions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent transactions</p>
            <p className="text-sm">Transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: Transaction) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-success/20' : 'bg-warning/20'
                  }`}>
                    {tx.type === 'deposit' ? (
                      <ArrowDownToLine className={`h-5 w-5 text-success`} />
                    ) : (
                      <ArrowUpFromLine className={`h-5 w-5 text-warning`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.source_asset}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {tx.type} • {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <TransactionStatusBadge status={tx.status} />
              </div>
            ))}
          </div>
        )}
      </div>

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
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CryptoWallet;
