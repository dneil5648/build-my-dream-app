import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowDownToLine, Clock, CheckCircle2, AlertCircle, Loader2, Users, Wallet } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { AccountsTable } from '@/components/shared/AccountsTable';
import { IdentitiesTable } from '@/components/shared/IdentitiesTable';
import { OnboardingWizard } from '@/components/shared/OnboardingWizard';
import { CreateAccountForm } from '@/components/shared/CreateAccountForm';
import { AccountBalancesCard } from '@/components/shared/AccountBalancesCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDepositInstructions } from '@/hooks/useFiat';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { FiatDepositInstructions, Transaction, CreateIdentityRequest, CreateAccountRequest } from '@/api/types';
import { toast } from 'sonner';

const PayInsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const { data: instructionsResponse, isLoading: loadingInstructions } = useDepositInstructions();
  const { data: transactionsResponse, isLoading: loadingTransactions } = useTransactions({ limit: 5 });
  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities();
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId);
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();

  const instructions = instructionsResponse?.data || [];
  const transactions = (transactionsResponse?.data || []).filter(
    (tx: Transaction) => tx.type === 'deposit'
  );
  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = balancesResponse?.data || [];

  // Auto-select first account
  React.useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].paxos_account_id);
    }
  }, [accounts, selectedAccountId]);

  // Calculate stats from real data
  const completedDeposits = transactions.filter((t: Transaction) => t.status === 'completed');
  const pendingDeposits = transactions.filter((t: Transaction) => t.status === 'pending');

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pay-ins Dashboard</h2>
          <p className="text-muted-foreground">Manage fiat deposits and deposit instructions</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/pay-ins/sandbox">
            <Button variant="outline" className="border-border">
              Sandbox Deposit
            </Button>
          </Link>
          <Link to="/app/pay-ins/create">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Instructions
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="accounts">
            <Wallet className="h-4 w-4 mr-2" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="identities">
            <Users className="h-4 w-4 mr-2" />
            Identities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Deposits"
              value={loadingTransactions ? '...' : `$${completedDeposits.reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount || '0'), 0).toLocaleString()}`}
              change={`${completedDeposits.length} completed`}
              changeType="positive"
              icon={ArrowDownToLine}
            />
            <StatCard
              title="Pending Deposits"
              value={loadingTransactions ? '...' : pendingDeposits.length.toString()}
              change={`${pendingDeposits.length} pending transactions`}
              changeType="neutral"
              icon={Clock}
            />
            <StatCard
              title="Completed Today"
              value={loadingTransactions ? '...' : completedDeposits.length.toString()}
              change={`${completedDeposits.length} transactions`}
              changeType="positive"
              icon={CheckCircle2}
            />
            <StatCard
              title="Active Instructions"
              value={loadingInstructions ? '...' : instructions.length.toString()}
              change="All networks active"
              changeType="neutral"
              icon={AlertCircle}
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Active Deposit Instructions */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Active Deposit Instructions</h3>
                <Link to="/app/pay-ins/create" className="text-sm text-primary hover:underline">
                  Create New
                </Link>
              </div>
              
              {loadingInstructions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : instructions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No deposit instructions found.</p>
                  <Link to="/app/pay-ins/create" className="text-primary hover:underline">
                    Create your first instruction
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {instructions.map((instruction: FiatDepositInstructions) => (
                    <div 
                      key={instruction.id}
                      className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ArrowDownToLine className="h-5 w-5 text-primary" />
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
                <Link to="/app/pay-ins/history" className="text-sm text-primary hover:underline">
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
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
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
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Account List */}
            <div className="lg:col-span-2 glass rounded-xl p-6">
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

            {/* Account Balances */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Account Balances</h3>
              </div>
              
              {accounts.length > 0 && (
                <div className="mb-4">
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.paxos_account_id}>
                          {account.paxos_account_id.slice(0, 12)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <AccountBalancesCard balances={balances} isLoading={loadingBalances} />
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

export default PayInsDashboard;
