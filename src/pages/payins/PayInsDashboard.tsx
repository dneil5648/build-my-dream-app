import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowDownToLine, Clock, CheckCircle2, AlertCircle, Loader2, Building2, Wallet, UserPlus, Bitcoin } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { AccountBalancesCard } from '@/components/shared/AccountBalancesCard';
import { InstitutionOnboardingWizard } from '@/components/shared/InstitutionOnboardingWizard';
import { CreateAccountForm } from '@/components/shared/CreateAccountForm';
import { CryptoAddressList } from '@/components/shared/CryptoAddressList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { useCryptoAddresses } from '@/hooks/useCrypto';
import { Transaction, CreateIdentityRequest, CreateAccountRequest, PaxosIdentity } from '@/api/types';
import { getModuleIdentityConfig } from '@/pages/config/ConfigPage';
import { toast } from 'sonner';

const PayInsDashboard: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const { data: transactionsResponse, isLoading: loadingTransactions } = useTransactions({ 
    limit: 5,
    account_id: selectedAccountId || undefined
  });
  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities();
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();
  const { data: cryptoAddressesResponse, isLoading: loadingCryptoAddresses } = useCryptoAddresses(
    selectedAccountId ? { account_id: selectedAccountId } : undefined
  );

  const transactions = (transactionsResponse?.data || []).filter(
    (tx: Transaction) => tx.type === 'deposit'
  );
  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  const cryptoAddresses = cryptoAddressesResponse?.data || [];

  // Get module config and check for institution identity
  const moduleConfig = getModuleIdentityConfig();
  const configuredIdentity = moduleConfig.payinsIdentityId 
    ? identities.find((i: PaxosIdentity) => i.identity_id === moduleConfig.payinsIdentityId)
    : null;
  const institutionIdentity = configuredIdentity || identities.find((i: PaxosIdentity) => i.identity_type === 'INSTITUTION');
  const needsOnboarding = !loadingIdentities && !institutionIdentity && (moduleConfig.requireOnboarding || !moduleConfig.payinsIdentityId);

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Calculate stats from real data
  const completedDeposits = transactions.filter((t: Transaction) => t.status === 'completed');
  const pendingDeposits = transactions.filter((t: Transaction) => t.status === 'pending');

  const handleCreateIdentity = async (data: CreateIdentityRequest) => {
    try {
      await createIdentity.mutateAsync(data);
      toast.success('Business registered successfully');
      setShowOnboarding(false);
    } catch (error) {
      toast.error('Failed to register business');
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

  // If loading identities, show loading state
  if (loadingIdentities) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Banner - Non-blocking */}
      {needsOnboarding && (
        <div className="rounded-xl bg-gradient-to-r from-module-payins/10 via-module-payins/5 to-transparent border border-module-payins/30 p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-module-payins/20 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-module-payins" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Complete Business Registration</h3>
              <p className="text-sm text-muted-foreground">Register your business to create accounts and receive deposits</p>
            </div>
          </div>
          <Button onClick={() => setShowOnboarding(true)} className="bg-module-payins hover:bg-module-payins/90">
            <UserPlus className="h-4 w-4 mr-2" />
            Onboard Now
          </Button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pay-ins Dashboard</h2>
          <p className="text-muted-foreground">Manage fiat deposits and deposit instructions</p>
        </div>
        <div className="flex items-center gap-3">
          <AccountSelector
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccount={setSelectedAccountId}
            onCreateAccount={institutionIdentity ? () => setShowCreateAccount(true) : undefined}
            isLoading={loadingAccounts}
            label="Account"
          />
          {institutionIdentity && (
            <Button onClick={() => setShowCreateAccount(true)} variant="outline" className="border-module-payins text-module-payins hover:bg-module-payins/10">
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          )}
        </div>
      </div>

      {/* Account Info Bar */}
      {institutionIdentity && (
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-module-payins/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-module-payins" />
            </div>
            <div>
              <p className="font-medium text-foreground">{institutionIdentity.name}</p>
              <p className="text-sm text-muted-foreground">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} • Status: {institutionIdentity.status}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/app/pay-ins/sandbox">
              <Button variant="outline" size="sm" className="border-border">
                Sandbox Deposit
              </Button>
            </Link>
            <Link to="/app/pay-ins/crypto-address">
              <Button variant="outline" size="sm" className="border-module-payins text-module-payins hover:bg-module-payins/10">
                <Bitcoin className="h-4 w-4 mr-2" />
                Crypto Address
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Stats & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Deposits"
              value={loadingTransactions ? '...' : `$${completedDeposits.reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount || '0'), 0).toLocaleString()}`}
              change={`${completedDeposits.length} completed`}
              changeType="positive"
              icon={ArrowDownToLine}
            />
            <StatCard
              title="Pending"
              value={loadingTransactions ? '...' : pendingDeposits.length.toString()}
              change={`${pendingDeposits.length} pending`}
              changeType="neutral"
              icon={Clock}
            />
            <StatCard
              title="Completed (30d)"
              value={loadingTransactions ? '...' : completedDeposits.length.toString()}
              change={`${completedDeposits.length} txns`}
              changeType="positive"
              icon={CheckCircle2}
            />
            <StatCard
              title="Crypto Addresses"
              value={loadingCryptoAddresses ? '...' : cryptoAddresses.length.toString()}
              change="All networks"
              changeType="neutral"
              icon={Bitcoin}
            />
          </div>

          {/* Crypto Addresses */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Crypto Deposit Addresses</h3>
              {institutionIdentity && (
                <Link 
                  to="/app/pay-ins/crypto-address" 
                  className="text-sm text-module-payins hover:underline"
                >
                  Create New
                </Link>
              )}
            </div>

            {cryptoAddresses.length === 0 && !loadingCryptoAddresses ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bitcoin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No crypto deposit addresses found.</p>
                {institutionIdentity ? (
                  <Link to="/app/pay-ins/crypto-address" className="text-module-payins hover:underline">
                    Create your first address
                  </Link>
                ) : (
                  <p className="text-sm">Complete business registration to get started</p>
                )}
              </div>
            ) : (
              <CryptoAddressList 
                addresses={cryptoAddresses} 
                isLoading={loadingCryptoAddresses}
                emptyMessage="No crypto deposit addresses for this account"
              />
            )}
          </div>

          {/* Recent Deposits */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Recent Deposits</h3>
              <Link to="/app/pay-ins/history" className="text-sm text-module-payins hover:underline">
                View All
              </Link>
            </div>
            
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No deposits yet.</p>
                <p className="text-sm">Deposits will appear here once received.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((deposit: Transaction) => (
                  <div 
                    key={deposit.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-module-payins/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                        <ArrowDownToLine className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">${deposit.amount} {deposit.source_asset}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(deposit.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <TransactionStatusBadge status={deposit.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Account Balances */}
        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Account Balances</h3>
            </div>
            
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No accounts yet</p>
                {institutionIdentity ? (
                  <Button 
                    onClick={() => setShowCreateAccount(true)} 
                    variant="link" 
                    className="text-module-payins"
                  >
                    Create your first account
                  </Button>
                ) : (
                  <p className="text-sm">Complete registration first</p>
                )}
              </div>
            ) : (
              <AccountBalancesCard balances={balances} isLoading={loadingBalances} />
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Dialog - Dismissible */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Business Registration</DialogTitle>
          </DialogHeader>
          <InstitutionOnboardingWizard
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

export default PayInsDashboard;
