import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpFromLine, Building2, Clock, Plus, CheckCircle2, Wallet, Loader2, UserPlus, Send, ArrowRightLeft, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { AccountBalancesCard } from '@/components/shared/AccountBalancesCard';
import { InstitutionOnboardingWizard } from '@/components/shared/InstitutionOnboardingWizard';
import { CreateAccountForm } from '@/components/shared/CreateAccountForm';
import { FiatDepositFlow } from '@/components/shared/FiatDepositFlow';
import { ManualConversionForm } from '@/components/shared/ManualConversionForm';
import { DestinationAddressList } from '@/components/shared/DestinationAddressList';
import { CreateDestinationAddressForm } from '@/components/shared/CreateDestinationAddressForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { useDepositInstructions } from '@/hooks/useFiat';
import { useCryptoDestinationAddresses, useCreateCryptoDestinationAddress } from '@/hooks/useCrypto';
import { useTransactions } from '@/hooks/useTransactions';
import { useConvertAssets } from '@/hooks/useAssets';
import { CreateIdentityRequest, CreateAccountRequest, PaxosIdentity, PaxosAccount, Transaction, ConvertAssetRequest, CreateCryptoDestinationAddressRequest } from '@/api/types';
import { getModuleIdentityConfig, saveModuleIdentityConfig } from '@/pages/config/ConfigPage';
import { toast } from 'sonner';

