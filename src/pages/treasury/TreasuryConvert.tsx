import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
import { useConvertAssets } from '@/hooks/useAssets';

const TreasuryConvert: React.FC = () => {
  const [formData, setFormData] = useState({
    account: '',
    sourceAsset: '',
    destAsset: '',
    amount: '',
  });

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(formData.account);
  const convertAssets = useConvertAssets();

  const accounts = accountsResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data) ? balancesResponse.data : [];

  const handleConvert = async () => {
    if (!formData.account || !formData.sourceAsset || !formData.destAsset || !formData.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await convertAssets.mutateAsync({
        account_id: formData.account,
        source_asset: formData.sourceAsset,
        destination_asset: formData.destAsset,
        amount: formData.amount,
      });
      toast.success('Conversion completed successfully!');
      // Reset form but keep account selected
      setFormData({ account: formData.account, sourceAsset: '', destAsset: '', amount: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to convert assets');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/treasury">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Asset Conversion</h2>
          <p className="text-muted-foreground">Convert between assets in your treasury</p>
        </div>
      </div>

      <div className="glass rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <Label>Account</Label>
          <Select
            value={formData.account}
            onValueChange={(v) => setFormData({...formData, account: v, sourceAsset: '', destAsset: '', amount: ''})}
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

        {/* From */}
        <div className="space-y-2">
          <Label>From</Label>
          <div className="p-4 rounded-lg bg-secondary border border-border space-y-4">
            <div className="flex items-center justify-between">
              <Select
                value={formData.sourceAsset}
                onValueChange={(v) => setFormData({...formData, sourceAsset: v, destAsset: '', amount: ''})}
                disabled={!formData.account || loadingBalances}
              >
                <SelectTrigger className="w-40 bg-muted border-0">
                  <SelectValue placeholder={formData.account ? 'Asset' : 'Select acct'} />
                </SelectTrigger>
                <SelectContent>
                  {balances.map((balance) => (
                    <SelectItem key={balance.asset} value={balance.asset}>
                      <div className="flex items-center gap-2">
                        <AssetIcon asset={balance.asset} size="sm" />
                        {balance.asset}
                      </div>
                    </SelectItem>
                  ))}
                  {balances.length === 0 && !loadingBalances && formData.account && (
                    <SelectItem value="" disabled>No assets</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="text-right text-xl font-semibold bg-transparent border-0 w-40"
              />
            </div>
            {formData.sourceAsset && balances.find(b => b.asset === formData.sourceAsset) && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Available:</span>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    const balance = balances.find(b => b.asset === formData.sourceAsset);
                    if (balance) {
                      setFormData({...formData, amount: balance.available});
                    }
                  }}
                >
                  {balances.find(b => b.asset === formData.sourceAsset)?.available} {formData.sourceAsset}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* To */}
        <div className="space-y-2">
          <Label>To</Label>
          <div className="p-4 rounded-lg bg-secondary border border-border space-y-4">
            <div className="flex items-center justify-between">
              <Select
                value={formData.destAsset}
                onValueChange={(v) => setFormData({...formData, destAsset: v})}
                disabled={!formData.sourceAsset}
              >
                <SelectTrigger className="w-40 bg-muted border-0">
                  <SelectValue placeholder={formData.sourceAsset ? 'Asset' : 'Select from'} />
                </SelectTrigger>
                <SelectContent>
                  {balances.filter(b => b.asset !== formData.sourceAsset).map((balance) => (
                    <SelectItem key={balance.asset} value={balance.asset}>
                      <div className="flex items-center gap-2">
                        <AssetIcon asset={balance.asset} size="sm" />
                        {balance.asset}
                      </div>
                    </SelectItem>
                  ))}
                  {balances.filter(b => b.asset !== formData.sourceAsset).length === 0 && (
                    <SelectItem value="" disabled>No other assets</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <span className="text-xl font-semibold text-foreground">
                {formData.destAsset && formData.amount ? '~' : '0.00'}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleConvert}
          disabled={convertAssets.isPending || !formData.amount || !formData.sourceAsset || !formData.destAsset}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${convertAssets.isPending ? 'animate-spin' : ''}`} />
          {convertAssets.isPending ? 'Converting...' : 'Convert'}
        </Button>
      </div>
    </div>
  );
};

export default TreasuryConvert;
