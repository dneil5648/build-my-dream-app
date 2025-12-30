import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Building2, PieChart, TrendingUp, Wallet, Plus, Users, Loader2 } from 'lucide-react';
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

const mockAssetAllocation = [
  { asset: 'BTC', percentage: 45, value: '$105,432', color: 'bg-crypto-btc' },
  { asset: 'ETH', percentage: 25, value: '$42,891', color: 'bg-crypto-eth' },
  { asset: 'USDC', percentage: 20, value: '$50,000', color: 'bg-crypto-usdc' },
  { asset: 'USD', percentage: 10, value: '$25,000', color: 'bg-success' },
];

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
              title="Total Portfolio"
              value="$223,323"
              change="+8.2% MTD"
              changeType="positive"
              icon={Wallet}
            />
            <StatCard
              title="Crypto Holdings"
              value="$198,323"
              change="88.8% of portfolio"
              changeType="neutral"
              icon={PieChart}
            />
            <StatCard
              title="Fiat Balance"
              value="$25,000"
              change="11.2% of portfolio"
              changeType="neutral"
              icon={Building2}
            />
            <StatCard
              title="24h P&L"
              value="+$4,521"
              change="+2.1% today"
              changeType="positive"
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Asset Allocation */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-6">Asset Allocation</h3>
              <div className="space-y-4">
                {mockAssetAllocation.map((asset) => (
                  <div key={asset.asset} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AssetIcon asset={asset.asset} size="sm" />
                        <span className="font-medium text-foreground">{asset.asset}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-foreground">{asset.value}</span>
                        <span className="text-sm text-muted-foreground ml-2">({asset.percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${asset.color} rounded-full transition-all duration-500`}
                        style={{ width: `${asset.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
