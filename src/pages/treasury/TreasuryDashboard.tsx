import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Building2, PieChart, TrendingUp, Wallet, Plus, Users, Loader2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AccountsTable } from '@/components/shared/AccountsTable';
import { IdentitiesTable } from '@/components/shared/IdentitiesTable';
import { OnboardingWizard } from '@/components/shared/OnboardingWizard';
import { CreateAccountForm } from '@/components/shared/CreateAccountForm';
import { useAccounts, useCreateAccount } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { CreateIdentityRequest, CreateAccountRequest } from '@/api/types';
import { toast } from 'sonner';

const TreasuryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities();
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();

  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Treasury Dashboard</h2>
          <p className="text-muted-foreground">Manage assets, conversions, and internal transfers</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/treasury/deposit">
            <Button variant="outline" className="border-border">
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Deposit
            </Button>
          </Link>
          <Link to="/app/treasury/withdraw">
            <Button variant="outline" className="border-border">
              <ArrowUpFromLine className="h-4 w-4 mr-2" />
              Payout
            </Button>
          </Link>
          <Link to="/app/treasury/transfer">
            <Button variant="outline" className="border-border">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer
            </Button>
          </Link>
          <Link to="/app/treasury/convert">
            <Button className="bg-primary hover:bg-primary/90">
              Convert Assets
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="identities">
            <Users className="h-4 w-4 mr-2" />
            Identities
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <Wallet className="h-4 w-4 mr-2" />
            Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Identities"
              value={loadingIdentities ? '...' : identities.length.toString()}
              change={identities.filter(i => i.status === 'approved').length + ' approved'}
              changeType="positive"
              icon={Users}
            />
            <StatCard
              title="Total Accounts"
              value={loadingAccounts ? '...' : accounts.length.toString()}
              change={(accounts.filter(a => a.status === 'active').length || accounts.length) + ' active'}
              changeType="neutral"
              icon={Wallet}
            />
            <StatCard
              title="Institutions"
              value={loadingIdentities ? '...' : identities.filter(i => i.identity_type === 'INSTITUTION').length.toString()}
              change="Multi-party entities"
              changeType="neutral"
              icon={Building2}
            />
            <StatCard
              title="Individuals"
              value={loadingIdentities ? '...' : identities.filter(i => i.identity_type === 'INDIVIDUAL').length.toString()}
              change="Single-party entities"
              changeType="neutral"
              icon={Users}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Accounts Overview */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-6">Accounts Overview</h3>
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No accounts yet</p>
                  <p className="text-sm">Create an account to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.slice(0, 5).map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {account.paxos_account_id.slice(0, 12)}...
                          </p>
                          <p className="text-xs text-muted-foreground">{account.status || 'active'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {accounts.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{accounts.length - 5} more accounts
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Quick Overview</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-foreground">Total Identities</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {loadingIdentities ? <Loader2 className="h-4 w-4 animate-spin" /> : identities.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="text-foreground">Total Accounts</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {loadingAccounts ? <Loader2 className="h-4 w-4 animate-spin" /> : accounts.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-6">Recent Treasury Activity</h3>
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Conversions and transfers will appear here</p>
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
                <p className="text-sm text-muted-foreground">Manage Paxos accounts and balances</p>
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

export default TreasuryDashboard;
