import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowDown, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { toast } from 'sonner';
import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
import { useConvertAssets } from '@/hooks/useAssets';
import { PaxosAccount } from '@/api/types';
import { TREASURY_ASSETS } from '@/lib/constants';

const TreasuryConvert: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [sourceAsset, setSourceAsset] = useState('');
  const [destAsset, setDestAsset] = useState('');
  const [amount, setAmount] = useState('');

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'TREASURY' });
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const convertAssets = useConvertAssets();

  const accounts = accountsResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];

  const selectedBalance = balances.find((b: { asset: string }) => b.asset === sourceAsset);

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleConvert = async () => {
    if (!selectedAccountId || !sourceAsset || !destAsset || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await convertAssets.mutateAsync({
        account_id: selectedAccountId,
        source_asset: sourceAsset,
        destination_asset: destAsset,
        amount,
      });
      toast.success('Conversion completed successfully!');
      setSourceAsset('');
      setDestAsset('');
      setAmount('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to convert assets');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/treasury">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Asset Conversion</h2>
          <p className="text-muted-foreground">Convert between assets in your treasury</p>
        </div>
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          isLoading={loadingAccounts}
          label="Account"
        />
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Convert Assets</CardTitle>
          <CardDescription>Swap between stablecoins and crypto assets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From */}
          <div className="space-y-2">
            <Label>From</Label>
            <div className="p-4 rounded-lg bg-secondary border border-border space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Select
                  value={sourceAsset}
                  onValueChange={(v) => { setSourceAsset(v); setDestAsset(''); setAmount(''); }}
                  disabled={!selectedAccountId || loadingBalances}
                >
                  <SelectTrigger className="w-40 bg-muted border-0">
                    <SelectValue placeholder={selectedAccountId ? 'Asset' : 'Select acct'} />
                  </SelectTrigger>
                  <SelectContent>
                    {balances.map((balance: { asset: string; available: string }) => (
                      <SelectItem key={balance.asset} value={balance.asset}>
                        <div className="flex items-center gap-2">
                          <AssetIcon asset={balance.asset} size="sm" />
                          {balance.asset}
                        </div>
                      </SelectItem>
                    ))}
                    {balances.length === 0 && !loadingBalances && selectedAccountId && (
                      <SelectItem value="" disabled>No assets</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-right text-xl font-semibold bg-transparent border-0 w-40"
                />
              </div>
              {sourceAsset && selectedBalance && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  <button
                    type="button"
                    className="text-module-treasury hover:underline"
                    onClick={() => setAmount(selectedBalance.available)}
                  >
                    {selectedBalance.available} {sourceAsset}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-full bg-module-treasury/10 flex items-center justify-center">
              <ArrowDown className="h-5 w-5 text-module-treasury" />
            </div>
          </div>

          {/* To */}
          <div className="space-y-2">
            <Label>To</Label>
            <div className="p-4 rounded-lg bg-secondary border border-border">
              <div className="flex items-center justify-between">
                <Select
                  value={destAsset}
                  onValueChange={setDestAsset}
                  disabled={!sourceAsset}
                >
                  <SelectTrigger className="w-40 bg-muted border-0">
                    <SelectValue placeholder={sourceAsset ? 'Asset' : 'Select from'} />
                  </SelectTrigger>
                  <SelectContent>
                    {TREASURY_ASSETS
                      .filter(a => a.value !== sourceAsset)
                      .map((asset) => (
                        <SelectItem key={asset.value} value={asset.value}>
                          <div className="flex items-center gap-2">
                            <AssetIcon asset={asset.value} size="sm" />
                            {asset.label}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <span className="text-xl font-semibold text-foreground">
                  {destAsset && amount ? `~${amount}` : '0.00'}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConvert}
            disabled={convertAssets.isPending || !amount || !sourceAsset || !destAsset}
            className="w-full bg-module-treasury hover:bg-module-treasury/90"
          >
            {convertAssets.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TreasuryConvert;
