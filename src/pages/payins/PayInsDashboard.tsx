import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowDownToLine, Clock, CheckCircle2, AlertCircle, Loader2, Building2, Wallet } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { AccountBalancesCard } from '@/components/shared/AccountBalancesCard';
import { InstitutionOnboardingWizard } from '@/components/shared/InstitutionOnboardingWizard';
import { CreateAccountForm } from '@/components/shared/CreateAccountForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDepositInstructions } from '@/hooks/useFiat';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { FiatDepositInstructions, Transaction, CreateIdentityRequest, CreateAccountRequest, PaxosIdentity } from '@/api/types';
import { toast } from 'sonner';

const PayInsDashboard: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const { data: instructionsResponse, isLoading: loadingInstructions } = useDepositInstructions();
  const { data: transactionsResponse, isLoading: loadingTransactions } = useTransactions({ limit: 5 });
  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities();
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();

  const instructions = instructionsResponse?.data || [];
  const transactions = (transactionsResponse?.data || []).filter(
    (tx: Transaction) => tx.type === 'deposit'
  );
  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = balancesResponse?.data || [];

  // Check if institution identity exists
  const institutionIdentity = identities.find((i: PaxosIdentity) => i.identity_type === 'INSTITUTION');
  const needsOnboarding = !loadingIdentities && !institutionIdentity;

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].paxos_account_id);
    }
  }, [accounts, selectedAccountId]);

  // Show onboarding if needed
  useEffect(() => {
    if (needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [needsOnboarding]);

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

  // If no institution identity, show onboarding prompt
  if (needsOnboarding && !showOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-module-payins/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-module-payins" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Complete Business Registration</h2>
          <p className="text-muted-foreground mb-6">
            To use Pay-ins, you need to register your business first. This is a one-time setup.
          </p>
          <Button onClick={() => setShowOnboarding(true)} className="bg-module-payins hover:bg-module-payins/90">
            Start Registration
          </Button>
        </div>

        {/* Onboarding Dialog */}
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            onCreateAccount={() => setShowCreateAccount(true)}
            isLoading={loadingAccounts}
            label="Account"
          />
          <Button onClick={() => setShowCreateAccount(true)} variant="outline" className="border-module-payins text-module-payins hover:bg-module-payins/10">
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
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
            <Link to="/app/pay-ins/create">
              <Button size="sm" className="bg-module-payins hover:bg-module-payins/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Instructions
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
              title="Active Instructions"
              value={loadingInstructions ? '...' : instructions.length.toString()}
              change="All networks"
              changeType="neutral"
              icon={AlertCircle}
            />
          </div>

          {/* Active Deposit Instructions */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Active Deposit Instructions</h3>
              <Link to="/app/pay-ins/create" className="text-sm text-module-payins hover:underline">
                Create New
              </Link>
            </div>
            
            {loadingInstructions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : instructions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowDownToLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No deposit instructions found.</p>
                <Link to="/app/pay-ins/create" className="text-module-payins hover:underline">
                  Create your first instruction
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {instructions.map((instruction: FiatDepositInstructions) => (
                  <div 
                    key={instruction.id}
                    className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-module-payins/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-module-payins/10 flex items-center justify-center">
                          <ArrowDownToLine className="h-5 w-5 text-module-payins" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{instruction.network}</p>
                          <p className="text-sm text-muted-foreground">
                            Type: {instruction.account_type} • ID: {instruction.deposit_instructions_id?.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        instruction.status === 'active' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {instruction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
                <Button 
                  onClick={() => setShowCreateAccount(true)} 
                  variant="link" 
                  className="text-module-payins"
                >
                  Create your first account
                </Button>
              </div>
            ) : (
              <AccountBalancesCard balances={balances} isLoading={loadingBalances} />
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={(open) => !needsOnboarding && setShowOnboarding(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Business Registration</DialogTitle>
          </DialogHeader>
          <InstitutionOnboardingWizard
            onSubmit={handleCreateIdentity}
            isLoading={createIdentity.isPending}
            onCancel={needsOnboarding ? undefined : () => setShowOnboarding(false)}
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
