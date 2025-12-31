import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRightLeft, Building2, PieChart, TrendingUp, Wallet, Plus, Users, Loader2, 
  ArrowDownToLine, ArrowUpFromLine, Send, AlertTriangle, RefreshCw, DollarSign,
  Layers, Clock, CheckCircle2, XCircle, ExternalLink, Landmark, Globe, Coins
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { AccountBalancesCard } from '@/components/shared/AccountBalancesCard';
import { IdentitiesTable } from '@/components/shared/IdentitiesTable';
import { AccountsTable } from '@/components/shared/AccountsTable';
import { InstitutionOnboardingWizard } from '@/components/shared/InstitutionOnboardingWizard';
import { CreateAccountForm } from '@/components/shared/CreateAccountForm';
import { CryptoAddressList } from '@/components/shared/CryptoAddressList';
import { DestinationAddressList } from '@/components/shared/DestinationAddressList';
import { CreateDestinationAddressForm } from '@/components/shared/CreateDestinationAddressForm';
import { FiatDepositFlow } from '@/components/shared/FiatDepositFlow';
import { FiatAccountsList } from '@/components/shared/FiatAccountsList';
import { CreateFiatAccountForm } from '@/components/shared/CreateFiatAccountForm';
import { ManualWithdrawalForm } from '@/components/shared/ManualWithdrawalForm';
import { ManualConversionForm } from '@/components/shared/ManualConversionForm';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { DepositAddressDetailModal } from '@/components/shared/DepositAddressDetailModal';
import { FiatDepositInstructionDetailModal } from '@/components/shared/FiatDepositInstructionDetailModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { useCryptoAddresses, useCryptoDestinationAddresses, useCreateCryptoDestinationAddress, useCreateCryptoAddress } from '@/hooks/useCrypto';
import { cryptoService } from '@/api';
import { useFiatAccounts, useRegisterFiatAccount, useDepositInstructions } from '@/hooks/useFiat';
import { useTransactions } from '@/hooks/useTransactions';
import { useWithdrawAssets, useConvertAssets } from '@/hooks/useAssets';
import { 
  CreateIdentityRequest, CreateAccountRequest, PaxosIdentity, PaxosAccount, Transaction,
  CryptoAddress, CreateCryptoDestinationAddressRequest, RegisterFiatAccountRequest,
  FiatDepositInstructions, WithdrawAssetRequest, ConvertAssetRequest, CreateCryptoAddressRequest, CryptoNetwork
} from '@/api/types';
import { getModuleIdentityConfig, saveModuleIdentityConfig } from '@/pages/config/ConfigPage';
import { toast } from 'sonner';

// Helper to aggregate balances across all accounts
interface AggregatedBalance {
  asset: string;
  total: number;
  available: number;
  trading: number;
  accounts: number;
}

const TreasuryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showCreateDestination, setShowCreateDestination] = useState(false);
  const [showCreateFiatAccount, setShowCreateFiatAccount] = useState(false);
  const [showFiatDeposit, setShowFiatDeposit] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<CryptoAddress | null>(null);
  const [selectedInstruction, setSelectedInstruction] = useState<FiatDepositInstructions | null>(null);

  // Data fetching
  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'TREASURY' });
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities({ module: 'TREASURY' });
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const { data: cryptoAddressesResponse, isLoading: loadingAddresses } = useCryptoAddresses(
    selectedAccountId ? { account_id: selectedAccountId } : undefined
  );
  const { data: destinationsResponse, isLoading: loadingDestinations } = useCryptoDestinationAddresses();
  const { data: fiatAccountsResponse, isLoading: loadingFiatAccounts } = useFiatAccounts();
  const { data: instructionsResponse, isLoading: loadingInstructions } = useDepositInstructions(
    selectedAccountId ? { account_id: selectedAccountId } : undefined
  );
  const { transactions, isLoading: loadingTransactions } = useTransactions({
    limit: 20,
    account_id: selectedAccountId || undefined,
    sort: 'created_at',
    order: 'DESC'
  });

  // Mutations
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();
  const createDestinationAddress = useCreateCryptoDestinationAddress();
  const registerFiatAccount = useRegisterFiatAccount();
  const withdrawAssets = useWithdrawAssets();
  const convertAssets = useConvertAssets();

  // Derived data
  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  const cryptoAddresses = cryptoAddressesResponse?.data || [];
  const destinations = destinationsResponse?.data || [];
  const fiatAccounts = fiatAccountsResponse?.data || [];
  const depositInstructions = instructionsResponse?.data || [];
  
  const selectedAccount = accounts.find((a: PaxosAccount) => a.id === selectedAccountId);

  // Module config - institutions only (reuse payouts config for treasury since it's also institutional)
  const moduleConfig = getModuleIdentityConfig();
  const forceNewOnboarding = moduleConfig.payoutsRequireNew;
  const configuredIdentity = moduleConfig.payoutsIdentityId
    ? identities.find((i: PaxosIdentity) => i.identity_id === moduleConfig.payoutsIdentityId)
    : null;
  
  // Only allow institutional identities
  const institutionIdentities = identities.filter((i: PaxosIdentity) => i.identity_type?.toUpperCase() === 'INSTITUTION');
  const institutionIdentity = forceNewOnboarding ? null : (
    configuredIdentity || institutionIdentities[0]
  );
  const needsOnboarding = !loadingIdentities && (forceNewOnboarding || !institutionIdentity);

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Aggregate balances across all accounts for dashboard analytics
  const aggregatedBalances = useMemo(() => {
    const balanceMap: Record<string, AggregatedBalance> = {};
    
    balances.forEach((b: { asset: string; available: string; trading?: string }) => {
      const existing = balanceMap[b.asset] || { asset: b.asset, total: 0, available: 0, trading: 0, accounts: 0 };
      const available = parseFloat(b.available || '0');
      const trading = parseFloat(b.trading || '0');
      existing.available += available;
      existing.trading += trading;
      existing.total += available + trading;
      existing.accounts += 1;
      balanceMap[b.asset] = existing;
    });
    
    return Object.values(balanceMap).sort((a, b) => b.total - a.total);
  }, [balances]);

  // Calculate net position
  const totalBalance = aggregatedBalances.reduce((sum, b) => sum + b.total, 0);
  const availableBalance = aggregatedBalances.reduce((sum, b) => sum + b.available, 0);
  const tradingBalance = aggregatedBalances.reduce((sum, b) => sum + b.trading, 0);

  // Stablecoin vs non-stablecoin breakdown
  const stablecoins = ['USD', 'USDC', 'USDT', 'USDP', 'PYUSD', 'USDG', 'DAI', 'BUSD'];
  const stablecoinBalance = aggregatedBalances
    .filter(b => stablecoins.includes(b.asset))
    .reduce((sum, b) => sum + b.total, 0);
  const cryptoBalance = totalBalance - stablecoinBalance;

  // Derive alerts from transaction data
  const alerts = useMemo(() => {
    const alertList: { type: 'error' | 'warning' | 'info'; message: string; time: string }[] = [];
    
    const failedTx = transactions.filter((tx: Transaction) => tx.status === 'FAILED');
    failedTx.forEach((tx: Transaction) => {
      alertList.push({
        type: 'error',
        message: `Failed ${tx.transaction_type?.toLowerCase().replace('_', ' ')}: ${tx.amount} ${tx.source_asset}`,
        time: new Date(tx.created_at).toLocaleDateString()
      });
    });

    const pendingTx = transactions.filter((tx: Transaction) => tx.status === 'PENDING' || tx.status === 'PROCESSING');
    if (pendingTx.length > 3) {
      alertList.push({
        type: 'warning',
        message: `${pendingTx.length} transactions pending approval`,
        time: 'Now'
      });
    }

    // Low balance alert
    if (availableBalance < 1000 && availableBalance > 0) {
      alertList.push({
        type: 'warning',
        message: 'Low available balance across accounts',
        time: 'Now'
      });
    }

    return alertList.slice(0, 5);
  }, [transactions, availableBalance]);

  // Handlers
  const handleCreateIdentity = async (data: CreateIdentityRequest): Promise<PaxosIdentity | void> => {
    try {
      const result = await createIdentity.mutateAsync(data);
      const createdIdentity = result?.data as PaxosIdentity;
      
      if (data.identity_request.institution_details && createdIdentity?.identity_id) {
        const currentConfig = getModuleIdentityConfig();
        saveModuleIdentityConfig({
          ...currentConfig,
          payoutsIdentityId: createdIdentity.identity_id,
          payoutsRequireNew: false,
        });
        toast.success('Institution registered successfully');
        setShowOnboarding(false);
      }
      return createdIdentity;
    } catch (error) {
      toast.error('Failed to register institution');
      throw error;
    }
  };

  const handleCreateAccount = async (data: CreateAccountRequest & { depositConfig?: { network: CryptoNetwork; asset: string } }) => {
    try {
      const { depositConfig, ...accountData } = data;
      
      // Step 1: Create the account
      const accountResult = await createAccount.mutateAsync(accountData);
      const createdAccount = accountResult?.data as PaxosAccount;
      
      if (!createdAccount?.id) {
        throw new Error('Account created but no ID returned');
      }
      
      toast.success('Account created successfully');
      
      // Step 2: Create a deposit address with no conversion using selected network/asset
      const selectedNetwork = depositConfig?.network || 'ETHEREUM';
      const selectedAsset = depositConfig?.asset || 'USDC';
      
      const depositAddressPayload: CreateCryptoAddressRequest = {
        account_id: createdAccount.id,
        network: selectedNetwork,
        source_asset: selectedAsset,
        destination_asset: selectedAsset, // Same asset = no conversion
      };
      
      const depositAddressResult = await cryptoService.createCryptoAddress(depositAddressPayload);
      const createdDepositAddress = depositAddressResult?.data as CryptoAddress;
      
      if (!createdDepositAddress?.wallet_address) {
        toast.warning('Account created but deposit address generation failed');
        setShowCreateAccount(false);
        return;
      }
      
      toast.success(`${selectedAsset} deposit address on ${selectedNetwork} generated`);
      
      // Step 3: Create a destination crypto address from the deposit address
      const destinationPayload: CreateCryptoDestinationAddressRequest = {
        account_id: createdAccount.id,
        crypto_network: selectedNetwork,
        address: createdDepositAddress.wallet_address,
        nickname: `${accountData.nickname || 'Treasury Account'} - ${selectedAsset} (${selectedNetwork})`,
        bookmarked_status: true,
      };
      
      await createDestinationAddress.mutateAsync(destinationPayload);
      toast.success('Destination address registered');
      
      setShowCreateAccount(false);
    } catch (error) {
      console.error('Account creation flow error:', error);
      toast.error('Failed to complete account setup');
    }
  };

  const handleCreateDestination = async (data: CreateCryptoDestinationAddressRequest) => {
    try {
      await createDestinationAddress.mutateAsync(data);
      toast.success('Destination registered');
      setShowCreateDestination(false);
    } catch (error) {
      toast.error('Failed to register destination');
    }
  };

  const handleRegisterFiatAccount = async (data: RegisterFiatAccountRequest) => {
    try {
      await registerFiatAccount.mutateAsync(data);
      toast.success('Fiat account registered');
      setShowCreateFiatAccount(false);
    } catch (error) {
      toast.error('Failed to register fiat account');
    }
  };

  const handleWithdraw = async (data: WithdrawAssetRequest) => {
    try {
      await withdrawAssets.mutateAsync(data);
      toast.success('Withdrawal initiated');
    } catch (error) {
      toast.error('Failed to process withdrawal');
    }
  };

  const handleConvert = async (data: ConvertAssetRequest) => {
    try {
      await convertAssets.mutateAsync(data);
      toast.success('Conversion initiated');
    } catch (error) {
      toast.error('Failed to process conversion');
    }
  };

  if (loadingIdentities) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-module-treasury mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Treasury...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Banner */}
      {needsOnboarding && (
        <div className="rounded-xl bg-gradient-to-r from-module-treasury/10 via-module-treasury/5 to-transparent border border-module-treasury/30 p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-module-treasury/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-module-treasury" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Complete Institution Registration</h3>
              <p className="text-sm text-muted-foreground">Register your institution to manage treasury accounts</p>
            </div>
          </div>
          <Button onClick={() => setShowOnboarding(true)} className="bg-module-treasury hover:bg-module-treasury/90">
            <Building2 className="h-4 w-4 mr-2" />
            Register Institution
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Treasury Management</h2>
          <p className="text-muted-foreground">Enterprise-grade asset management and operations</p>
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
        </div>
      </div>

      {/* Institution Info Bar */}
      {institutionIdentity && (
        <div className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-module-treasury/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-module-treasury" />
            </div>
            <div>
              <p className="font-medium text-foreground">{institutionIdentity.name}</p>
              <p className="text-sm text-muted-foreground">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} • {destinations.length} destination{destinations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowFiatDeposit(true)} variant="outline" size="sm" className="border-border">
              <DollarSign className="h-4 w-4 mr-2" />
              On-Ramp
            </Button>
            <Link to="/app/treasury/payments">
              <Button variant="outline" size="sm" className="border-border">
                <Send className="h-4 w-4 mr-2" />
                Payments
              </Button>
            </Link>
            <Link to="/app/treasury/transfers">
              <Button variant="outline" size="sm" className="border-border">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfers
              </Button>
            </Link>
            <Link to="/app/treasury/convert">
              <Button size="sm" className="bg-module-treasury hover:bg-module-treasury/90">
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-secondary/50 p-1 flex-wrap h-auto">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-module-treasury data-[state=active]:text-white">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="identities" className="data-[state=active]:bg-module-treasury data-[state=active]:text-white">
            <Building2 className="h-4 w-4 mr-2" />
            Identities
          </TabsTrigger>
          <TabsTrigger value="accounts" className="data-[state=active]:bg-module-treasury data-[state=active]:text-white">
            <Wallet className="h-4 w-4 mr-2" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="on-ramp" className="data-[state=active]:bg-module-treasury data-[state=active]:text-white">
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            On-Ramp
          </TabsTrigger>
          <TabsTrigger value="off-ramp" className="data-[state=active]:bg-module-treasury data-[state=active]:text-white">
            <ArrowUpFromLine className="h-4 w-4 mr-2" />
            Off-Ramp
          </TabsTrigger>
          <TabsTrigger value="destinations" className="data-[state=active]:bg-module-treasury data-[state=active]:text-white">
            <Globe className="h-4 w-4 mr-2" />
            Destinations
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {/* Top Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Net Position"
              value={loadingBalances ? '...' : `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
              changeType="positive"
              icon={TrendingUp}
            />
            <StatCard
              title="Available Liquidity"
              value={loadingBalances ? '...' : `$${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change="instantly usable"
              changeType="positive"
              icon={Coins}
            />
            <StatCard
              title="In Trading"
              value={loadingBalances ? '...' : `$${tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change="locked"
              changeType="neutral"
              icon={Clock}
            />
            <StatCard
              title="Pending Ops"
              value={loadingTransactions ? '...' : transactions.filter((t: Transaction) => t.status === 'PENDING' || t.status === 'PROCESSING').length.toString()}
              change="awaiting"
              changeType="neutral"
              icon={RefreshCw}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Position Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              {/* Exposure Tiles */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Stablecoin vs Crypto */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Asset Exposure</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-module-treasury" />
                        <span className="text-sm text-foreground">Stablecoins</span>
                      </div>
                      <span className="font-medium text-foreground">${stablecoinBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <Progress value={totalBalance > 0 ? (stablecoinBalance / totalBalance) * 100 : 0} className="h-2" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-crypto-btc" />
                        <span className="text-sm text-foreground">Crypto Assets</span>
                      </div>
                      <span className="font-medium text-foreground">${cryptoBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <Progress value={totalBalance > 0 ? (cryptoBalance / totalBalance) * 100 : 0} className="h-2 [&>div]:bg-crypto-btc" />
                  </CardContent>
                </Card>

                {/* Issuer Exposure */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Issuer Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aggregatedBalances.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No positions</p>
                    ) : (
                      <div className="space-y-2">
                        {aggregatedBalances.slice(0, 4).map((b) => (
                          <div key={b.asset} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AssetIcon asset={b.asset} size="sm" />
                              <span className="text-sm font-medium text-foreground">{b.asset}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{b.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                        {aggregatedBalances.length > 4 && (
                          <p className="text-xs text-muted-foreground text-center">+{aggregatedBalances.length - 4} more</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Common treasury operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                    <Link to="/app/treasury/payments">
                      <Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:border-module-treasury hover:bg-module-treasury/5">
                        <Send className="h-5 w-5 text-module-treasury" />
                        <span className="text-sm">Send</span>
                      </Button>
                    </Link>
                    <Link to="/app/treasury/convert">
                      <Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:border-module-treasury hover:bg-module-treasury/5">
                        <RefreshCw className="h-5 w-5 text-module-treasury" />
                        <span className="text-sm">Convert</span>
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full h-20 flex-col gap-2 border-border hover:border-module-treasury hover:bg-module-treasury/5"
                      onClick={() => setShowFiatDeposit(true)}
                    >
                      <DollarSign className="h-5 w-5 text-module-treasury" />
                      <span className="text-sm">Mint</span>
                    </Button>
                    <Link to="/app/treasury/off-ramp">
                      <Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:border-module-treasury hover:bg-module-treasury/5">
                        <ArrowUpFromLine className="h-5 w-5 text-module-treasury" />
                        <span className="text-sm">Redeem</span>
                      </Button>
                    </Link>
                    <Link to="/app/treasury/transfers">
                      <Button variant="outline" className="w-full h-20 flex-col gap-2 border-border hover:border-module-treasury hover:bg-module-treasury/5">
                        <Layers className="h-5 w-5 text-module-treasury" />
                        <span className="text-sm">Sweep</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-module-treasury" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((tx: Transaction) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                              tx.transaction_type === 'CRYPTO_WITHDRAWAL' ? 'bg-warning/20' :
                              tx.transaction_type === 'CONVERSION' ? 'bg-primary/20' :
                              'bg-module-treasury/20'
                            }`}>
                              {tx.transaction_type === 'CRYPTO_WITHDRAWAL' ? (
                                <ArrowUpFromLine className="h-4 w-4 text-warning" />
                              ) : tx.transaction_type === 'CONVERSION' ? (
                                <RefreshCw className="h-4 w-4 text-primary" />
                              ) : (
                                <ArrowDownToLine className="h-4 w-4 text-module-treasury" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {tx.amount} {tx.source_asset}
                                {tx.destination_asset && tx.destination_asset !== tx.source_asset && ` → ${tx.destination_asset}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tx.transaction_type?.toLowerCase().replace('_', ' ')} • {new Date(tx.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <TransactionStatusBadge status={tx.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Account Balances */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Account Balances</CardTitle>
                </CardHeader>
                <CardContent>
                  {accounts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No accounts yet</p>
                    </div>
                  ) : (
                    <AccountBalancesCard balances={balances} isLoading={loadingBalances} />
                  )}
                </CardContent>
              </Card>

              {/* Alerts Feed */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success opacity-50" />
                      <p className="text-sm">All clear</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {alerts.map((alert, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border text-sm ${
                            alert.type === 'error' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                            alert.type === 'warning' ? 'bg-warning/10 border-warning/30 text-warning' :
                            'bg-primary/10 border-primary/30 text-primary'
                          }`}
                        >
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-xs opacity-70">{alert.time}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Identities Tab */}
        <TabsContent value="identities" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Institutional Identities</CardTitle>
                <CardDescription>Manage registered institutions</CardDescription>
              </div>
              <Button onClick={() => setShowOnboarding(true)} className="bg-module-treasury hover:bg-module-treasury/90">
                <Plus className="h-4 w-4 mr-2" />
                Register Institution
              </Button>
            </CardHeader>
            <CardContent>
              <IdentitiesTable 
                identities={institutionIdentities} 
                isLoading={loadingIdentities} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Treasury Accounts</CardTitle>
                <CardDescription>Manage institutional accounts</CardDescription>
              </div>
              <Button 
                onClick={() => setShowCreateAccount(true)} 
                className="bg-module-treasury hover:bg-module-treasury/90"
                disabled={!institutionIdentity}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </CardHeader>
            <CardContent>
              <AccountsTable accounts={accounts} isLoading={loadingAccounts} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* On-Ramp Tab */}
        <TabsContent value="on-ramp" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Fund Account</CardTitle>
                <CardDescription>Generate fiat deposit instructions</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAccount ? (
                  <FiatDepositFlow 
                    accountId={selectedAccount.id}
                    paxosAccountId={selectedAccount.paxos_account_id}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select an account first</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Active Deposit Instructions</CardTitle>
                <CardDescription>View existing funding instructions</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInstructions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-module-treasury" />
                  </div>
                ) : depositInstructions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No deposit instructions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {depositInstructions.map((inst: FiatDepositInstructions) => (
                      <div 
                        key={inst.id}
                        onClick={() => setSelectedInstruction(inst)}
                        className="p-3 rounded-lg bg-secondary/50 border border-border hover:border-module-treasury/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-module-treasury" />
                            <span className="font-medium text-foreground text-sm">
                              {inst.deposit_instructions_id?.slice(0, 12)}...
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {inst.instruction_type || 'DEPOSIT'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {inst.network} • Click for details
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Off-Ramp Tab */}
        <TabsContent value="off-ramp" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Withdraw to Fiat</CardTitle>
                <CardDescription>Off-ramp stablecoins to USD</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAccount ? (
                  <ManualWithdrawalForm
                    accounts={accounts}
                    destinationAddresses={destinations}
                    fiatAccounts={fiatAccounts}
                    balances={balances}
                    selectedAccountId={selectedAccount.id}
                    onSubmit={handleWithdraw}
                    isLoading={withdrawAssets.isPending}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select an account first</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Registered Fiat Accounts</CardTitle>
                  <CardDescription>USD destination accounts</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowCreateFiatAccount(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </CardHeader>
              <CardContent>
                <FiatAccountsList 
                  accounts={fiatAccounts} 
                  isLoading={loadingFiatAccounts} 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Destinations Tab */}
        <TabsContent value="destinations" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Crypto Destinations</CardTitle>
                <CardDescription>External wallet addresses for payments</CardDescription>
              </div>
              <Button onClick={() => setShowCreateDestination(true)} className="bg-module-treasury hover:bg-module-treasury/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Destination
              </Button>
            </CardHeader>
            <CardContent>
              <DestinationAddressList 
                addresses={destinations} 
                isLoading={loadingDestinations}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Register Institution</DialogTitle>
          </DialogHeader>
          <InstitutionOnboardingWizard
            onSubmit={handleCreateIdentity}
            isLoading={createIdentity.isPending}
            onCancel={() => setShowOnboarding(false)}
            module="TREASURY"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Treasury Account</DialogTitle>
          </DialogHeader>
          <CreateAccountForm
            identities={institutionIdentities}
            onSubmit={handleCreateAccount}
            isLoading={createAccount.isPending || createDestinationAddress.isPending}
            module="TREASURY"
            showDepositConfig={true}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDestination} onOpenChange={setShowCreateDestination}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Register Destination Wallet</DialogTitle>
          </DialogHeader>
          <CreateDestinationAddressForm
            accounts={accounts}
            onSubmit={handleCreateDestination}
            isLoading={createDestinationAddress.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateFiatAccount} onOpenChange={setShowCreateFiatAccount}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Register Fiat Account</DialogTitle>
          </DialogHeader>
          <CreateFiatAccountForm
            accounts={accounts}
            onSubmit={handleRegisterFiatAccount}
            isLoading={registerFiatAccount.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showFiatDeposit} onOpenChange={setShowFiatDeposit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>On-Ramp: Fund Account</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      {/* Detail Modals */}
      <DepositAddressDetailModal
        address={selectedAddress}
        isOpen={!!selectedAddress}
        onClose={() => setSelectedAddress(null)}
      />

      <FiatDepositInstructionDetailModal
        instruction={selectedInstruction}
        isOpen={!!selectedInstruction}
        onClose={() => setSelectedInstruction(null)}
      />
    </div>
  );
};

export default TreasuryDashboard;
