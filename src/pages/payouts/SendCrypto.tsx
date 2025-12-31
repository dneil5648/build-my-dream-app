import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, AlertCircle, Info, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
import { useCryptoDestinationAddresses, useCalculateWithdrawalFee } from '@/hooks/useCrypto';
import { useWithdrawAssets, useConvertAssets } from '@/hooks/useAssets';
import { CryptoDestinationAddress, AccountBalanceItem } from '@/api/types';

// Supported stablecoins
const STABLECOINS = ['USDC', 'USDT', 'USDP', 'PYUSD', 'USDG', 'DAI'];

const SendCrypto: React.FC = () => {
  const [formData, setFormData] = useState({
    sourceAccount: '',
    sourceAsset: '',
    destinationId: '',
    amount: '',
    convertFirst: false,
    convertFromAsset: 'USD',
  });
  const [feeData, setFeeData] = useState<{ fee: string; fee_asset: string; estimated_total: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'PAY_OUTS' });
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(formData.sourceAccount);
  const { data: destinationsResponse, isLoading: loadingDestinations } = useCryptoDestinationAddresses(
    formData.sourceAccount ? { account_id: formData.sourceAccount } : undefined
  );
  
  const withdrawAssets = useWithdrawAssets();
  const convertAssets = useConvertAssets();
  const calculateFee = useCalculateWithdrawalFee();

  const accounts = accountsResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  const destinations = destinationsResponse?.data || [];
  const selectedDestination = destinations.find((d: CryptoDestinationAddress) => d.id === formData.destinationId);

  // Filter stablecoin balances
  const stablecoinBalances = useMemo(() => {
    return balances.filter((b: AccountBalanceItem) => STABLECOINS.includes(b.asset));
  }, [balances]);

  // Check if user has USD balance
  const usdBalance = useMemo(() => {
    return balances.find((b: AccountBalanceItem) => b.asset === 'USD');
  }, [balances]);

  const availableBalance = useMemo(() => {
    const balance = balances.find((b: AccountBalanceItem) => b.asset === formData.sourceAsset);
    return balance ? parseFloat(balance.available.replace(/,/g, '')) : 0;
  }, [balances, formData.sourceAsset]);

  const handleCalculateFee = async () => {
    if (!formData.amount || !formData.destinationId || !formData.sourceAsset) return;

    try {
      const result = await calculateFee.mutateAsync({
        asset: formData.sourceAsset,
        amount: formData.amount,
        crypto_network: selectedDestination?.crypto_network || 'ETHEREUM',
        destination_address: selectedDestination?.address || '',
      });
      if (result?.data) {
        setFeeData(result.data);
        setShowConfirmation(true);
      }
    } catch (error) {
      toast.error('Failed to calculate fee');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sourceAccount || !formData.sourceAsset || !formData.destinationId || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // If converting first, do conversion then withdrawal
      if (formData.convertFirst && formData.convertFromAsset === 'USD') {
        // First convert USD to stablecoin
        await convertAssets.mutateAsync({
          account_id: formData.sourceAccount,
          source_asset: 'USD',
          destination_asset: formData.sourceAsset,
          amount: formData.amount,
        });
        toast.success(`Converted $${formData.amount} USD to ${formData.sourceAsset}`);
      }

      // Withdraw to destination
      await withdrawAssets.mutateAsync({
        account_id: formData.sourceAccount,
        source_asset: formData.sourceAsset,
        destination_asset: formData.sourceAsset,
        crypto_destination_id: formData.destinationId,
        amount: formData.amount,
      });
      
      toast.success('Crypto sent successfully!');
      // Reset form
      setFormData({
        sourceAccount: formData.sourceAccount,
        sourceAsset: '',
        destinationId: '',
        amount: '',
        convertFirst: false,
        convertFromAsset: 'USD',
      });
      setFeeData(null);
      setShowConfirmation(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send crypto');
    }
  };

  const handleSetMax = () => {
    if (formData.convertFirst) {
      const usd = parseFloat(usdBalance?.available?.replace(/,/g, '') || '0');
      setFormData({ ...formData, amount: usd.toString() });
    } else {
      setFormData({ ...formData, amount: availableBalance.toString() });
    }
  };

  const isValid = formData.sourceAccount && formData.sourceAsset && formData.destinationId && parseFloat(formData.amount || '0') > 0;

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
          <h2 className="text-2xl font-bold text-foreground">Send Crypto</h2>
          <p className="text-muted-foreground">Send stablecoins to an external wallet</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl bg-module-payouts/10 border border-module-payouts/20 p-4 flex gap-3">
        <Info className="h-5 w-5 text-module-payouts flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p>Send stablecoins to pre-registered destination wallets. You can also convert USD to stablecoin before sending.</p>
        </div>
      </div>

      {!showConfirmation ? (
        <form onSubmit={(e) => { e.preventDefault(); handleCalculateFee(); }} className="glass rounded-xl p-8 space-y-6">
          {/* Source Account */}
          <div className="space-y-2">
            <Label>Source Account</Label>
            <Select
              value={formData.sourceAccount}
              onValueChange={(v) => setFormData({ ...formData, sourceAccount: v, sourceAsset: '', amount: '' })}
              disabled={loadingAccounts}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={loadingAccounts ? 'Loading...' : 'Select account'} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.nickname || `Account ${account.paxos_account_id.slice(0, 8)}...`}
                  </SelectItem>
                ))}
                {accounts.length === 0 && !loadingAccounts && (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No accounts found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Convert First Option */}
          {formData.sourceAccount && usdBalance && parseFloat(usdBalance.available?.replace(/,/g, '') || '0') > 0 && (
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50">
              <Checkbox
                id="convertFirst"
                checked={formData.convertFirst}
                onCheckedChange={(checked) => setFormData({ ...formData, convertFirst: !!checked })}
              />
              <div className="flex-1">
                <Label htmlFor="convertFirst" className="cursor-pointer">
                  Convert USD to stablecoin first
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Available: ${usdBalance.available} USD
                </p>
              </div>
            </div>
          )}

          {/* Asset Selection */}
          <div className="space-y-2">
            <Label>Stablecoin to Send</Label>
            <Select
              value={formData.sourceAsset}
              onValueChange={(v) => setFormData({ ...formData, sourceAsset: v, amount: '' })}
              disabled={!formData.sourceAccount || loadingBalances}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={formData.sourceAccount ? loadingBalances ? 'Loading...' : 'Select stablecoin' : 'Select account first'} />
              </SelectTrigger>
              <SelectContent>
                {STABLECOINS.map(coin => {
                  const balance = balances.find((b: AccountBalanceItem) => b.asset === coin);
                  const hasBalance = balance && parseFloat(balance.available?.replace(/,/g, '') || '0') > 0;
                  return (
                    <SelectItem 
                      key={coin} 
                      value={coin}
                      disabled={!formData.convertFirst && !hasBalance}
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-2">
                          <AssetIcon asset={coin} size="sm" />
                          {coin}
                        </div>
                        {balance && (
                          <span className="text-muted-foreground text-xs">
                            {balance.available}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {!formData.convertFirst && formData.sourceAsset && (
              <p className="text-xs text-muted-foreground">
                Available: {balances.find((b: AccountBalanceItem) => b.asset === formData.sourceAsset)?.available || '0'} {formData.sourceAsset}
              </p>
            )}
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label>Destination Wallet</Label>
            <Select
              value={formData.destinationId}
              onValueChange={(v) => setFormData({ ...formData, destinationId: v })}
              disabled={loadingDestinations}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={loadingDestinations ? 'Loading...' : 'Select destination'} />
              </SelectTrigger>
              <SelectContent>
                {destinations.length > 0 ? (
                  destinations.map((dest: CryptoDestinationAddress) => (
                    <SelectItem key={dest.id} value={dest.id}>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span className="font-medium">{dest.nickname || 'Unnamed'}</span>
                        <span className="text-xs text-muted-foreground">
                          ({dest.crypto_network}) {dest.address?.slice(0, 8)}...
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No destination wallets registered. Add one from the Destinations tab.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Amount</Label>
              <button
                type="button"
                onClick={handleSetMax}
                className="text-xs text-primary hover:underline"
              >
                Max
              </button>
            </div>
            <Input
              type="text"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          <Button
            type="submit"
            disabled={calculateFee.isPending || !isValid}
            className="w-full bg-module-payouts hover:bg-module-payouts/90"
          >
            {calculateFee.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Continue
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="glass rounded-xl p-8 space-y-6">
          <h3 className="font-semibold text-foreground text-lg">Confirm Send</h3>

          {/* Warning */}
          <div className="rounded-lg bg-warning/10 border border-warning/20 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Review carefully</p>
              <p className="text-muted-foreground mt-1">
                This transaction cannot be reversed. Make sure the destination address is correct.
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            {formData.convertFirst && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Convert from</span>
                  <span className="text-foreground font-medium">${formData.amount} USD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Convert to</span>
                  <span className="text-foreground font-medium">{formData.amount} {formData.sourceAsset}</span>
                </div>
                <div className="border-t border-border my-2" />
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Send amount</span>
              <span className="text-foreground font-medium">{formData.amount} {formData.sourceAsset}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="text-foreground font-medium">{selectedDestination?.crypto_network}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Destination</span>
              <span className="text-foreground font-mono text-xs">
                {selectedDestination?.address?.slice(0, 12)}...{selectedDestination?.address?.slice(-8)}
              </span>
            </div>
            {feeData && (
              <>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network fee</span>
                  <span className="text-foreground">{feeData.fee} {feeData.fee_asset}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{feeData.estimated_total} {formData.sourceAsset}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setShowConfirmation(false); setFeeData(null); }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={withdrawAssets.isPending || convertAssets.isPending}
              className="flex-1 bg-module-payouts hover:bg-module-payouts/90"
            >
              {withdrawAssets.isPending || convertAssets.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm & Send
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendCrypto;