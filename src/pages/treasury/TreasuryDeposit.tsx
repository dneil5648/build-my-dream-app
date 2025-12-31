import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, QrCode, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { toast } from 'sonner';
import { useCreateCryptoAddress } from '@/hooks/useCrypto';
import { useAccounts } from '@/hooks/useAccounts';
import { CryptoNetwork, PaxosAccount } from '@/api/types';

const NETWORKS = [
  { value: 'ETHEREUM', label: 'Ethereum', assets: ['ETH', 'USDC', 'USDT', 'USDP', 'PYUSD', 'USDG'] },
  { value: 'POLYGON', label: 'Polygon', assets: ['USDC', 'USDG'] },
  { value: 'SOLANA', label: 'Solana', assets: ['SOL', 'USDC', 'PYUSD', 'USDG'] },
  { value: 'BASE', label: 'Base', assets: ['USDC', 'USDG'] },
  { value: 'BITCOIN', label: 'Bitcoin', assets: ['BTC'] },
];

const ALL_ASSETS = ['BTC', 'ETH', 'SOL', 'USDC', 'USDT', 'USDP', 'PYUSD', 'USDG'];

const TreasuryDeposit: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [asset, setAsset] = useState('');
  const [network, setNetwork] = useState('');
  const [generatedAddress, setGeneratedAddress] = useState<{ address: string; id: string } | null>(null);
  
  const createCryptoAddress = useCreateCryptoAddress();
  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'TREASURY' });
  const accounts = accountsResponse?.data || [];

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Get available networks for selected asset
  const availableNetworks = asset 
    ? NETWORKS.filter(n => n.assets.includes(asset))
    : [];

  const handleGenerate = async () => {
    if (!selectedAccountId || !asset || !network) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await createCryptoAddress.mutateAsync({
        account_id: selectedAccountId,
        network: network as CryptoNetwork,
        source_asset: asset,
        destination_asset: asset, // Same asset (no conversion)
      });

      if (result.success && result.data) {
        setGeneratedAddress({
          address: result.data.wallet_address,
          id: result.data.id,
        });
        toast.success('Deposit address created');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create deposit address');
    }
  };

  const copyAddress = () => {
    if (generatedAddress) {
      navigator.clipboard.writeText(generatedAddress.address);
      toast.success('Address copied to clipboard');
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
          <h2 className="text-2xl font-bold text-foreground">Generate Deposit Address</h2>
          <p className="text-muted-foreground">Create a deposit address for crypto on-ramp</p>
        </div>
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={(id) => { setSelectedAccountId(id); setGeneratedAddress(null); }}
          isLoading={loadingAccounts}
          label="Account"
        />
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>New Deposit Address</CardTitle>
          <CardDescription>Select asset and network for your deposit address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Asset</Label>
              <Select value={asset} onValueChange={(v) => { setAsset(v); setNetwork(''); setGeneratedAddress(null); }}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ASSETS.map((a) => (
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
            <div className="space-y-2">
              <Label>Network</Label>
              <Select value={network} onValueChange={(v) => { setNetwork(v); setGeneratedAddress(null); }} disabled={!asset}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder={asset ? 'Select network' : 'Select asset first'} />
                </SelectTrigger>
                <SelectContent>
                  {availableNetworks.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!generatedAddress ? (
            <Button 
              onClick={handleGenerate} 
              disabled={createCryptoAddress.isPending || !selectedAccountId || !asset || !network} 
              className="w-full bg-module-treasury hover:bg-module-treasury/90"
            >
              {createCryptoAddress.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Create Deposit Address
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-6">
              {/* QR Code Placeholder */}
              <div className="flex justify-center">
                <div className="h-48 w-48 bg-secondary rounded-xl flex items-center justify-center border border-border">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
              </div>

              {/* Address */}
              <div className="p-4 rounded-lg bg-secondary border border-module-treasury/30">
                <p className="text-sm text-muted-foreground mb-2">Deposit Address</p>
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-sm text-foreground break-all">{generatedAddress.address}</p>
                  <Button variant="ghost" size="icon" onClick={copyAddress}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 border-border" onClick={() => setGeneratedAddress(null)}>
                  Create New
                </Button>
                <Link to="/app/treasury" className="flex-1">
                  <Button className="w-full bg-module-treasury hover:bg-module-treasury/90">Done</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TreasuryDeposit;
