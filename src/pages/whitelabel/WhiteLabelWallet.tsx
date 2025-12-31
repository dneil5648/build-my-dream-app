import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, History, Plus, Loader2 } from 'lucide-react';
import { BalancesTable } from '@/components/shared/BalancesTable';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { WalletOnboardingWizard } from '@/components/shared/WalletOnboardingWizard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAccounts, useCreateAccount, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { useTransactions } from '@/hooks/useTransactions';
import { CreateIdentityRequest, CreateAccountRequest, PaxosIdentity, Transaction } from '@/api/types';
import { getWhiteLabelConfig, WhiteLabelConfig } from '@/pages/config/ConfigPage';
import { toast } from 'sonner';

const WhiteLabelWallet: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig | null>(null);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: identitiesResponse } = useIdentities();
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const { transactions: recentActivity, isLoading: loadingTransactions } = useTransactions({ limit: 3 });
  const createIdentity = useCreateIdentity();
  const createAccount = useCreateAccount();

  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];

  // Load white label config
  useEffect(() => {
    const config = getWhiteLabelConfig();
    if (config) {
      setWhiteLabelConfig(config);
    }
  }, []);

  // Auto-select first account if available
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleCreateIdentity = async (data: CreateIdentityRequest): Promise<PaxosIdentity | void> => {
    try {
      const result = await createIdentity.mutateAsync(data);
      return result.data;
    } catch (error) {
      toast.error('Failed to create identity');
      throw error;
    }
  };

  const handleCreateWallet = async (data: CreateAccountRequest) => {
    try {
      await createAccount.mutateAsync(data);
      toast.success('Wallet created successfully');
      setShowOnboarding(false);
    } catch (error) {
      toast.error('Failed to create wallet');
      throw error;
    }
  };

  // Get custom asset name from config
  const getAssetDisplayName = (asset: string): string => {
    if (!whiteLabelConfig) return asset;
    const mapping = whiteLabelConfig.assetMappings.find(m => m.assetId === asset);
    return mapping?.customName || asset;
  };

  // Get custom asset color from config
  const getAssetColor = (asset: string): string | undefined => {
    if (!whiteLabelConfig) return undefined;
    const mapping = whiteLabelConfig.assetMappings.find(m => m.assetId === asset);
    return mapping?.iconColor;
  };

  // Calculate total from balances
  const totalValue = balances.reduce((sum, b) => {
    const val = parseFloat(b.available) || 0;
    return sum + val;
  }, 0);

  const walletName = whiteLabelConfig?.walletName || 'My Wallet';

  return (
    <div className="space-y-6">
      {/* Wallet Selector - Top Right */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{walletName}</h2>
        <div className="flex items-center gap-3">
          <AccountSelector
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccount={setSelectedAccountId}
            onCreateAccount={() => setShowOnboarding(true)}
            isLoading={loadingAccounts}
            label="Wallet"
          />
          <Button 
            onClick={() => setShowOnboarding(true)} 
            size="icon"
            variant="outline"
            className="border-module-whitelabel text-module-whitelabel hover:bg-module-whitelabel/10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Header Card - Total Balance */}
        <div className="rounded-3xl bg-gradient-to-br from-module-whitelabel via-module-whitelabel/80 to-module-whitelabel/60 p-8 text-center">
          <p className="text-white/80 text-sm mb-2">Total Balance</p>
          <h1 className="text-4xl font-bold text-white mb-1">
            {loadingBalances ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            ) : (
              `$${totalValue.toLocaleString()}`
            )}
          </h1>
          <p className="text-white/80 text-sm">
            {selectedAccountId ? `Wallet: ${selectedAccountId.slice(0, 8)}...` : 'No wallet selected'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          <Link to="/app/white-label/receive" className="text-center group">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
              <ArrowDownToLine className="h-6 w-6 text-module-whitelabel" />
            </div>
            <span className="text-xs text-muted-foreground mt-2 block">Receive</span>
          </Link>
          <Link to="/app/white-label/send" className="text-center group">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
              <ArrowUpFromLine className="h-6 w-6 text-module-whitelabel" />
            </div>
            <span className="text-xs text-muted-foreground mt-2 block">Send</span>
          </Link>
          <Link to="/app/white-label/swap" className="text-center group">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
              <RefreshCw className="h-6 w-6 text-module-whitelabel" />
            </div>
            <span className="text-xs text-muted-foreground mt-2 block">Swap</span>
          </Link>
          <Link to="/app/white-label/activity" className="text-center group">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
              <History className="h-6 w-6 text-module-whitelabel" />
            </div>
            <span className="text-xs text-muted-foreground mt-2 block">Activity</span>
          </Link>
        </div>

        {/* Assets */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Your Assets</h3>
          <BalancesTable 
            balances={balances} 
            isLoading={loadingBalances}
            emptyMessage="No assets found"
            assetMappings={whiteLabelConfig?.assetMappings}
          />
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
            <Link to="/app/white-label/activity" className="text-sm text-module-whitelabel">
              See all
            </Link>
          </div>
          {loadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((tx: Transaction) => {
                const isDeposit = tx.transaction_type === 'CRYPTO_DEPOSIT' || tx.transaction_type === 'WIRE_DEPOSIT' || tx.transaction_type === 'BANK_DEPOSIT';
                const isWithdrawal = tx.transaction_type === 'CRYPTO_WITHDRAWAL' || tx.transaction_type === 'WIRE_WITHDRAWAL' || tx.transaction_type === 'BANK_WITHDRAWAL';
                const isConversion = tx.transaction_type === 'CONVERSION';
                const displayType = isDeposit ? 'receive' : isWithdrawal ? 'send' : tx.transaction_type.toLowerCase().replace('_', ' ');
                
                return (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isDeposit ? 'bg-success/20' :
                        isWithdrawal ? 'bg-warning/20' : 'bg-module-whitelabel/20'
                      }`}>
                        {isDeposit && <ArrowDownToLine className="h-5 w-5 text-success" />}
                        {isWithdrawal && <ArrowUpFromLine className="h-5 w-5 text-warning" />}
                        {isConversion && <RefreshCw className="h-5 w-5 text-module-whitelabel" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground capitalize">{displayType}</p>
                        <p className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${isDeposit ? 'text-success' : 'text-foreground'}`}>
                      {isDeposit ? '+' : '-'}{tx.amount} {tx.source_asset}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Wallet Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create New Wallet</DialogTitle>
          </DialogHeader>
          <WalletOnboardingWizard
            onCreateIdentity={handleCreateIdentity}
            onCreateWallet={handleCreateWallet}
            existingIdentities={identities}
            isLoading={createIdentity.isPending || createAccount.isPending}
            onCancel={() => setShowOnboarding(false)}
            module="WHITE_LABEL"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhiteLabelWallet;
