import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, Loader2, Wallet, Layers, Scale, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useAccounts, useAllAccountsBalances } from '@/hooks/useAccounts';
import { useCryptoAddresses } from '@/hooks/useCrypto';
import { useWithdrawAssets } from '@/hooks/useAssets';
import { PaxosAccount, CryptoAddress, CryptoNetwork, AccountBalanceItem } from '@/api/types';

const NETWORKS = [
  { value: 'ETHEREUM', label: 'Ethereum' },
  { value: 'POLYGON', label: 'Polygon' },
  { value: 'SOLANA', label: 'Solana' },
  { value: 'BASE', label: 'Base' },
];

const TREASURY_ASSETS = ['USDG', 'USDT', 'USDC', 'PYUSD', 'USDP'];

interface RebalanceTarget {
  accountId: string;
  targetAmount: string;
}

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
  
  // Rebalance specific state
  const [rebalanceParentId, setRebalanceParentId] = useState('');
  const [rebalanceAsset, setRebalanceAsset] = useState('');
  const [rebalanceNetwork, setRebalanceNetwork] = useState('ETHEREUM');
  const [rebalanceTargets, setRebalanceTargets] = useState<RebalanceTarget[]>([]);
  const [isRebalancing, setIsRebalancing] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'TREASURY' });
  const accounts: PaxosAccount[] = accountsResponse?.data || [];
  
  // Fetch all account balances for rebalancing
  const { allBalances, isLoading: loadingAllBalances } = useAllAccountsBalances(accounts);
  
  // Build per-account balance map for the selected rebalance asset
  const accountBalanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    allBalances.forEach((b: AccountBalanceItem) => {
      if (b.asset === rebalanceAsset && b.account_id) {
        map[b.account_id] = (map[b.account_id] || 0) + parseFloat(b.available || '0');
      }
    });
    return map;
  }, [allBalances, rebalanceAsset]);
  
  // Child accounts (all except parent)
  const childAccounts = useMemo(() => {
    return accounts.filter(a => a.id !== rebalanceParentId);
  }, [accounts, rebalanceParentId]);
  
  // Initialize rebalance targets when child accounts change - default to current balance
  const initializeRebalanceTargets = useCallback(() => {
    setRebalanceTargets(childAccounts.map(a => ({ 
      accountId: a.id, 
      targetAmount: (accountBalanceMap[a.id] || 0).toString() 
    })));
  }, [childAccounts, accountBalanceMap]);
  
  // Fetch deposit addresses for all accounts (needed for rebalancing)
  const { data: allAddressesResponse } = useCryptoAddresses({ module: 'TREASURY' });
  const allDepositAddresses: CryptoAddress[] = allAddressesResponse?.data || [];
  
  const { data: targetAddressesResponse } = useCryptoAddresses(
    targetAccountId ? { account_id: targetAccountId } : undefined
  );
  
  const withdrawAssets = useWithdrawAssets();

  // For transfer tab - get source balances from allBalances
  const sourceBalances = useMemo(() => {
    return allBalances.filter((b: AccountBalanceItem) => b.account_id === sourceAccountId);
  }, [allBalances, sourceAccountId]);
  
  const targetAddresses = targetAddressesResponse?.data || [];

  const sourceAccount = accounts.find((a: PaxosAccount) => a.id === sourceAccountId);
  const selectedBalance = sourceBalances.find((b: AccountBalanceItem) => b.asset === asset);

  // Find deposit address for target account matching asset/network
  const targetDepositAddress = useMemo(() => {
    return targetAddresses.find((addr: CryptoAddress) => 
      addr.source_asset === asset && addr.network === network
    );
  }, [targetAddresses, asset, network]);

  // Calculate aggregate balances for sweep
  const aggregateBalances = useMemo(() => {
    const balanceMap: Record<string, { total: number; accounts: { id: string; nickname: string; balance: number }[] }> = {};
    
    allBalances.forEach((b: AccountBalanceItem) => {
      if (!balanceMap[b.asset]) {
        balanceMap[b.asset] = { total: 0, accounts: [] };
      }
      const available = parseFloat(b.available || '0');
      balanceMap[b.asset].total += available;
      const account = accounts.find(a => a.id === b.account_id);
      balanceMap[b.asset].accounts.push({
        id: b.account_id || '',
        nickname: account?.nickname || 'Account',
        balance: available
      });
    });

    return balanceMap;
  }, [allBalances, accounts]);

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

  // Calculate rebalance withdrawals
  const rebalanceWithdrawals = useMemo(() => {
    if (!rebalanceParentId || !rebalanceAsset || rebalanceTargets.length === 0) return [];
    
    const withdrawals: Array<{
      fromAccountId: string;
      fromNickname: string;
      toAccountId: string;
      toNickname: string;
      amount: number;
    }> = [];
    
    // Calculate surpluses and deficits
    const accountStates: Array<{
      accountId: string;
      nickname: string;
      currentBalance: number;
      targetAmount: number;
      delta: number; // positive = surplus, negative = deficit
    }> = [];
    
    // Add child accounts with their targets
    rebalanceTargets.forEach(target => {
      const account = accounts.find(a => a.id === target.accountId);
      const currentBalance = accountBalanceMap[target.accountId] || 0;
      const targetAmount = parseFloat(target.targetAmount) || 0;
      accountStates.push({
        accountId: target.accountId,
        nickname: account?.nickname || 'Account',
        currentBalance,
        targetAmount,
        delta: currentBalance - targetAmount
      });
    });
    
    // Add parent account (absorbs all excess)
    const parentAccount = accounts.find(a => a.id === rebalanceParentId);
    const parentBalance = accountBalanceMap[rebalanceParentId] || 0;
    
    // Separate accounts with surplus and deficit
    const surplusAccounts = accountStates.filter(a => a.delta > 0);
    const deficitAccounts = accountStates.filter(a => a.delta < 0);
    
    // First: move from surplus accounts to deficit accounts
    for (const deficit of deficitAccounts) {
      let remaining = Math.abs(deficit.delta);
      
      for (const surplus of surplusAccounts) {
        if (remaining <= 0 || surplus.delta <= 0) continue;
        
        const transferAmount = Math.min(surplus.delta, remaining);
        if (transferAmount > 0) {
          withdrawals.push({
            fromAccountId: surplus.accountId,
            fromNickname: surplus.nickname,
            toAccountId: deficit.accountId,
            toNickname: deficit.nickname,
            amount: transferAmount
          });
          surplus.delta -= transferAmount;
          remaining -= transferAmount;
        }
      }
      
      // If still in deficit, take from parent
      if (remaining > 0 && parentBalance >= remaining) {
        withdrawals.push({
          fromAccountId: rebalanceParentId,
          fromNickname: parentAccount?.nickname || 'Parent Account',
          toAccountId: deficit.accountId,
          toNickname: deficit.nickname,
          amount: remaining
        });
      }
    }
    
    // Second: sweep remaining surplus to parent
    for (const surplus of surplusAccounts) {
      if (surplus.delta > 0) {
        withdrawals.push({
          fromAccountId: surplus.accountId,
          fromNickname: surplus.nickname,
          toAccountId: rebalanceParentId,
          toNickname: parentAccount?.nickname || 'Parent Account',
          amount: surplus.delta
        });
      }
    }
    
    return withdrawals;
  }, [rebalanceParentId, rebalanceAsset, rebalanceTargets, accounts, accountBalanceMap]);

  const handleRebalance = async () => {
    if (!rebalanceParentId || !rebalanceAsset || !rebalanceNetwork) {
      toast.error('Select parent account, asset, and network');
      return;
    }
    
    if (rebalanceWithdrawals.length === 0) {
      toast.info('No rebalancing needed - all accounts are at target');
      return;
    }
    
    setIsRebalancing(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const withdrawal of rebalanceWithdrawals) {
        // Find deposit address for target account (map internal id to paxos_account_id)
        const targetAccount = accounts.find(a => a.id === withdrawal.toAccountId);
        const targetPaxosAccountId = targetAccount?.paxos_account_id;
        
        const targetDepositAddr = allDepositAddresses.find(
          addr => addr.paxos_account_id === targetPaxosAccountId && 
                  addr.source_asset === rebalanceAsset && 
                  addr.network === rebalanceNetwork
        );
        
        if (!targetDepositAddr) {
          toast.error(`No deposit address for ${withdrawal.toNickname} on ${rebalanceNetwork}`);
          errorCount++;
          continue;
        }
        
        try {
          await withdrawAssets.mutateAsync({
            account_id: withdrawal.fromAccountId,
            source_asset: rebalanceAsset,
            destination_asset: rebalanceAsset,
            destination_address: targetDepositAddr.wallet_address,
            amount: withdrawal.amount.toString(),
            network: rebalanceNetwork as CryptoNetwork,
          });
          successCount++;
        } catch (err) {
          errorCount++;
          toast.error(`Failed: ${withdrawal.fromNickname} → ${withdrawal.toNickname}`);
        }
      }
      
      if (successCount > 0) {
        toast.success(`Rebalance complete: ${successCount} transfers executed`);
      }
      if (errorCount > 0) {
        toast.warning(`${errorCount} transfers failed`);
      }
    } catch (error) {
      toast.error('Rebalance failed');
    } finally {
      setIsRebalancing(false);
    }
  };
  
  const updateTargetAmount = (accountId: string, amount: string) => {
    setRebalanceTargets(prev => 
      prev.map(t => t.accountId === accountId ? { ...t, targetAmount: amount } : t)
    );
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
                      disabled={!sourceAccountId || loadingAllBalances}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder={sourceAccountId ? 'Select asset' : 'Select source first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceBalances.map((balance: AccountBalanceItem) => (
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
                Set target amounts for child accounts. Extra funds sweep to the parent account, deficits pull from surplus accounts or parent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Parent Account */}
                <div className="space-y-2">
                  <Label>Parent Account (receives excess funds)</Label>
                  <Select 
                    value={rebalanceParentId} 
                    onValueChange={(id) => {
                      setRebalanceParentId(id);
                      // Reset targets when parent changes
                      setTimeout(initializeRebalanceTargets, 0);
                    }}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select parent account" />
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

                {/* Asset to Rebalance */}
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <Select value={rebalanceAsset} onValueChange={setRebalanceAsset}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {TREASURY_ASSETS.map((a) => (
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

              {/* Network */}
              <div className="space-y-2">
                <Label>Network (for withdrawals)</Label>
                <Select value={rebalanceNetwork} onValueChange={setRebalanceNetwork}>
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

              {/* Child Account Targets */}
              {rebalanceParentId && childAccounts.length > 0 && (
                <div className="space-y-4">
                  <Label>Target Amounts per Child Account</Label>
                  <div className="space-y-3">
                    {childAccounts.map((account) => {
                      const target = rebalanceTargets.find(t => t.accountId === account.id);
                      const currentBalance = accountBalanceMap[account.id] || 0;
                      return (
                        <div key={account.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-foreground truncate">
                                {account.nickname || `Account ${account.id.slice(0, 8)}`}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Current: {currentBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {rebalanceAsset || '—'}
                            </p>
                          </div>
                          <div className="w-32">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={target?.targetAmount || ''}
                              onChange={(e) => updateTargetAmount(account.id, e.target.value)}
                              className="bg-background border-border text-right"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Parent Account Balance */}
              {rebalanceParentId && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {accounts.find(a => a.id === rebalanceParentId)?.nickname || 'Parent'}
                      </span>
                      <span className="text-xs text-muted-foreground">(Parent)</span>
                    </div>
                    <span className="text-sm text-foreground">
                      {(accountBalanceMap[rebalanceParentId] || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} {rebalanceAsset || '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Rebalance Preview */}
              {rebalanceWithdrawals.length > 0 && (
                <div className="space-y-3">
                  <Label>Planned Withdrawals</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {rebalanceWithdrawals.map((w, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded bg-secondary/50 border border-border text-sm">
                        <span className="text-foreground truncate">{w.fromNickname}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground truncate">{w.toNickname}</span>
                        <span className="ml-auto font-mono text-module-treasury">
                          {w.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleRebalance}
                disabled={isRebalancing || !rebalanceParentId || !rebalanceAsset || !rebalanceNetwork || accounts.length < 2}
                className="w-full bg-module-treasury hover:bg-module-treasury/90"
              >
                {isRebalancing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rebalancing...
                  </>
                ) : (
                  <>
                    <Scale className="h-4 w-4 mr-2" />
                    Execute Rebalance ({rebalanceWithdrawals.length} transfers)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreasuryTransfers;
