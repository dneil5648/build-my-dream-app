import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, Wallet, Plus, Users, Loader2 } from 'lucide-react';
import { BalanceCard } from '@/components/shared/BalanceCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { AccountsTable } from '@/components/shared/AccountsTable';
import { IdentitiesTable } from '@/components/shared/IdentitiesTable';
import { OnboardingWizard } from '@/components/shared/OnboardingWizard';
import { CreateAccountForm } from '@/components/shared/CreateAccountForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { CreateIdentityRequest, CreateAccountRequest } from '@/api/types';
import { toast } from 'sonner';

const mockTransactions = [
  { id: '1', type: 'deposit', asset: 'BTC', amount: '+0.15 BTC', status: 'completed' as const, date: '2024-01-15 14:30' },
  { id: '2', type: 'withdrawal', asset: 'ETH', amount: '-2.5 ETH', status: 'processing' as const, date: '2024-01-15 10:15' },
  { id: '3', type: 'deposit', asset: 'USDC', amount: '+10,000 USDC', status: 'completed' as const, date: '2024-01-14 16:45' },
  { id: '4', type: 'withdrawal', asset: 'BTC', amount: '-0.05 BTC', status: 'completed' as const, date: '2024-01-13 09:20' },
];

const CryptoWallet: React.FC = () => {
  const [activeTab, setActiveTab] = useState('wallet');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities();
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();

  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = balancesResponse?.data || [];

  // Auto-select first account if available
  React.useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].paxos_account_id);
    }
  }, [accounts, selectedAccountId]);

  const handleCreateIdentity = async (data: CreateIdentityRequest) => {
    try {
      await createIdentity.mutateAsync(data);
      toast.success('Identity created successfully');
      setShowOnboarding(false);
    } catch (error) {
      toast.error('Failed to create identity');
    }
  };

  const handleCreateAccount = async (data: CreateAccountRequest) => {
    try {
      await createAccount.mutateAsync(data);
      toast.success('Account created successfully');
      setShowCreateAccount(false);
    } catch (error) {
      toast.error('Failed to create account');
    }
  };

  // Calculate total from balances
  const totalValue = balances.reduce((sum, b) => {
    const val = parseFloat(b.total) || 0;
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
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          onCreateAccount={() => setShowCreateAccount(true)}
          isLoading={loadingAccounts}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="wallet">
            <Wallet className="h-4 w-4 mr-2" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="identities">
            <Users className="h-4 w-4 mr-2" />
            Identities
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <Wallet className="h-4 w-4 mr-2" />
            Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-6 mt-6">
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
                  <span className="text-sm">Selected Account</span>
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
                    balance={balance.total}
                    usdValue={`$${parseFloat(balance.total).toLocaleString()}`}
                    change={balance.available !== balance.total ? `${balance.available} available` : ''}
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
            <div className="space-y-3">
              {mockTransactions.map((tx) => (
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
                      <p className="font-medium text-foreground">{tx.amount}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {tx.type} • {tx.date}
                      </p>
                    </div>
                  </div>
                  <TransactionStatusBadge status={tx.status} />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="identities" className="mt-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Identities</h3>
                <p className="text-sm text-muted-foreground">Manage individuals and institutions</p>
              </div>
              <Button onClick={() => setShowOnboarding(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Onboard New
              </Button>
            </div>
            <IdentitiesTable identities={identities} isLoading={loadingIdentities} />
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Accounts</h3>
                <p className="text-sm text-muted-foreground">Manage Paxos accounts</p>
              </div>
              <Button onClick={() => setShowCreateAccount(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </div>
            <AccountsTable accounts={accounts} isLoading={loadingAccounts} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Onboard New Identity</DialogTitle>
          </DialogHeader>
          <OnboardingWizard
            onSubmit={handleCreateIdentity}
            isLoading={createIdentity.isPending}
            onCancel={() => setShowOnboarding(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Create Account Dialog */}
      <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
          </DialogHeader>
          <CreateAccountForm
            identities={identities}
            onSubmit={handleCreateAccount}
            isLoading={createAccount.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CryptoWallet;
