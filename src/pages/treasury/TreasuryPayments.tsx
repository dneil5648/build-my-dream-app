import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, RefreshCw, Wallet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { toast } from 'sonner';
import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
import { useCryptoDestinationAddresses, useCalculateWithdrawalFee } from '@/hooks/useCrypto';
import { useWithdrawAssets, useConvertAssets } from '@/hooks/useAssets';
import { CryptoNetwork, CryptoDestinationAddress } from '@/api/types';

const NETWORKS = [
  { value: 'ETHEREUM', label: 'Ethereum' },
  { value: 'POLYGON', label: 'Polygon' },
  { value: 'SOLANA', label: 'Solana' },
  { value: 'BASE', label: 'Base' },
  { value: 'BITCOIN', label: 'Bitcoin' },
  { value: 'ARBITRUM', label: 'Arbitrum' },
  { value: 'OPTIMISM', label: 'Optimism' },
];

const TreasuryPayments: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState('');
  const [asset, setAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('');
  const [convertFirst, setConvertFirst] = useState(false);
  const [targetAsset, setTargetAsset] = useState('');
  const [fee, setFee] = useState<string | null>(null);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'TREASURY' });
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const { data: destinationsResponse, isLoading: loadingDestinations } = useCryptoDestinationAddresses();
  
  const calculateFee = useCalculateWithdrawalFee();
  const withdrawAssets = useWithdrawAssets();
  const convertAssets = useConvertAssets();

  const accounts = accountsResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  const destinations = destinationsResponse?.data || [];

  const selectedDestination = destinations.find((d: CryptoDestinationAddress) => d.id === destinationId);
  const selectedBalance = balances.find((b: { asset: string }) => b.asset === asset);

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Calculate fee when params change
  useEffect(() => {
    if (selectedAccountId && asset && network && amount && selectedDestination) {
      calculateFee.mutateAsync({
        asset: convertFirst && targetAsset ? targetAsset : asset,
        crypto_network: network,
        amount,
        destination_address: selectedDestination.address,
      }).then(result => {
        if (result.success && result.data) {
          setFee(result.data.fee);
        }
      }).catch(() => {
        setFee(null);
      });
    }
  }, [selectedAccountId, asset, network, amount, selectedDestination, convertFirst, targetAsset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccountId || !asset || !amount || !network || !selectedDestination) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      // If conversion is needed first
      if (convertFirst && targetAsset && targetAsset !== asset) {
        await convertAssets.mutateAsync({
          account_id: selectedAccountId,
          source_asset: asset,
          destination_asset: targetAsset,
          amount,
        });
        toast.success(`Converted ${amount} ${asset} to ${targetAsset}`);
      }

      // Execute withdrawal
      await withdrawAssets.mutateAsync({
        account_id: selectedAccountId,
        source_asset: convertFirst && targetAsset ? targetAsset : asset,
        destination_asset: convertFirst && targetAsset ? targetAsset : asset,
        destination_address: selectedDestination.address,
        amount,
        network: network as CryptoNetwork,
      });

      toast.success('Payment sent successfully');
      
      // Reset form
      setAmount('');
      setFee(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send payment');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/treasury">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Send Payment</h2>
          <p className="text-muted-foreground">Send crypto to external destinations</p>
        </div>
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          isLoading={loadingAccounts}
          label="Account"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Configure your outbound payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Destination */}
            <div className="space-y-2">
              <Label>Destination Wallet</Label>
              <Select value={destinationId} onValueChange={setDestinationId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((dest: CryptoDestinationAddress) => (
                    <SelectItem key={dest.id} value={dest.id}>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span>{dest.nickname || dest.address.slice(0, 12) + '...'}</span>
                        <span className="text-xs text-muted-foreground">({dest.crypto_network})</span>
                      </div>
                    </SelectItem>
                  ))}
                  {destinations.length === 0 && (
                    <SelectItem value="" disabled>No destinations registered</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedDestination && (
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedDestination.address}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Asset */}
              <div className="space-y-2">
                <Label>Asset to Send</Label>
                <Select 
                  value={asset} 
                  onValueChange={(v) => { setAsset(v); setFee(null); }}
                  disabled={!selectedAccountId || loadingBalances}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder={selectedAccountId ? 'Select asset' : 'Select account first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {balances.map((balance: { asset: string; available: string }) => (
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
                    {balances.length === 0 && selectedAccountId && (
                      <SelectItem value="" disabled>No assets available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Network */}
              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={network} onValueChange={(v) => { setNetwork(v); setFee(null); }}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORKS.map((n) => (
                      <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Convert First Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="convert-first" className="text-base font-medium">Convert before sending</Label>
                <p className="text-sm text-muted-foreground">Convert to a different asset before payment</p>
              </div>
              <Switch
                id="convert-first"
                checked={convertFirst}
                onCheckedChange={setConvertFirst}
              />
            </div>

            {/* Target Asset (if converting) */}
            {convertFirst && (
              <div className="space-y-2">
                <Label>Convert To</Label>
                <Select value={targetAsset} onValueChange={setTargetAsset}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select target asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {['USDC', 'USDT', 'USDP', 'ETH', 'BTC'].filter(a => a !== asset).map((a) => (
                      <SelectItem key={a} value={a}>
                        <div className="flex items-center gap-2">
                          <AssetIcon asset={a} size="sm" />
                          {a}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                onChange={(e) => { setAmount(e.target.value); setFee(null); }}
                className="bg-secondary border-border"
              />
            </div>

            {/* Fee Estimate */}
            {fee && network && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning">Network Fee</p>
                    <p className="text-sm text-muted-foreground">
                      Estimated: {fee} {convertFirst && targetAsset ? targetAsset : asset}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary & Submit */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You send</span>
                <span className="font-medium text-foreground">{amount || '0'} {asset || '-'}</span>
              </div>
              {convertFirst && targetAsset && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Converted to</span>
                  <span className="font-medium text-foreground">{amount || '0'} {targetAsset}</span>
                </div>
              )}
              {fee && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network fee</span>
                  <span className="font-medium text-foreground">~{fee} {convertFirst && targetAsset ? targetAsset : asset}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Recipient gets</span>
                <span className="font-semibold text-foreground">
                  ~{amount && fee ? (parseFloat(amount) - parseFloat(fee)).toFixed(6) : amount || '0'} {convertFirst && targetAsset ? targetAsset : asset || '-'}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={withdrawAssets.isPending || convertAssets.isPending || !amount || !asset || !network || !destinationId}
              className="w-full bg-module-treasury hover:bg-module-treasury/90"
            >
              {withdrawAssets.isPending || convertAssets.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Payment
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default TreasuryPayments;
