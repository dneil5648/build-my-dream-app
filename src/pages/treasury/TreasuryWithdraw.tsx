import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpFromLine, AlertTriangle, Loader2, Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { CreateDestinationAddressForm } from '@/components/shared/CreateDestinationAddressForm';
import { toast } from 'sonner';
import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
import { useCryptoDestinationAddresses, useCreateCryptoDestinationAddress } from '@/hooks/useCrypto';
import { useWithdrawAssets } from '@/hooks/useAssets';
import { CryptoNetwork, CryptoDestinationAddress, CreateCryptoDestinationAddressRequest, PaxosAccount } from '@/api/types';

const NETWORKS = [
  { value: 'ETHEREUM', label: 'Ethereum' },
  { value: 'POLYGON', label: 'Polygon' },
  { value: 'SOLANA', label: 'Solana' },
  { value: 'BASE', label: 'Base' },
  { value: 'BITCOIN', label: 'Bitcoin' },
];

const TreasuryWithdraw: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [asset, setAsset] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('');
  const [showCreateDestination, setShowCreateDestination] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'TREASURY' });
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(selectedAccountId || '');
  const { data: destinationsResponse, isLoading: loadingDestinations } = useCryptoDestinationAddresses();
  const withdrawAssets = useWithdrawAssets();
  const createDestinationAddress = useCreateCryptoDestinationAddress();

  const accounts = accountsResponse?.data || [];
  const balances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  const destinations = destinationsResponse?.data || [];

  const selectedBalance = balances.find((b: { asset: string }) => b.asset === asset);
  const selectedDestination = destinations.find((d: CryptoDestinationAddress) => d.id === destinationId);
  
  // Filter destinations by network
  const filteredDestinations = network 
    ? destinations.filter((d: CryptoDestinationAddress) => d.crypto_network === network)
    : destinations;

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleCreateDestination = async (data: CreateCryptoDestinationAddressRequest) => {
    try {
      await createDestinationAddress.mutateAsync(data);
      toast.success('Destination registered');
      setShowCreateDestination(false);
    } catch (error) {
      toast.error('Failed to register destination');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccountId || !asset || !destinationId || !amount || !network) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedDestination) {
      toast.error('Invalid destination selected');
      return;
    }

    try {
      await withdrawAssets.mutateAsync({
        account_id: selectedAccountId,
        source_asset: asset,
        destination_asset: asset,
        destination_address: selectedDestination.address,
        amount,
        network: network as CryptoNetwork,
      });
      toast.success('Withdrawal initiated successfully');
      setAsset('');
      setDestinationId('');
      setAmount('');
      setNetwork('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate withdrawal');
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
          <h2 className="text-2xl font-bold text-foreground">Crypto Payout</h2>
          <p className="text-muted-foreground">Withdraw crypto to an external wallet</p>
        </div>
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          isLoading={loadingAccounts}
          label="Account"
        />
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Send Crypto</CardTitle>
            <CardDescription>Withdraw to a registered destination address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Asset Selection */}
            <div className="space-y-2">
              <Label>Asset</Label>
              <Select
                value={asset}
                onValueChange={(v) => { setAsset(v); setNetwork(''); setDestinationId(''); }}
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

            {/* Network Selection */}
            <div className="space-y-2">
              <Label>Network</Label>
              <Select value={network} onValueChange={(v) => { setNetwork(v); setDestinationId(''); }}>
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

            {/* Destination Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Destination Wallet</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs text-module-treasury"
                  onClick={() => setShowCreateDestination(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add New
                </Button>
              </div>
              <Select value={destinationId} onValueChange={setDestinationId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDestinations.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No destinations registered{network ? ` for ${network}` : ''}
                    </div>
                  ) : (
                    filteredDestinations.map((dest: CryptoDestinationAddress) => (
                      <SelectItem key={dest.id} value={dest.id}>
                        <div className="flex flex-col">
                          <span>{dest.nickname || 'Unnamed'}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {dest.address.slice(0, 10)}...{dest.address.slice(-8)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Amount</Label>
                {asset && selectedBalance && (
                  <button
                    type="button"
                    className="text-xs text-module-treasury hover:underline"
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

            {/* Warning */}
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">Verify Before Sending</p>
                  <p className="text-sm text-muted-foreground">
                    Crypto transactions are irreversible. Always double-check the destination address.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={withdrawAssets.isPending || !amount || !destinationId || !network || !asset}
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
                  Send
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Create Destination Dialog */}
      <Dialog open={showCreateDestination} onOpenChange={setShowCreateDestination}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Register Destination Wallet</DialogTitle>
          </DialogHeader>
          <CreateDestinationAddressForm
            accounts={accounts}
            onSubmit={handleCreateDestination}
            isLoading={createDestinationAddress.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreasuryWithdraw;
