import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpFromLine, Building2, Clock, Plus, CheckCircle2, Wallet, Loader2, UserPlus } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { AccountBalancesCard } from '@/components/shared/AccountBalancesCard';
import { InstitutionOnboardingWizard } from '@/components/shared/InstitutionOnboardingWizard';
import { CreateAccountForm } from '@/components/shared/CreateAccountForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { useFiatAccounts } from '@/hooks/useFiat';
import { useTransactions } from '@/hooks/useTransactions';
import { CreateIdentityRequest, CreateAccountRequest, PaxosIdentity, Transaction } from '@/api/types';
import { getModuleIdentityConfig, saveModuleIdentityConfig } from '@/pages/config/ConfigPage';
import { toast } from 'sonner';

const PayoutsDashboard: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities();
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const { data: fiatAccountsResponse, isLoading: loadingFiatAccounts } = useFiatAccounts();
  const { data: transactionsResponse, isLoading: loadingTransactions } = useTransactions({ limit: 5 });
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();

  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  const fiatAccounts = fiatAccountsResponse?.data || [];
  const payouts = (transactionsResponse?.data || []).filter(
    (tx: Transaction) => tx.type === 'withdrawal'
  );

  // Get module config and check for institution identity
  const moduleConfig = getModuleIdentityConfig();
  const configuredIdentity = moduleConfig.payoutsIdentityId 
    ? identities.find((i: PaxosIdentity) => i.identity_id === moduleConfig.payoutsIdentityId)
    : null;
  const institutionIdentity = configuredIdentity || identities.find((i: PaxosIdentity) => i.identity_type === 'INSTITUTION');
  const needsOnboarding = !loadingIdentities && !institutionIdentity && (moduleConfig.requireOnboarding || !moduleConfig.payoutsIdentityId);

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleCreateIdentity = async (data: CreateIdentityRequest): Promise<PaxosIdentity | void> => {
    try {
      const result = await createIdentity.mutateAsync(data);
      const createdIdentity = result?.data as PaxosIdentity;
      
      // Only process for institution identity (final step in wizard)
      if (data.identity_request.institution_details && createdIdentity?.identity_id) {
        // Auto-save to module config
        const currentConfig = getModuleIdentityConfig();
        saveModuleIdentityConfig({
          ...currentConfig,
          payoutsIdentityId: createdIdentity.identity_id,
        });
        
        toast.success('Business registered successfully');
        setShowOnboarding(false);
      }
      
      return createdIdentity;
    } catch (error) {
      toast.error('Failed to register business');
      throw error; // Re-throw to stop the chain
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
        <div className="rounded-xl bg-gradient-to-r from-module-payouts/10 via-module-payouts/5 to-transparent border border-module-payouts/30 p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-module-payouts/20 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-module-payouts" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Complete Business Registration</h3>
              <p className="text-sm text-muted-foreground">Register your business to create accounts and send payouts</p>
            </div>
          </div>
          <Button onClick={() => setShowOnboarding(true)} className="bg-module-payouts hover:bg-module-payouts/90">
            <UserPlus className="h-4 w-4 mr-2" />
            Onboard Now
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pay-outs Dashboard</h2>
          <p className="text-muted-foreground">Manage fiat withdrawals and bank accounts</p>
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
            <Button onClick={() => setShowCreateAccount(true)} variant="outline" className="border-module-payouts text-module-payouts hover:bg-module-payouts/10">
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
            <div className="h-10 w-10 rounded-lg bg-module-payouts/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-module-payouts" />
            </div>
            <div>
              <p className="font-medium text-foreground">{institutionIdentity.name}</p>
              <p className="text-sm text-muted-foreground">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} • Status: {institutionIdentity.status}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/app/payouts/bank-accounts">
              <Button variant="outline" size="sm" className="border-border">
                <Building2 className="h-4 w-4 mr-2" />
                Manage Banks
              </Button>
            </Link>
            <Link to="/app/payouts/create">
              <Button size="sm" className="bg-module-payouts hover:bg-module-payouts/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Payout
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Stats & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Payouts"
              value={loadingTransactions ? '...' : `$${payouts.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0).toLocaleString()}`}
              change={payouts.filter(tx => tx.status === 'completed').length + ' completed'}
              changeType="positive"
              icon={ArrowUpFromLine}
            />
            <StatCard
              title="Pending"
              value={loadingTransactions ? '...' : payouts.filter(tx => tx.status === 'pending').length.toString()}
              change={payouts.filter(tx => tx.status === 'pending').length + ' in progress'}
              changeType="neutral"
              icon={Clock}
            />
            <StatCard
              title="Completed"
              value={loadingTransactions ? '...' : payouts.filter(tx => tx.status === 'completed').length.toString()}
              change="Recent transactions"
              changeType="positive"
              icon={CheckCircle2}
            />
            <StatCard
              title="Bank Accounts"
              value={loadingFiatAccounts ? '...' : fiatAccounts.length.toString()}
              change={fiatAccounts.filter(a => a.status === 'verified').length + ' verified'}
              changeType="neutral"
              icon={Building2}
            />
          </div>

          {/* Bank Accounts */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Registered Bank Accounts</h3>
              {institutionIdentity && (
                <Link to="/app/payouts/bank-accounts/new" className="text-sm text-module-payouts hover:underline">
                  Add New
                </Link>
              )}
            </div>
            {loadingFiatAccounts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : fiatAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bank accounts registered</p>
                {institutionIdentity ? (
                  <Link to="/app/payouts/bank-accounts/new" className="text-module-payouts hover:underline">
                    Add your first bank account
                  </Link>
                ) : (
                  <p className="text-sm">Complete registration first</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {fiatAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-module-payouts/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-module-payouts/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-module-payouts" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{account.network}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.paxos_fiat_account_id.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success capitalize">
                      {account.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payouts */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Recent Payouts</h3>
              <Link to="/app/payouts/history" className="text-sm text-module-payouts hover:underline">
                View All
              </Link>
            </div>
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No payouts yet</p>
                <p className="text-sm">Payouts will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payouts.map((payout: Transaction) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-module-payouts/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                        <ArrowUpFromLine className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">${payout.amount} {payout.source_asset}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <TransactionStatusBadge status={payout.status} />
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
                    className="text-module-payouts"
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
            module="PAY_OUTS"
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
            module="PAY_OUTS"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutsDashboard;
