import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowDownToLine, Clock, CheckCircle2, Loader2, Building2, Wallet, UserPlus, Bitcoin, CreditCard, ExternalLink, ArrowUpFromLine, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { AccountBalancesCard } from '@/components/shared/AccountBalancesCard';
import { InstitutionOnboardingWizard } from '@/components/shared/InstitutionOnboardingWizard';
import { CreateAccountForm } from '@/components/shared/CreateAccountForm';
import { CryptoAddressList } from '@/components/shared/CryptoAddressList';
import { AccountsTable } from '@/components/shared/AccountsTable';
import { CreateFiatAccountForm } from '@/components/shared/CreateFiatAccountForm';
import { FiatAccountsList } from '@/components/shared/FiatAccountsList';
import { CreateDestinationAddressForm } from '@/components/shared/CreateDestinationAddressForm';
import { DestinationAddressList } from '@/components/shared/DestinationAddressList';
import { AccountDetailModal } from '@/components/shared/AccountDetailModal';
import { DepositAddressDetailModal } from '@/components/shared/DepositAddressDetailModal';
import { ManualWithdrawalForm } from '@/components/shared/ManualWithdrawalForm';
import { ManualConversionForm } from '@/components/shared/ManualConversionForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { useCryptoAddresses, useCryptoDestinationAddresses, useCreateCryptoDestinationAddress } from '@/hooks/useCrypto';
import { useFiatAccounts, useRegisterFiatAccount } from '@/hooks/useFiat';
import { useWithdrawAssets, useConvertAssets } from '@/hooks/useAssets';
import { 
  Transaction, 
  CreateIdentityRequest, 
  CreateAccountRequest, 
  PaxosIdentity, 
  PaxosAccount,
  CryptoAddress,
  RegisterFiatAccountRequest,
  CreateCryptoDestinationAddressRequest,
  WithdrawAssetRequest,
  ConvertAssetRequest
} from '@/api/types';
import { getModuleIdentityConfig, saveModuleIdentityConfig } from '@/pages/config/ConfigPage';
import { toast } from 'sonner';

const PayInsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showCreateFiatAccount, setShowCreateFiatAccount] = useState(false);
  const [showCreateDestination, setShowCreateDestination] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PaxosAccount | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<CryptoAddress | null>(null);

  // Data fetching - filter for deposit-type transactions
  const { transactions: allTransactions, isLoading: loadingTransactions } = useTransactions({ 
    limit: 10,
    account_id: selectedAccountId || undefined,
    sort: 'created_at',
    order: 'DESC'
  });
  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'PAY_INS' });
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities({ module: 'PAY_INS' });
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const { data: cryptoAddressesResponse, isLoading: loadingCryptoAddresses } = useCryptoAddresses(
    selectedAccountId ? { account_id: selectedAccountId } : undefined
  );
  const { data: fiatAccountsResponse, isLoading: loadingFiatAccounts } = useFiatAccounts();
  const { data: destinationAddressesResponse, isLoading: loadingDestinations } = useCryptoDestinationAddresses();

  // For selected account modal
  const { data: selectedAccountBalancesResponse, isLoading: loadingSelectedBalances } = useAccountBalances(selectedAccount?.id || '');
  const { data: selectedAccountAddressesResponse, isLoading: loadingSelectedAddresses } = useCryptoAddresses(
    selectedAccount ? { account_id: selectedAccount.id } : undefined
  );

  // Mutations
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();
  const registerFiatAccount = useRegisterFiatAccount();
  const createDestinationAddress = useCreateCryptoDestinationAddress();
  const withdrawAssets = useWithdrawAssets();
  const convertAssets = useConvertAssets();

  // Derived data - filter for deposit transactions
  // Filter for deposit transactions
  const deposits = allTransactions.filter(
    (tx: Transaction) => tx.transaction_type === 'CRYPTO_DEPOSIT' || tx.transaction_type === 'WIRE_DEPOSIT' || tx.transaction_type === 'BANK_DEPOSIT'
  );
  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  const allCryptoAddresses = cryptoAddressesResponse?.data || [];
  const fiatAccounts = fiatAccountsResponse?.data || [];
  
  // Filter crypto addresses to match selected account's paxos_account_id
  const selectedAccountData = accounts.find((acc: PaxosAccount) => acc.id === selectedAccountId);
  const cryptoAddresses = selectedAccountData 
    ? allCryptoAddresses.filter((addr: CryptoAddress) => addr.paxos_account_id === selectedAccountData.paxos_account_id)
    : allCryptoAddresses;
  const destinationAddresses = destinationAddressesResponse?.data || [];
  const selectedAccountBalances = Array.isArray(selectedAccountBalancesResponse?.data?.items) 
    ? selectedAccountBalancesResponse.data.items : [];
  const allSelectedAccountAddresses = selectedAccountAddressesResponse?.data || [];
  // Filter addresses to only show those belonging to the selected account (using paxos_account_id)
  const selectedAccountAddresses = selectedAccount 
    ? allSelectedAccountAddresses.filter(addr => addr.paxos_account_id === selectedAccount.paxos_account_id)
    : [];

  // Get module config and check for institution identity
  const moduleConfig = getModuleIdentityConfig();
  const configuredIdentity = moduleConfig.payinsIdentityId 
    ? identities.find((i: PaxosIdentity) => i.identity_id === moduleConfig.payinsIdentityId)
    : null;
  const institutionIdentity = configuredIdentity || identities.find((i: PaxosIdentity) => i.identity_type?.toUpperCase() === 'INSTITUTION');
  const needsOnboarding = !loadingIdentities && !institutionIdentity && (moduleConfig.requireOnboarding || !moduleConfig.payinsIdentityId);

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Calculate stats from real data
  const completedDeposits = deposits.filter((t: Transaction) => t.status === 'COMPLETED');
  const pendingDeposits = deposits.filter((t: Transaction) => t.status === 'PENDING' || t.status === 'PROCESSING');
  const totalDepositAmount = completedDeposits.reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount || '0'), 0);

  const handleCreateIdentity = async (data: CreateIdentityRequest): Promise<PaxosIdentity | void> => {
    try {
      const result = await createIdentity.mutateAsync(data);
      const createdIdentity = result?.data as PaxosIdentity;
      
      if (data.identity_request.institution_details && createdIdentity?.identity_id) {
        const currentConfig = getModuleIdentityConfig();
        saveModuleIdentityConfig({
          ...currentConfig,
          payinsIdentityId: createdIdentity.identity_id,
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

  const handleRegisterFiatAccount = async (data: RegisterFiatAccountRequest) => {
    try {
      await registerFiatAccount.mutateAsync(data);
      toast.success('Fiat account registered successfully');
      setShowCreateFiatAccount(false);
    } catch (error) {
      toast.error('Failed to register fiat account');
    }
  };

  const handleCreateDestinationAddress = async (data: CreateCryptoDestinationAddressRequest) => {
    try {
      await createDestinationAddress.mutateAsync(data);
      toast.success('Destination address registered successfully');
      setShowCreateDestination(false);
    } catch (error) {
      toast.error('Failed to register destination address');
    }
  };

  const handleWithdraw = async (data: WithdrawAssetRequest) => {
    try {
      await withdrawAssets.mutateAsync(data);
      toast.success('Withdrawal initiated successfully');
    } catch (error) {
      toast.error('Failed to process withdrawal');
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

  const handleAccountSelect = (account: PaxosAccount) => {
    setSelectedAccount(account);
  };

  const handleAddressSelect = (address: CryptoAddress) => {
    setSelectedAddress(address);
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
          <p className="text-muted-foreground">Manage deposits, accounts, and addresses</p>
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
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-module-payins/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-module-payins" />
            </div>
            <div>
              <p className="font-medium text-foreground">{institutionIdentity.name}</p>
              <p className="text-sm text-muted-foreground">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} • {cryptoAddresses.length} deposit address{cryptoAddresses.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/app/pay-ins/sandbox">
              <Button variant="outline" size="sm" className="border-border">
                Sandbox Deposit
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-secondary/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-module-payins data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-module-payins data-[state=active]:text-white">
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="conversions" className="data-[state=active]:bg-module-payins data-[state=active]:text-white">
            Conversions
          </TabsTrigger>
          <TabsTrigger value="accounts" className="data-[state=active]:bg-module-payins data-[state=active]:text-white">
            Accounts
          </TabsTrigger>
          <TabsTrigger value="deposit-addresses" className="data-[state=active]:bg-module-payins data-[state=active]:text-white">
            Deposit Addresses
          </TabsTrigger>
          <TabsTrigger value="fiat-accounts" className="data-[state=active]:bg-module-payins data-[state=active]:text-white">
            Fiat Accounts
          </TabsTrigger>
          <TabsTrigger value="destinations" className="data-[state=active]:bg-module-payins data-[state=active]:text-white">
            Destinations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Balance"
                  value={loadingBalances ? '...' : `$${balances.reduce((sum: number, b: { available: string }) => sum + parseFloat(b.available || '0'), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  change={`${balances.length} asset${balances.length !== 1 ? 's' : ''}`}
                  changeType="positive"
                  icon={Wallet}
                />
                <StatCard
                  title="Pending"
                  value={loadingTransactions ? '...' : pendingDeposits.length.toString()}
                  change="awaiting"
                  changeType="neutral"
                  icon={Clock}
                />
                <StatCard
                  title="Deposit Addresses"
                  value={loadingCryptoAddresses ? '...' : cryptoAddresses.length.toString()}
                  change="active"
                  changeType="positive"
                  icon={Bitcoin}
                />
                <StatCard
                  title="Fiat Accounts"
                  value={loadingFiatAccounts ? '...' : fiatAccounts.length.toString()}
                  change="registered"
                  changeType="neutral"
                  icon={CreditCard}
                />
              </div>

              {/* Recent Transactions */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-foreground">Recent Transactions</h3>
                </div>
                
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : allTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowDownToLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Transactions will appear here once processed</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Asset</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTransactions.slice(0, 10).map((tx: Transaction) => {
                          const isDeposit = tx.transfer_type?.includes('DEPOSIT');
                          const isWithdraw = tx.transfer_type?.includes('WITHDRAW');
                          const isConversion = tx.transfer_type === 'CONVERSION';
                          
                          return (
                            <TableRow key={tx.id} className="hover:bg-secondary/30">
                              <TableCell>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                  isDeposit ? 'bg-success/20' : isWithdraw ? 'bg-warning/20' : 'bg-primary/20'
                                }`}>
                                  {isDeposit ? (
                                    <ArrowDownToLine className="h-4 w-4 text-success" />
                                  ) : isWithdraw ? (
                                    <ArrowUpFromLine className="h-4 w-4 text-warning" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-foreground">
                                {tx.transfer_type?.replace(/_/g, ' ') || tx.transaction_type || 'Unknown'}
                              </TableCell>
                              <TableCell className="font-mono text-foreground">
                                {parseFloat(tx.amount || '0').toLocaleString()}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {tx.source_asset || tx.destination_asset || '—'}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(tx.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <TransactionStatusBadge status={tx.status} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
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

              {/* Quick Actions */}
              {institutionIdentity && (
                <div className="glass rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link to="/app/pay-ins/crypto-address" className="block">
                      <Button variant="outline" className="w-full justify-start border-border hover:border-module-payins hover:bg-module-payins/5">
                        <Bitcoin className="h-4 w-4 mr-2 text-module-payins" />
                        New Deposit Address
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-border hover:border-module-payins hover:bg-module-payins/5"
                      onClick={() => setShowCreateFiatAccount(true)}
                    >
                      <Building2 className="h-4 w-4 mr-2 text-module-payins" />
                      Register Fiat Account
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-border hover:border-module-payins hover:bg-module-payins/5"
                      onClick={() => setShowCreateDestination(true)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2 text-module-payins" />
                      Add Destination Wallet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="glass rounded-xl p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground">Manual Withdrawal</h3>
                  <p className="text-sm text-muted-foreground">Withdraw assets to registered destinations</p>
                </div>
                
                {!selectedAccountId ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an account to make withdrawals</p>
                  </div>
                ) : (
                  <ManualWithdrawalForm
                    accounts={accounts}
                    destinationAddresses={destinationAddresses}
                    fiatAccounts={fiatAccounts}
                    balances={balances}
                    selectedAccountId={selectedAccountId}
                    onSubmit={handleWithdraw}
                    isLoading={withdrawAssets.isPending}
                  />
                )}
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Available Balance</h3>
                {accounts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No accounts available</p>
                  </div>
                ) : (
                  <AccountBalancesCard balances={balances} isLoading={loadingBalances} />
                )}
              </div>
              
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <ArrowUpFromLine className="h-4 w-4 text-module-payins mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Crypto Withdrawals</p>
                      <p className="text-muted-foreground">Send to registered destination addresses</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-module-payins mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Fiat Withdrawals</p>
                      <p className="text-muted-foreground">Send to registered bank accounts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-module-payins mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Auto Conversion</p>
                      <p className="text-muted-foreground">Convert assets during withdrawal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Conversions Tab */}
        <TabsContent value="conversions" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="glass rounded-xl p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground">Asset Conversion</h3>
                  <p className="text-sm text-muted-foreground">Convert between assets within your account</p>
                </div>
                
                {!selectedAccountId ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an account to make conversions</p>
                  </div>
                ) : (
                  <ManualConversionForm
                    balances={balances}
                    selectedAccountId={selectedAccountId}
                    onSubmit={handleConvert}
                    isLoading={convertAssets.isPending}
                  />
                )}
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Available Balance</h3>
                {accounts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No accounts available</p>
                  </div>
                ) : (
                  <AccountBalancesCard balances={balances} isLoading={loadingBalances} />
                )}
              </div>
              
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Conversion Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-module-payins mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Instant Swap</p>
                      <p className="text-muted-foreground">Convert between any supported assets</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-module-payins mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">No External Transfer</p>
                      <p className="text-muted-foreground">Assets stay within your account</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-module-payins mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Market Rate</p>
                      <p className="text-muted-foreground">Competitive exchange rates</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Accounts</h3>
                <p className="text-sm text-muted-foreground">Click an account to view details, balances, and deposit addresses</p>
              </div>
              {institutionIdentity && (
                <Button onClick={() => setShowCreateAccount(true)} className="bg-module-payins hover:bg-module-payins/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Account
                </Button>
              )}
            </div>
            <AccountsTable 
              accounts={accounts} 
              isLoading={loadingAccounts}
              onSelect={handleAccountSelect}
            />
          </div>
        </TabsContent>

        {/* Deposit Addresses Tab */}
        <TabsContent value="deposit-addresses" className="mt-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Crypto Deposit Addresses</h3>
                <p className="text-sm text-muted-foreground">Click an address to view details and routing configuration</p>
              </div>
              {institutionIdentity && (
                <Link to="/app/pay-ins/crypto-address">
                  <Button className="bg-module-payins hover:bg-module-payins/90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Address
                  </Button>
                </Link>
              )}
            </div>
            <CryptoAddressList 
              addresses={cryptoAddresses} 
              isLoading={loadingCryptoAddresses}
              emptyMessage="No deposit addresses created yet"
              onSelect={handleAddressSelect}
            />
          </div>
        </TabsContent>

        {/* Fiat Accounts Tab */}
        <TabsContent value="fiat-accounts" className="mt-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Registered Fiat Accounts</h3>
                <p className="text-sm text-muted-foreground">Bank accounts registered for fiat withdrawals</p>
              </div>
              {institutionIdentity && (
                <Button onClick={() => setShowCreateFiatAccount(true)} className="bg-module-payins hover:bg-module-payins/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Register Account
                </Button>
              )}
            </div>
            <FiatAccountsList 
              accounts={fiatAccounts} 
              isLoading={loadingFiatAccounts}
              emptyMessage="No fiat accounts registered yet"
            />
          </div>
        </TabsContent>

        {/* Destination Addresses Tab */}
        <TabsContent value="destinations" className="mt-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Destination Crypto Addresses</h3>
                <p className="text-sm text-muted-foreground">External wallets registered for crypto withdrawals</p>
              </div>
              {institutionIdentity && (
                <Button onClick={() => setShowCreateDestination(true)} className="bg-module-payins hover:bg-module-payins/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Destination
                </Button>
              )}
            </div>
            <DestinationAddressList 
              addresses={destinationAddresses} 
              isLoading={loadingDestinations}
              emptyMessage="No destination addresses registered yet"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Business Registration</DialogTitle>
          </DialogHeader>
          <InstitutionOnboardingWizard
            onSubmit={handleCreateIdentity}
            isLoading={createIdentity.isPending}
            onCancel={() => setShowOnboarding(false)}
            module="PAY_INS"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
          </DialogHeader>
          <CreateAccountForm
            identities={institutionIdentity ? [institutionIdentity] : []}
            onSubmit={handleCreateAccount}
            isLoading={createAccount.isPending}
            module="PAY_INS"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateFiatAccount} onOpenChange={setShowCreateFiatAccount}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Fiat Account</DialogTitle>
          </DialogHeader>
          <CreateFiatAccountForm
            accounts={accounts}
            onSubmit={handleRegisterFiatAccount}
            isLoading={registerFiatAccount.isPending}
            onCancel={() => setShowCreateFiatAccount(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDestination} onOpenChange={setShowCreateDestination}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Register Destination Address</DialogTitle>
          </DialogHeader>
          <CreateDestinationAddressForm
            accounts={accounts}
            onSubmit={handleCreateDestinationAddress}
            isLoading={createDestinationAddress.isPending}
            onCancel={() => setShowCreateDestination(false)}
          />
        </DialogContent>
      </Dialog>

      <AccountDetailModal
        account={selectedAccount}
        balances={selectedAccountBalances}
        cryptoAddresses={selectedAccountAddresses}
        isLoadingBalances={loadingSelectedBalances}
        isLoadingAddresses={loadingSelectedAddresses}
        isOpen={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
        onCreateAddress={() => {
          setSelectedAccount(null);
          navigate('/app/pay-ins/crypto-address');
        }}
      />

      <DepositAddressDetailModal
        address={selectedAddress}
        isOpen={!!selectedAddress}
        onClose={() => setSelectedAddress(null)}
        destinationAddresses={destinationAddresses}
        fiatAccounts={fiatAccounts}
      />
    </div>
  );
};

export default PayInsDashboard;