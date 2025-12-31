import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, Loader2, Wallet, Layers, Scale, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
import { useCryptoAddresses } from '@/hooks/useCrypto';
import { useWithdrawAssets } from '@/hooks/useAssets';
import { PaxosAccount, CryptoAddress, CryptoNetwork } from '@/api/types';

const NETWORKS = [
  { value: 'ETHEREUM', label: 'Ethereum' },
  { value: 'POLYGON', label: 'Polygon' },
  { value: 'SOLANA', label: 'Solana' },
  { value: 'BASE', label: 'Base' },
];

const TreasuryTransfers: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transfer');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [asset, setAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('');
  
  // Sweep/Rebalance state
  const [sweepTargetId, setSweepTargetId] = useState('');
  const [sweepAsset, setSweepAsset] = useState('');

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'TREASURY' });
  const { data: sourceBalancesResponse, isLoading: loadingSourceBalances } = useAccountBalances(sourceAccountId);
  const { data: targetAddressesResponse } = useCryptoAddresses(
    targetAccountId ? { account_id: targetAccountId } : undefined
  );
  
  const withdrawAssets = useWithdrawAssets();

  const accounts = accountsResponse?.data || [];
  const sourceBalances = Array.isArray(sourceBalancesResponse?.data?.items) ? sourceBalancesResponse.data.items : [];
  const targetAddresses = targetAddressesResponse?.data || [];

  const sourceAccount = accounts.find((a: PaxosAccount) => a.id === sourceAccountId);
  const targetAccount = accounts.find((a: PaxosAccount) => a.id === targetAccountId);
  const selectedBalance = sourceBalances.find((b: { asset: string }) => b.asset === asset);

  // Find deposit address for target account matching asset/network
  const targetDepositAddress = useMemo(() => {
    return targetAddresses.find((addr: CryptoAddress) => 
      addr.source_asset === asset && addr.network === network
    );
  }, [targetAddresses, asset, network]);

  // Calculate aggregate balances for sweep/rebalance
  const aggregateBalances = useMemo(() => {
    // This would ideally fetch all account balances, but for now we use available data
    const balanceMap: Record<string, { total: number; accounts: { id: string; nickname: string; balance: number }[] }> = {};
    
    // In a real implementation, we'd aggregate across all accounts
    sourceBalances.forEach((b: { asset: string; available: string }) => {
      if (!balanceMap[b.asset]) {
        balanceMap[b.asset] = { total: 0, accounts: [] };
      }
      const available = parseFloat(b.available || '0');
      balanceMap[b.asset].total += available;
      balanceMap[b.asset].accounts.push({
        id: sourceAccountId,
        nickname: sourceAccount?.nickname || 'Account',
        balance: available
      });
    });

    return balanceMap;
  }, [sourceBalances, sourceAccountId, sourceAccount]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceAccountId || !targetAccountId || !asset || !amount || !network) {
      toast.error('Please fill all required fields');
      return;
    }

    if (sourceAccountId === targetAccountId) {
      toast.error('Source and target accounts must be different');
      return;
    }

    if (!targetDepositAddress) {
      toast.error('Target account has no deposit address for this asset/network. Create one first.');
      return;
    }

    try {
      await withdrawAssets.mutateAsync({
        account_id: sourceAccountId,
        source_asset: asset,
        destination_asset: asset,
        destination_address: targetDepositAddress.wallet_address,
        amount,
        network: network as CryptoNetwork,
      });

      toast.success('Transfer initiated successfully');
      setAmount('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate transfer');
    }
  };

  const handleSweep = async () => {
    if (!sweepTargetId || !sweepAsset) {
      toast.error('Select target account and asset');
      return;
    }

    // In production, this would sweep from all accounts to target
    toast.info('Sweep functionality requires batch operations - implementing single transfer for demo');
    
    // For now, transfer from source to target
    if (sourceAccountId && sourceAccountId !== sweepTargetId && targetDepositAddress) {
      try {
        const balance = aggregateBalances[sweepAsset];
        if (balance && balance.total > 0) {
          await withdrawAssets.mutateAsync({
            account_id: sourceAccountId,
            source_asset: sweepAsset,
            destination_asset: sweepAsset,
            destination_address: targetDepositAddress.wallet_address,
            amount: balance.total.toString(),
            network: (network || 'ETHEREUM') as CryptoNetwork,
          });
          toast.success('Sweep transfer initiated');
        }
      } catch (error) {
        toast.error('Failed to sweep');
      }
    }
  };

  const handleRebalance = async () => {
    if (!sweepAsset || accounts.length < 2) {
      toast.error('Need at least 2 accounts and an asset selected');
      return;
    }

    // Calculate target balance per account
    const totalBalance = aggregateBalances[sweepAsset]?.total || 0;
    const targetPerAccount = totalBalance / accounts.length;

    toast.info(`Rebalancing ${sweepAsset}: ${targetPerAccount.toFixed(2)} per account (${accounts.length} accounts)`);
    
    // In production, this would execute multiple transfers to balance accounts
    // For now, just show the calculation
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
        <div>
          <h2 className="text-2xl font-bold text-foreground">Treasury Transfers</h2>
          <p className="text-muted-foreground">Move assets between accounts</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-secondary/50 p-1">
          <TabsTrigger value="transfer" className="data-[state=active]:bg-module-treasury data-[state=active]:text-white">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Inter-Account Transfer
          </TabsTrigger>
          <TabsTrigger value="sweep" className="data-[state=active]:bg-module-treasury data-[state=active]:text-white">
            <Layers className="h-4 w-4 mr-2" />
            Sweep
          </TabsTrigger>
          <TabsTrigger value="rebalance" className="data-[state=active]:bg-module-treasury data-[state=active]:text-white">
            <Scale className="h-4 w-4 mr-2" />
            Rebalance
          </TabsTrigger>
        </TabsList>

        {/* Inter-Account Transfer */}
        <TabsContent value="transfer" className="mt-6">
          <form onSubmit={handleTransfer}>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Transfer Between Accounts</CardTitle>
                <CardDescription>
                  Move assets from one treasury account to another via on-chain withdrawal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Source Account */}
                  <div className="space-y-2">
                    <Label>Source Account</Label>
                    <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account: PaxosAccount) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              {account.nickname || `Account ${account.id.slice(0, 8)}`}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Account */}
                  <div className="space-y-2">
                    <Label>Target Account</Label>
                    <Select value={targetAccountId} onValueChange={setTargetAccountId}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.filter((a: PaxosAccount) => a.id !== sourceAccountId).map((account: PaxosAccount) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              {account.nickname || `Account ${account.id.slice(0, 8)}`}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Asset */}
                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <Select 
                      value={asset} 
                      onValueChange={setAsset}
                      disabled={!sourceAccountId || loadingSourceBalances}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder={sourceAccountId ? 'Select asset' : 'Select source first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceBalances.map((balance: { asset: string; available: string }) => (
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
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Network */}
                  <div className="space-y-2">
                    <Label>Network</Label>
                    <Select value={network} onValueChange={setNetwork}>
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

                {/* Warning if no target deposit address */}
                {targetAccountId && asset && network && !targetDepositAddress && (
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning">No Deposit Address</p>
                        <p className="text-sm text-muted-foreground">
                          Target account doesn't have a deposit address for {asset} on {network}. 
                          Create one in the Accounts tab first.
                        </p>
                      </div>
                    </div>
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
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={withdrawAssets.isPending || !amount || !asset || !network || !sourceAccountId || !targetAccountId || !targetDepositAddress}
                  className="w-full bg-module-treasury hover:bg-module-treasury/90"
                >
                  {withdrawAssets.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Transfer
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Sweep */}
        <TabsContent value="sweep" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Sweep Funds</CardTitle>
              <CardDescription>
                Consolidate all funds of a specific asset into a single target account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Target Account (receive all funds)</Label>
                  <Select value={sweepTargetId} onValueChange={setSweepTargetId}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select target account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account: PaxosAccount) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            {account.nickname || `Account ${account.id.slice(0, 8)}`}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Asset to Sweep</Label>
                  <Select value={sweepAsset} onValueChange={setSweepAsset}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {['USDC', 'USDT', 'USDP', 'ETH', 'BTC'].map((a) => (
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
              </div>

              {/* Preview */}
              {sweepAsset && aggregateBalances[sweepAsset] && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Sweep Preview</p>
                  <p className="text-lg font-semibold text-foreground">
                    Total: {aggregateBalances[sweepAsset].total.toLocaleString()} {sweepAsset}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From {aggregateBalances[sweepAsset].accounts.length} account(s) → Target
                  </p>
                </div>
              )}

              <Button
                onClick={handleSweep}
                disabled={withdrawAssets.isPending || !sweepTargetId || !sweepAsset}
                className="w-full bg-module-treasury hover:bg-module-treasury/90"
              >
                <Layers className="h-4 w-4 mr-2" />
                Execute Sweep
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rebalance */}
        <TabsContent value="rebalance" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Rebalance Accounts</CardTitle>
              <CardDescription>
                Distribute an asset equally across all treasury accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Asset to Rebalance</Label>
                <Select value={sweepAsset} onValueChange={setSweepAsset}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {['USDC', 'USDT', 'USDP', 'ETH', 'BTC'].map((a) => (
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

              {/* Preview */}
              {sweepAsset && aggregateBalances[sweepAsset] && accounts.length > 0 && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Rebalance Preview</p>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Total {sweepAsset}</span>
                      <span className="font-semibold text-foreground">
                        {aggregateBalances[sweepAsset].total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Number of accounts</span>
                      <span className="font-semibold text-foreground">{accounts.length}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm text-foreground">Target per account</span>
                      <span className="font-semibold text-module-treasury">
                        {(aggregateBalances[sweepAsset].total / accounts.length).toLocaleString(undefined, { maximumFractionDigits: 2 })} {sweepAsset}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleRebalance}
                disabled={withdrawAssets.isPending || !sweepAsset || accounts.length < 2}
                className="w-full bg-module-treasury hover:bg-module-treasury/90"
              >
                <Scale className="h-4 w-4 mr-2" />
                Execute Rebalance
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreasuryTransfers;
