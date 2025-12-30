import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, History, Plus, Users, Wallet, Loader2 } from 'lucide-react';
import { AssetIcon } from '@/components/shared/AssetIcon';
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

const mockActivity = [
  { id: '1', type: 'receive', asset: 'BTC', amount: '+0.05 BTC', date: 'Today, 2:30 PM' },
  { id: '2', type: 'send', asset: 'ETH', amount: '-0.5 ETH', date: 'Yesterday' },
  { id: '3', type: 'swap', asset: 'USDC', amount: '+500 USDC', date: '2 days ago' },
];

const WhiteLabelWallet: React.FC = () => {
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
      {/* Account Selector - Top Right */}
      <div className="flex justify-end">
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
        <TabsList className="bg-secondary w-full justify-start">
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

        <TabsContent value="wallet" className="mt-6">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Header Card - Total Balance */}
            <div className="rounded-3xl bg-gradient-to-br from-module-whitelabel via-module-whitelabel/80 to-module-whitelabel/60 p-8 text-center">
              <p className="text-white/80 text-sm mb-2">Total Balance</p>
              <h1 className="text-4xl font-bold text-white mb-1">
                {loadingBalances ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                ) : (
                  `$${totalValue.toLocaleString()}`
                )}
              </h1>
              <p className="text-white/80 text-sm">
                {selectedAccountId ? `Account: ${selectedAccountId.slice(0, 8)}...` : 'No account selected'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
              <Link to="/app/white-label/receive" className="text-center group">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
                  <ArrowDownToLine className="h-6 w-6 text-module-whitelabel" />
                </div>
                <span className="text-xs text-muted-foreground mt-2 block">Receive</span>
              </Link>
              <Link to="/app/white-label/send" className="text-center group">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
                  <ArrowUpFromLine className="h-6 w-6 text-module-whitelabel" />
                </div>
                <span className="text-xs text-muted-foreground mt-2 block">Send</span>
              </Link>
              <Link to="/app/white-label/swap" className="text-center group">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
                  <RefreshCw className="h-6 w-6 text-module-whitelabel" />
                </div>
                <span className="text-xs text-muted-foreground mt-2 block">Swap</span>
              </Link>
              <Link to="/app/white-label/activity" className="text-center group">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
                  <History className="h-6 w-6 text-module-whitelabel" />
                </div>
                <span className="text-xs text-muted-foreground mt-2 block">Activity</span>
              </Link>
            </div>

            {/* Assets */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Your Assets</h3>
              {loadingBalances ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : balances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No assets found</p>
                  <p className="text-sm">Deposit funds to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {balances.map((item) => (
                    <div key={item.asset} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AssetIcon asset={item.asset} size="md" />
                        <div>
                          <p className="font-medium text-foreground">{item.asset}</p>
                          <p className="text-sm text-muted-foreground">{item.total}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-foreground">${parseFloat(item.total).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Activity</h3>
                <Link to="/app/white-label/activity" className="text-sm text-module-whitelabel">
                  See all
                </Link>
              </div>
              <div className="space-y-4">
                {mockActivity.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.type === 'receive' ? 'bg-success/20' : 
                        tx.type === 'send' ? 'bg-warning/20' : 'bg-module-whitelabel/20'
                      }`}>
                        {tx.type === 'receive' && <ArrowDownToLine className="h-5 w-5 text-success" />}
                        {tx.type === 'send' && <ArrowUpFromLine className="h-5 w-5 text-warning" />}
                        {tx.type === 'swap' && <RefreshCw className="h-5 w-5 text-module-whitelabel" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground capitalize">{tx.type}</p>
                        <p className="text-sm text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${
                      tx.type === 'receive' || tx.type === 'swap' ? 'text-success' : 'text-foreground'
                    }`}>
                      {tx.amount}
                    </p>
                  </div>
                ))}
              </div>
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
              <Button onClick={() => setShowOnboarding(true)} className="bg-module-whitelabel hover:bg-module-whitelabel/90">
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
                <p className="text-sm text-muted-foreground">Manage wallets and accounts</p>
              </div>
              <Button onClick={() => setShowCreateAccount(true)} className="bg-module-whitelabel hover:bg-module-whitelabel/90">
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

export default WhiteLabelWallet;