const PayoutsDashboard: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showCreateDestination, setShowCreateDestination] = useState(false);
  const [showFiatDeposit, setShowFiatDeposit] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'PAY_OUTS' });
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities({ module: 'PAY_OUTS' });
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const { data: instructionsResponse, isLoading: loadingInstructions } = useDepositInstructions(
    selectedAccountId ? { account_id: selectedAccountId } : undefined
  );
  const { data: destinationsResponse, isLoading: loadingDestinations } = useCryptoDestinationAddresses(
    selectedAccountId ? { account_id: selectedAccountId } : undefined
  );
  const { transactions: allTransactions, isLoading: loadingTransactions } = useTransactions({ 
    limit: 10,
    account_id: selectedAccountId || undefined,
    sort: 'created_at',
    order: 'DESC'
  });
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();
  const convertAssets = useConvertAssets();
  const createDestinationAddress = useCreateCryptoDestinationAddress();

  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  const depositInstructions = instructionsResponse?.data || [];
  const destinations = destinationsResponse?.data || [];
  
  // Filter relevant transactions
  const payouts = allTransactions.filter(
    (tx: Transaction) => tx.transaction_type === 'CRYPTO_WITHDRAWAL'
  );
  const conversions = allTransactions.filter(
    (tx: Transaction) => tx.transaction_type === 'CONVERSION'
  );

  const selectedAccount = accounts.find((a: PaxosAccount) => a.id === selectedAccountId);

  // Get module config and check for institution identity
  // IMPORTANT: Only use identities created within this module (PAY_OUTS)
  const moduleConfig = getModuleIdentityConfig();
  
  // If requireOnboarding is true, always show onboarding regardless of existing identities
  const forceNewOnboarding = moduleConfig.requireOnboarding;
  
  // Find the configured identity for this module (must be from PAY_OUTS module identities)
  const configuredIdentity = moduleConfig.payoutsIdentityId 
    ? identities.find((i: PaxosIdentity) => i.identity_id === moduleConfig.payoutsIdentityId)
    : null;
  
  // Only use identities that were created in this module - don't fall back to other modules
  const institutionIdentity = forceNewOnboarding ? null : (
    configuredIdentity || identities.find((i: PaxosIdentity) => i.identity_type?.toUpperCase() === 'INSTITUTION')
  );
  
  // Show onboarding if: forced reset OR no institution identity exists in this module
  const needsOnboarding = !loadingIdentities && (forceNewOnboarding || !institutionIdentity);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleCreateIdentity = async (data: CreateIdentityRequest): Promise<PaxosIdentity | void> => {
    try {
      const result = await createIdentity.mutateAsync(data);
      const createdIdentity = result?.data as PaxosIdentity;
      
      if (data.identity_request.institution_details && createdIdentity?.identity_id) {
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
      throw error;
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

  const handleConvert = async (data: ConvertAssetRequest) => {
    try {
      await convertAssets.mutateAsync(data);
      toast.success('Conversion initiated successfully');
    } catch (error) {
      toast.error('Failed to process conversion');
    }
  };

  const handleCreateDestination = async (data: CreateCryptoDestinationAddressRequest) => {
    try {
      await createDestinationAddress.mutateAsync(data);
      toast.success('Destination wallet registered');
      setShowCreateDestination(false);
    } catch (error) {
      toast.error('Failed to register destination');
    }
  };

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
      {/* Onboarding Banner */}
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
          <h2 className="text-2xl font-bold text-foreground">Payouts Dashboard</h2>
          <p className="text-muted-foreground">On-ramp USD to stablecoin and pay out crypto</p>
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

      {/* Institution Info Bar */}
      {institutionIdentity && (
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-module-payouts/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-module-payouts" />
            </div>
            <div>
              <p className="font-medium text-foreground">{institutionIdentity.name}</p>
              <p className="text-sm text-muted-foreground">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} • {destinations.length} destination{destinations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowFiatDeposit(true)} variant="outline" size="sm" className="border-border">
              <DollarSign className="h-4 w-4 mr-2" />
              Fund Account
            </Button>
            <Link to="/app/payouts/send">
              <Button size="sm" className="bg-module-payouts hover:bg-module-payouts/90">
                <Send className="h-4 w-4 mr-2" />
                Send Crypto
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-secondary/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-module-payouts data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="fiat-deposits" className="data-[state=active]:bg-module-payouts data-[state=active]:text-white">
            Fiat Deposits
          </TabsTrigger>
          <TabsTrigger value="conversions" className="data-[state=active]:bg-module-payouts data-[state=active]:text-white">
            Conversions
          </TabsTrigger>
          <TabsTrigger value="destinations" className="data-[state=active]:bg-module-payouts data-[state=active]:text-white">
            Destinations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Sent"
                  value={loadingTransactions ? '...' : `$${payouts.reduce((sum: number, tx: Transaction) => sum + parseFloat(tx.amount || '0'), 0).toLocaleString()}`}
                  change={`${payouts.filter((tx: Transaction) => tx.status === 'COMPLETED').length} completed`}
                  changeType="positive"
                  icon={Send}
                />
                <StatCard
                  title="Pending"
                  value={loadingTransactions ? '...' : payouts.filter((tx: Transaction) => tx.status === 'PENDING').length.toString()}
                  change="awaiting"
                  changeType="neutral"
                  icon={Clock}
                />
                <StatCard
                  title="Conversions"
                  value={loadingTransactions ? '...' : conversions.length.toString()}
                  change="USD to stablecoin"
                  changeType="positive"
                  icon={ArrowRightLeft}
                />
                <StatCard
                  title="Destinations"
                  value={loadingDestinations ? '...' : destinations.length.toString()}
                  change="wallets registered"
                  changeType="neutral"
                  icon={Wallet}
                />
              </div>

              {/* Recent Activity */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-foreground">Recent Activity</h3>
                </div>
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : allTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Fund your account and send crypto</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allTransactions.slice(0, 5).map((tx: Transaction) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            tx.transaction_type === 'CRYPTO_WITHDRAWAL' ? 'bg-warning/20' : 'bg-primary/20'
                          }`}>
                            {tx.transaction_type === 'CRYPTO_WITHDRAWAL' ? (
                              <Send className="h-5 w-5 text-warning" />
                            ) : (
                              <ArrowRightLeft className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{tx.amount} {tx.source_asset}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <TransactionStatusBadge status={tx.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Balances */}
            <div className="space-y-6">
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Account Balances</h3>
                {accounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No accounts yet</p>
                  </div>
                ) : (
                  <AccountBalancesCard balances={balances} isLoading={loadingBalances} />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Fiat Deposits Tab */}
        <TabsContent value="fiat-deposits" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Generate Deposit Instructions</h3>
              {selectedAccount ? (
                <FiatDepositFlow 
                  accountId={selectedAccount.id} 
                  paxosAccountId={selectedAccount.paxos_account_id}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Select an account first</p>
                </div>
              )}
            </div>
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Active Deposit Instructions</h3>
              {loadingInstructions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : depositInstructions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No deposit instructions created yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {depositInstructions.map((inst: any) => (
                    <div key={inst.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{inst.network}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">{inst.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{inst.deposit_instructions_id?.slice(0, 20)}...</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Conversions Tab */}
        <TabsContent value="conversions" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Convert Assets</h3>
              <p className="text-sm text-muted-foreground mb-4">Convert USD to stablecoins before sending</p>
              {selectedAccountId && balances.length > 0 ? (
                <ManualConversionForm
                  balances={balances}
                  selectedAccountId={selectedAccountId}
                  onSubmit={handleConvert}
                  isLoading={convertAssets.isPending}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{!selectedAccountId ? 'Select an account first' : 'No balances available'}</p>
                </div>
              )}
            </div>
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Recent Conversions</h3>
              {conversions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversions.slice(0, 5).map((tx: Transaction) => (
                    <div key={tx.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{tx.amount} {tx.source_asset} → {tx.destination_asset}</span>
                        <TransactionStatusBadge status={tx.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Destinations Tab */}
        <TabsContent value="destinations" className="mt-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Destination Wallets</h3>
                <p className="text-sm text-muted-foreground">External crypto wallets for payouts</p>
              </div>
              <Button onClick={() => setShowCreateDestination(true)} className="bg-module-payouts hover:bg-module-payouts/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Destination
              </Button>
            </div>
            <DestinationAddressList
              addresses={destinations}
              isLoading={loadingDestinations}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
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

      <Dialog open={showCreateDestination} onOpenChange={setShowCreateDestination}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Register Destination Wallet</DialogTitle>
          </DialogHeader>
          <CreateDestinationAddressForm
            accounts={accounts}
            onSubmit={handleCreateDestination}
            isLoading={createDestinationAddress.isPending}
            onCancel={() => setShowCreateDestination(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showFiatDeposit} onOpenChange={setShowFiatDeposit}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>Fund Account</DialogTitle>
          </DialogHeader>
          {selectedAccount ? (
            <FiatDepositFlow 
              accountId={selectedAccount.id} 
              paxosAccountId={selectedAccount.paxos_account_id}
              onSuccess={() => setShowFiatDeposit(false)}
            />
          ) : (
            <p className="text-muted-foreground">Select an account first</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutsDashboard;