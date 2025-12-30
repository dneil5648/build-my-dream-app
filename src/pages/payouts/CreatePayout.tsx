import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpFromLine, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
import { useFiatAccounts } from '@/hooks/useFiat';
import { useWithdrawAssets } from '@/hooks/useAssets';

const CreatePayout: React.FC = () => {
  const [formData, setFormData] = useState({
    sourceAccount: '',
    sourceAsset: '',
    bankAccount: '',
    amount: '',
  });

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(formData.sourceAccount);
  const { data: fiatAccountsResponse, isLoading: loadingFiatAccounts } = useFiatAccounts();
  const withdrawAssets = useWithdrawAssets();

  const accounts = accountsResponse?.data || [];
  const balances = balancesResponse?.data || [];
  const fiatAccounts = fiatAccountsResponse?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sourceAccount || !formData.sourceAsset || !formData.bankAccount || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await withdrawAssets.mutateAsync({
        account_id: formData.sourceAccount,
        source_asset: formData.sourceAsset,
        destination_asset: 'USD', // Converting to USD for fiat payout
        fiat_account_id: formData.bankAccount,
        amount: formData.amount,
      });
      toast.success('Payout initiated successfully');
      // Reset form but keep account selected
      setFormData({
        sourceAccount: formData.sourceAccount,
        sourceAsset: '',
        bankAccount: '',
        amount: '',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate payout');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/payouts">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Create Payout</h2>
          <p className="text-muted-foreground">Withdraw fiat to your registered bank account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <Label>Source Account</Label>
          <Select
            value={formData.sourceAccount}
            onValueChange={(v) => setFormData({...formData, sourceAccount: v, sourceAsset: '', amount: ''})}
            disabled={loadingAccounts}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={loadingAccounts ? 'Loading...' : 'Select account'} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.paxos_account_id}>
                  Account {account.paxos_account_id.slice(0, 8)}...
                </SelectItem>
              ))}
              {accounts.length === 0 && !loadingAccounts && (
                <SelectItem value="" disabled>No accounts found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Source Asset</Label>
          <Select
            value={formData.sourceAsset}
            onValueChange={(v) => setFormData({...formData, sourceAsset: v, amount: ''})}
            disabled={!formData.sourceAccount || loadingBalances}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={formData.sourceAccount ? loadingBalances ? 'Loading...' : 'Select asset' : 'Select account first'} />
            </SelectTrigger>
            <SelectContent>
              {balances.map((balance) => (
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
              {balances.length === 0 && !loadingBalances && formData.sourceAccount && (
                <SelectItem value="" disabled>No assets available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Destination Bank Account</Label>
          <Select
            value={formData.bankAccount}
            onValueChange={(v) => setFormData({...formData, bankAccount: v})}
            disabled={loadingFiatAccounts}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={loadingFiatAccounts ? 'Loading...' : 'Select bank account'} />
            </SelectTrigger>
            <SelectContent>
              {fiatAccounts.map((account) => (
                <SelectItem key={account.id} value={account.fiat_account_id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {account.fiat_network_name || account.network} • {account.fiat_account_id.slice(0, 12)}...
                  </div>
                </SelectItem>
              ))}
              {fiatAccounts.length === 0 && !loadingFiatAccounts && (
                <SelectItem value="" disabled>No bank accounts registered</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount</Label>
            {formData.sourceAsset && balances.find(b => b.asset === formData.sourceAsset) && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  const balance = balances.find(b => b.asset === formData.sourceAsset);
                  if (balance) {
                    setFormData({...formData, amount: balance.available.replace(/,/g, '')});
                  }
                }}
              >
                Max: ${balances.find(b => b.asset === formData.sourceAsset)?.available}
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="text"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="pl-8 bg-secondary border-border"
            />
          </div>
        </div>

        {/* Summary */}
        {formData.amount && formData.bankAccount && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-foreground">${formData.amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee</span>
              <span className="text-foreground">$25.00</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-medium text-foreground">You'll receive</span>
              <span className="font-semibold text-foreground">
                ${(parseFloat(formData.amount.replace(/,/g, '') || '0') - 25).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={withdrawAssets.isPending || !formData.amount || !formData.bankAccount}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <ArrowUpFromLine className="h-4 w-4 mr-2" />
          {withdrawAssets.isPending ? 'Processing...' : 'Create Payout'}
        </Button>
      </form>
    </div>
  );
};

export default CreatePayout;
