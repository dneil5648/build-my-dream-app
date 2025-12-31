import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpFromLine, Loader2, Landmark, Plus, Wallet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { FiatAccountsList } from '@/components/shared/FiatAccountsList';
import { CreateFiatAccountForm } from '@/components/shared/CreateFiatAccountForm';
import { toast } from 'sonner';
import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
import { useIdentities } from '@/hooks/useIdentities';
import { useFiatAccounts, useRegisterFiatAccount } from '@/hooks/useFiat';
import { useWithdrawAssets } from '@/hooks/useAssets';
import { PaxosAccount, PaxosIdentity, FiatAccount, RegisterFiatAccountRequest } from '@/api/types';

// Stablecoins that can be redeemed for USD
const REDEEMABLE_ASSETS = ['USDC', 'USDT', 'USDP', 'PYUSD', 'USDG', 'DAI', 'BUSD', 'USD'];

const TreasuryOffRamp: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [fiatAccountId, setFiatAccountId] = useState('');
  const [asset, setAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [showCreateFiatAccount, setShowCreateFiatAccount] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'TREASURY' });
  const { data: identitiesResponse } = useIdentities({ module: 'TREASURY' });
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const { data: fiatAccountsResponse, isLoading: loadingFiatAccounts } = useFiatAccounts();
  
  const withdrawAssets = useWithdrawAssets();
  const registerFiatAccount = useRegisterFiatAccount();

  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  const fiatAccounts = fiatAccountsResponse?.data || [];

  // Filter to only show stablecoins that can be redeemed
  const redeemableBalances = balances.filter((b: { asset: string }) => 
    REDEEMABLE_ASSETS.includes(b.asset)
  );

  const selectedFiatAccount = fiatAccounts.find((f: FiatAccount) => f.id === fiatAccountId);
  const selectedBalance = redeemableBalances.find((b: { asset: string }) => b.asset === asset);

  // Only institutional identities
  const institutionIdentities = identities.filter((i: PaxosIdentity) => 
    i.identity_type?.toUpperCase() === 'INSTITUTION'
  );

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleRegisterFiatAccount = async (data: RegisterFiatAccountRequest) => {
    try {
      await registerFiatAccount.mutateAsync(data);
      toast.success('Fiat account registered');
      setShowCreateFiatAccount(false);
    } catch (error) {
      toast.error('Failed to register fiat account');
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccountId || !asset || !amount || !fiatAccountId || !selectedFiatAccount) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await withdrawAssets.mutateAsync({
        account_id: selectedAccountId,
        source_asset: asset,
        destination_asset: 'USD',
        paxos_fiat_account_id: selectedFiatAccount.paxos_fiat_account_id,
        amount,
      });

      toast.success('Redemption initiated successfully');
      setAmount('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process redemption');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/treasury">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Off-Ramp</h2>
          <p className="text-muted-foreground">Redeem stablecoins to USD fiat</p>
        </div>
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          isLoading={loadingAccounts}
          label="Account"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Redemption Form */}
        <form onSubmit={handleRedeem}>
          <Card className="bg-card border-border h-full">
            <CardHeader>
              <CardTitle>Redeem to USD</CardTitle>
              <CardDescription>Convert stablecoins to fiat and withdraw</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Asset Selection */}
              <div className="space-y-2">
                <Label>Stablecoin to Redeem</Label>
                <Select 
                  value={asset} 
                  onValueChange={setAsset}
                  disabled={!selectedAccountId || loadingBalances}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder={selectedAccountId ? 'Select asset' : 'Select account first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {redeemableBalances.map((balance: { asset: string; available: string }) => (
                      <SelectItem key={balance.asset} value={balance.asset}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <div className="flex items-center gap-2">
                            <AssetIcon asset={balance.asset} size="sm" />
                            {balance.asset}
                          </div>
                          <span className="text-muted-foreground">{balance.available}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {redeemableBalances.length === 0 && selectedAccountId && (
                      <SelectItem value="" disabled>No redeemable assets</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination Fiat Account */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Destination Bank Account</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1 px-2 text-xs text-primary"
                    onClick={() => setShowCreateFiatAccount(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add New
                  </Button>
                </div>
                <Select value={fiatAccountId} onValueChange={setFiatAccountId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {fiatAccounts.map((account: FiatAccount) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-muted-foreground" />
                          <span>{account.fiat_account_owner_name || 'Bank Account'}</span>
                          <span className="text-xs text-muted-foreground">
                            (...{account.fiat_account_number?.slice(-4) || '****'})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {fiatAccounts.length === 0 && (
                      <SelectItem value="" disabled>No bank accounts registered</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedFiatAccount && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFiatAccount.fiat_network} • {selectedFiatAccount.routing_number_type}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Amount</Label>
                  {selectedBalance && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setAmount(selectedBalance.available)}
                    >
                      Max: {selectedBalance.available}
                    </button>
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Info Notice */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary">Redemption Process</p>
                    <p className="text-sm text-muted-foreground">
                      Stablecoins will be converted to USD at 1:1 and wired to your bank account. 
                      Processing typically takes 1-2 business days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">You redeem</span>
                  <span className="font-medium text-foreground">{amount || '0'} {asset || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="font-semibold text-module-treasury">${amount || '0'} USD</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={withdrawAssets.isPending || !amount || !asset || !fiatAccountId}
                className="w-full bg-module-treasury hover:bg-module-treasury/90"
              >
                {withdrawAssets.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpFromLine className="h-4 w-4 mr-2" />
                    Redeem to USD
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Registered Fiat Accounts */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bank Accounts</CardTitle>
              <CardDescription>Registered USD destination accounts</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCreateFiatAccount(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
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

      {/* Create Fiat Account Dialog */}
      <Dialog open={showCreateFiatAccount} onOpenChange={setShowCreateFiatAccount}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Register Bank Account</DialogTitle>
          </DialogHeader>
          <CreateFiatAccountForm
            identities={institutionIdentities}
            onSubmit={handleRegisterFiatAccount}
            isLoading={registerFiatAccount.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreasuryOffRamp;
