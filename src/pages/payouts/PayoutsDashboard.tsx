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
import { CreateIdentityRequest, CreateAccountRequest, PaxosIdentity } from '@/api/types';
import { getModuleIdentityConfig } from '@/pages/config/ConfigPage';
import { toast } from 'sonner';

const mockBankAccounts = [
  { id: '1', name: 'Chase Business', network: 'WIRE', lastFour: '1234', status: 'verified' },
  { id: '2', name: 'Bank of America', network: 'ACH', lastFour: '5678', status: 'verified' },
];

const mockPayouts = [
  { id: '1', amount: '$15,000.00', bankAccount: 'Chase ****1234', status: 'completed' as const, date: '2024-01-15 09:30' },
  { id: '2', amount: '$8,500.00', bankAccount: 'BoA ****5678', status: 'processing' as const, date: '2024-01-14 16:45' },
  { id: '3', amount: '$22,000.00', bankAccount: 'Chase ****1234', status: 'completed' as const, date: '2024-01-12 11:20' },
];

const PayoutsDashboard: React.FC = () => {
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
      setSelectedAccountId(accounts[0].paxos_account_id);
    }
  }, [accounts, selectedAccountId]);

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
              value="$245,500"
              change="+18.2% from last month"
              changeType="positive"
              icon={ArrowUpFromLine}
            />
            <StatCard
              title="Pending"
              value="$8,500"
              change="1 in progress"
              changeType="neutral"
              icon={Clock}
            />
            <StatCard
              title="Completed (30d)"
              value="$237,000"
              change="15 transactions"
              changeType="positive"
              icon={CheckCircle2}
            />
            <StatCard
              title="Bank Accounts"
              value="2"
              change="All verified"
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
            <div className="space-y-3">
              {mockBankAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-module-payouts/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-module-payouts/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-module-payouts" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.network} • ****{account.lastFour}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success capitalize">
                    {account.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payouts */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Recent Payouts</h3>
              <Link to="/app/payouts/history" className="text-sm text-module-payouts hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {mockPayouts.map((payout) => (
                <div 
                  key={payout.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-module-payouts/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                      <ArrowUpFromLine className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{payout.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {payout.bankAccount} • {payout.date}
                      </p>
                    </div>
                  </div>
                  <TransactionStatusBadge status={payout.status} />
                </div>
              ))}
            </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
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

export default PayoutsDashboard;
