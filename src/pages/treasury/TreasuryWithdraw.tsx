import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpFromLine, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
import { useCalculateWithdrawalFee } from '@/hooks/useCrypto';
import { useWithdrawAssets } from '@/hooks/useAssets';
import { CryptoNetwork } from '@/api/types';

const TreasuryWithdraw: React.FC = () => {
  const [formData, setFormData] = useState({
    account: '',
    asset: '',
    destination: '',
    amount: '',
    network: '',
  });
  const [fee, setFee] = useState<string | null>(null);

  const { data: accountsResponse } = useAccounts();
  const { data: balancesResponse } = useAccountBalances(formData.account);
  const calculateFee = useCalculateWithdrawalFee();
  const withdrawAssets = useWithdrawAssets();

  const accounts = accountsResponse?.data || [];
  const balances = balancesResponse?.data || [];

  const handleCalculateFee = async () => {
    if (!formData.account || !formData.asset || !formData.network || !formData.amount || !formData.destination) {
      return;
    }

    try {
      const result = await calculateFee.mutateAsync({
        asset: formData.asset,
        network: formData.network as CryptoNetwork,
        amount: formData.amount,
        destination_address: formData.destination,
      });

      if (result.success && result.data) {
        setFee(result.data.fee);
      }
    } catch (error) {
      toast.error('Failed to calculate fee');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.account || !formData.asset || !formData.destination || !formData.amount || !formData.network) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await withdrawAssets.mutateAsync({
        account_id: formData.account,
        source_asset: formData.asset,
        destination_asset: formData.asset, // Same asset (no conversion)
        destination_address: formData.destination,
        amount: formData.amount,
        network: formData.network as CryptoNetwork,
      });
      toast.success('Withdrawal initiated successfully');
      // Reset form
      setFormData({
        account: formData.account,
        asset: '',
        destination: '',
        amount: '',
        network: '',
      });
      setFee(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate withdrawal');
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
          <h2 className="text-2xl font-bold text-foreground">Payout to External Wallet</h2>
          <p className="text-muted-foreground">Withdraw crypto to an external wallet address</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <Label>Source Account</Label>
          <Select value={formData.account} onValueChange={(v) => setFormData({...formData, account: v})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.paxos_account_id}>
                  {account.paxos_account_id}
                </SelectItem>
              ))}
              {accounts.length === 0 && (
                <SelectItem value="" disabled>No accounts available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Asset</Label>
          <Select
            value={formData.asset}
            onValueChange={(v) => { setFormData({...formData, asset: v, network: ''}); setFee(null); }}
            disabled={!formData.account}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={formData.account ? 'Select asset' : 'Select account first'} />
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
              {balances.length === 0 && formData.account && (
                <SelectItem value="" disabled>No assets available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Network Selection */}
        {formData.asset && (
          <div className="space-y-2">
            <Label>Network</Label>
            <Select value={formData.network} onValueChange={(v) => { setFormData({...formData, network: v}); handleCalculateFee(); }}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {formData.asset === 'BTC' && (
                  <>
                    <SelectItem value="BITCOIN">Bitcoin Network</SelectItem>
                    <SelectItem value="LIGHTNING">Lightning Network</SelectItem>
                  </>
                )}
                {formData.asset === 'ETH' && (
                  <>
                    <SelectItem value="ETHEREUM">Ethereum Network</SelectItem>
                    <SelectItem value="ARBITRUM">Arbitrum</SelectItem>
                    <SelectItem value="OPTIMISM">Optimism</SelectItem>
                  </>
                )}
                {formData.asset === 'USDC' && (
                  <>
                    <SelectItem value="ETHEREUM">Ethereum Network</SelectItem>
                    <SelectItem value="POLYGON">Polygon Network</SelectItem>
                    <SelectItem value="SOLANA">Solana</SelectItem>
                    <SelectItem value="ARBITRUM">Arbitrum</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Destination Address</Label>
          <Input
            placeholder="Enter wallet address"
            value={formData.destination}
            onChange={(e) => setFormData({...formData, destination: e.target.value})}
            className="bg-secondary border-border font-mono"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount</Label>
            {formData.asset && balances.find(b => b.asset === formData.asset) && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  const balance = balances.find(b => b.asset === formData.asset);
                  if (balance) {
                    setFormData({...formData, amount: balance.available});
                  }
                }}
              >
                Max: {balances.find(b => b.asset === formData.asset)?.available}
              </button>
            )}
          </div>
          <Input
            type="text"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="bg-secondary border-border"
          />
        </div>

        {/* Fee Estimate */}
        {fee && formData.network && (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Network Fee</p>
                <p className="text-sm text-muted-foreground">
                  Estimated fee: {fee} {formData.asset}
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={withdrawAssets.isPending || !formData.amount || !formData.destination || !formData.network}
          className="w-full bg-warning hover:bg-warning/90 text-warning-foreground"
        >
          <ArrowUpFromLine className="h-4 w-4 mr-2" />
          {withdrawAssets.isPending ? 'Processing...' : 'Withdraw'}
        </Button>
      </form>
    </div>
  );
};

export default TreasuryWithdraw;
