import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, QrCode, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useCreateCryptoAddress } from '@/hooks/useCrypto';
import { useAccounts } from '@/hooks/useAccounts';
import { CryptoNetwork } from '@/api/types';
import { getWhiteLabelConfig, WhiteLabelConfig } from '@/pages/config/ConfigPage';

// Stablecoins only - per spec
const SUPPORTED_STABLECOINS = [
  { value: 'USDC', label: 'USD Coin', symbol: 'USDC' },
  { value: 'USDT', label: 'Tether', symbol: 'USDT' },
  { value: 'USDP', label: 'Pax Dollar', symbol: 'USDP' },
  { value: 'PYUSD', label: 'PayPal USD', symbol: 'PYUSD' },
  { value: 'USDG', label: 'Global Dollar', symbol: 'USDG' },
  { value: 'DAI', label: 'Dai', symbol: 'DAI' },
];

// Network options per asset
const NETWORK_OPTIONS: Record<string, { value: string; label: string; chain: string }[]> = {
  USDC: [
    { value: 'ETHEREUM', label: 'Ethereum', chain: 'ERC-20' },
    { value: 'SOLANA', label: 'Solana', chain: 'SPL' },
    { value: 'POLYGON', label: 'Polygon', chain: 'Polygon' },
    { value: 'BASE', label: 'Base', chain: 'Base' },
    { value: 'STELLAR', label: 'Stellar', chain: 'Stellar' },
  ],
  USDT: [
    { value: 'ETHEREUM', label: 'Ethereum', chain: 'ERC-20' },
    { value: 'SOLANA', label: 'Solana', chain: 'SPL' },
    { value: 'POLYGON', label: 'Polygon', chain: 'Polygon' },
  ],
  USDP: [
    { value: 'ETHEREUM', label: 'Ethereum', chain: 'ERC-20' },
  ],
  PYUSD: [
    { value: 'ETHEREUM', label: 'Ethereum', chain: 'ERC-20' },
    { value: 'SOLANA', label: 'Solana', chain: 'SPL' },
  ],
  USDG: [
    { value: 'ETHEREUM', label: 'Ethereum', chain: 'ERC-20' },
  ],
  DAI: [
    { value: 'ETHEREUM', label: 'Ethereum', chain: 'ERC-20' },
    { value: 'POLYGON', label: 'Polygon', chain: 'Polygon' },
  ],
};

const WhiteLabelReceive: React.FC = () => {
  const [formData, setFormData] = useState({
    account: '',
    asset: '',
    network: '',
  });
  const [generatedAddress, setGeneratedAddress] = useState<{ address: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig | null>(null);

  const createCryptoAddress = useCreateCryptoAddress();
  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'WHITE_LABEL' });
  const accounts = accountsResponse?.data || [];

  const availableNetworks = formData.asset ? NETWORK_OPTIONS[formData.asset] || [] : [];
  const selectedNetwork = availableNetworks.find(n => n.value === formData.network);

  useEffect(() => {
    const config = getWhiteLabelConfig();
    if (config) {
      setWhiteLabelConfig(config);
    }
  }, []);

  // Get custom asset name from config
  const getAssetDisplayName = (asset: string): string => {
    if (!whiteLabelConfig) return asset;
    const mapping = whiteLabelConfig.assetMappings.find(m => m.assetId === asset);
    return mapping?.customName || asset;
  };

  const handleGenerate = async () => {
    if (!formData.account || !formData.asset || !formData.network) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await createCryptoAddress.mutateAsync({
        account_id: formData.account,
        network: formData.network as CryptoNetwork,
        source_asset: formData.asset,
        destination_asset: formData.asset, // Same asset - no conversion
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
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const walletName = whiteLabelConfig?.walletName || 'My Wallet';
  const displayAssetName = formData.asset ? getAssetDisplayName(formData.asset) : '';
  const assetMapping = whiteLabelConfig?.assetMappings.find(m => m.assetId === formData.asset);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/white-label">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Receive Stablecoins</h2>
          <p className="text-muted-foreground">Generate a deposit address for {walletName}</p>
        </div>
      </div>

      <div className="glass rounded-xl p-8 space-y-6">
        {/* Wallet Selection */}
        <div className="space-y-2">
          <Label>Wallet</Label>
          <Select
            value={formData.account}
            onValueChange={(v) => setFormData({...formData, account: v})}
            disabled={loadingAccounts}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={loadingAccounts ? 'Loading...' : 'Select wallet'} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.paxos_account_id}>
                  <div className="flex items-center gap-2">
                    <span>{account.nickname || `Wallet ${account.paxos_account_id.slice(0, 8)}...`}</span>
                  </div>
                </SelectItem>
              ))}
              {accounts.length === 0 && !loadingAccounts && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No wallets found. Create one first.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Asset Selection */}
        <div className="space-y-2">
          <Label>Stablecoin</Label>
          <Select 
            value={formData.asset} 
            onValueChange={(v) => setFormData({...formData, asset: v, network: ''})}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select stablecoin" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_STABLECOINS.map((coin) => {
                const mapping = whiteLabelConfig?.assetMappings.find(m => m.assetId === coin.value);
                const displayName = mapping?.customName || coin.label;
                
                return (
                  <SelectItem key={coin.value} value={coin.value}>
                    <div className="flex items-center gap-2">
                      {mapping?.customIcon ? (
                        <img src={mapping.customIcon} alt={displayName} className="h-5 w-5 rounded-full" />
                      ) : (
                        <AssetIcon asset={coin.value} size="sm" />
                      )}
                      <span>{displayName}</span>
                      <span className="text-muted-foreground">({coin.symbol})</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Network Selection */}
        <div className="space-y-2">
          <Label>Network</Label>
          {formData.asset ? (
            <Select 
              value={formData.network} 
              onValueChange={(v) => setFormData({...formData, network: v})}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {availableNetworks.map((network) => (
                  <SelectItem key={network.value} value={network.value}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{network.label}</span>
                      <span className="text-xs text-muted-foreground">{network.chain}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-10 px-3 flex items-center rounded-md bg-secondary border border-border text-muted-foreground text-sm">
              Select a stablecoin first
            </div>
          )}
        </div>

        {/* Warning Banner */}
        {formData.asset && formData.network && !generatedAddress && (
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Important</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Only send <strong>{displayAssetName}</strong> on <strong>{selectedNetwork?.label}</strong> to this address. 
                  Sending any other asset or using a different network may result in permanent loss of funds.
                </p>
              </div>
            </div>
          </div>
        )}

        {!generatedAddress ? (
          <Button 
            onClick={handleGenerate} 
            disabled={createCryptoAddress.isPending || !formData.account || !formData.asset || !formData.network} 
            className="w-full bg-module-whitelabel hover:bg-module-whitelabel/90"
          >
            {createCryptoAddress.isPending ? 'Creating...' : 'Generate Deposit Address'}
          </Button>
        ) : (
          <div className="space-y-6">
            {/* Asset + Network Badge */}
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-module-whitelabel/10 border border-module-whitelabel/30">
              {assetMapping?.customIcon ? (
                <img src={assetMapping.customIcon} alt={displayAssetName} className="h-10 w-10 rounded-full" />
              ) : (
                <AssetIcon asset={formData.asset} size="md" />
              )}
              <div className="text-center">
                <p className="font-semibold text-foreground">{displayAssetName}</p>
                <p className="text-sm text-muted-foreground">{selectedNetwork?.label} Network</p>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="flex justify-center">
              <div className="h-48 w-48 bg-white rounded-xl flex items-center justify-center border-4 border-module-whitelabel/20">
                <QrCode className="h-32 w-32 text-foreground" />
              </div>
            </div>

            {/* Address */}
            <div className="p-4 rounded-lg bg-secondary border border-border">
              <p className="text-sm text-muted-foreground mb-2">Deposit Address</p>
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-sm text-foreground break-all flex-1">{generatedAddress.address}</p>
                <Button 
                  variant={copied ? "default" : "outline"} 
                  size="sm" 
                  onClick={copyAddress}
                  className={copied ? "bg-success hover:bg-success/90" : ""}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Final Warning */}
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Only send {displayAssetName} on {selectedNetwork?.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sending any other asset or using a different network will result in permanent loss of funds.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 border-border" 
                onClick={() => {
                  setGeneratedAddress(null);
                  setFormData({ account: formData.account, asset: '', network: '' });
                }}
              >
                Create Another
              </Button>
              <Link to="/app/white-label" className="flex-1">
                <Button className="w-full bg-module-whitelabel hover:bg-module-whitelabel/90">Done</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhiteLabelReceive;