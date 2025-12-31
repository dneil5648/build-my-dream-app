import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpFromLine, AlertTriangle, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
import { useCalculateWithdrawalFee } from '@/hooks/useCrypto';
import { useWithdrawAssets } from '@/hooks/useAssets';
import { CryptoNetwork, AccountBalanceItem } from '@/api/types';
import { getWhiteLabelConfig, WhiteLabelConfig } from '@/pages/config/ConfigPage';

// Stablecoins only
const SUPPORTED_STABLECOINS = ['USDC', 'USDT', 'USDP', 'PYUSD', 'USDG', 'DAI', 'BUSD'];

// Network options per asset - complete list for stablecoin withdrawals
const NETWORK_OPTIONS: Record<string, { value: string; label: string; addressHint: string }[]> = {
  USDC: [
    { value: 'ETHEREUM', label: 'Ethereum', addressHint: 'Starts with 0x' },
    { value: 'SOLANA', label: 'Solana', addressHint: 'Base58 address' },
    { value: 'POLYGON', label: 'Polygon', addressHint: 'Starts with 0x' },
    { value: 'BASE', label: 'Base', addressHint: 'Starts with 0x' },
    { value: 'STELLAR', label: 'Stellar', addressHint: 'Starts with G' },
    { value: 'ARBITRUM', label: 'Arbitrum', addressHint: 'Starts with 0x' },
    { value: 'OPTIMISM', label: 'Optimism', addressHint: 'Starts with 0x' },
    { value: 'AVALANCHE', label: 'Avalanche', addressHint: 'Starts with 0x' },
  ],
  USDT: [
    { value: 'ETHEREUM', label: 'Ethereum', addressHint: 'Starts with 0x' },
    { value: 'SOLANA', label: 'Solana', addressHint: 'Base58 address' },
    { value: 'POLYGON', label: 'Polygon', addressHint: 'Starts with 0x' },
    { value: 'ARBITRUM', label: 'Arbitrum', addressHint: 'Starts with 0x' },
    { value: 'OPTIMISM', label: 'Optimism', addressHint: 'Starts with 0x' },
    { value: 'AVALANCHE', label: 'Avalanche', addressHint: 'Starts with 0x' },
    { value: 'TRON', label: 'Tron', addressHint: 'Starts with T' },
  ],
  USDP: [
    { value: 'ETHEREUM', label: 'Ethereum', addressHint: 'Starts with 0x' },
  ],
  PYUSD: [
    { value: 'ETHEREUM', label: 'Ethereum', addressHint: 'Starts with 0x' },
    { value: 'SOLANA', label: 'Solana', addressHint: 'Base58 address' },
  ],
  USDG: [
    { value: 'ETHEREUM', label: 'Ethereum', addressHint: 'Starts with 0x' },
    { value: 'SOLANA', label: 'Solana', addressHint: 'Base58 address' },
  ],
  DAI: [
    { value: 'ETHEREUM', label: 'Ethereum', addressHint: 'Starts with 0x' },
    { value: 'POLYGON', label: 'Polygon', addressHint: 'Starts with 0x' },
    { value: 'ARBITRUM', label: 'Arbitrum', addressHint: 'Starts with 0x' },
    { value: 'OPTIMISM', label: 'Optimism', addressHint: 'Starts with 0x' },
    { value: 'BASE', label: 'Base', addressHint: 'Starts with 0x' },
  ],
  BUSD: [
    { value: 'ETHEREUM', label: 'Ethereum', addressHint: 'Starts with 0x' },
    { value: 'BSC', label: 'BNB Smart Chain', addressHint: 'Starts with 0x' },
  ],
};

// Address format validation with complete network support
const validateAddress = (address: string, network: string): { valid: boolean; message?: string } => {
  if (!address) return { valid: false, message: 'Address is required' };
  
  // EVM-compatible chains (Ethereum, Polygon, Base, Arbitrum, Optimism, Avalanche, BSC)
  if (['ETHEREUM', 'POLYGON', 'BASE', 'ARBITRUM', 'OPTIMISM', 'AVALANCHE', 'BSC'].includes(network)) {
    if (!address.startsWith('0x') || address.length !== 42) {
      return { valid: false, message: 'Invalid address. Must start with 0x and be 42 characters.' };
    }
  } else if (network === 'SOLANA') {
    if (address.length < 32 || address.length > 44) {
      return { valid: false, message: 'Invalid Solana address. Must be 32-44 characters.' };
    }
  } else if (network === 'STELLAR') {
    if (!address.startsWith('G') || address.length !== 56) {
      return { valid: false, message: 'Invalid Stellar address. Must start with G and be 56 characters.' };
    }
  } else if (network === 'TRON') {
    if (!address.startsWith('T') || address.length !== 34) {
      return { valid: false, message: 'Invalid Tron address. Must start with T and be 34 characters.' };
    }
  }
  
  return { valid: true };
};

const WhiteLabelSend: React.FC = () => {
  const [formData, setFormData] = useState({
    account: '',
    asset: '',
    network: '',
    destination: '',
    amount: '',
  });
  const [fee, setFee] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig | null>(null);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'WHITE_LABEL' });
  const { data: balancesResponse, isLoading: loadingBalances } = useAccountBalances(formData.account);
  const calculateFee = useCalculateWithdrawalFee();
  const withdrawAssets = useWithdrawAssets();

  const accounts = accountsResponse?.data || [];
  const allBalances = Array.isArray(balancesResponse?.data?.items) ? balancesResponse.data.items : [];
  // Filter to only show stablecoins with balance
  const balances = allBalances.filter((b: AccountBalanceItem) => 
    SUPPORTED_STABLECOINS.includes(b.asset) && parseFloat(b.available) > 0
  );

  const availableNetworks = formData.asset ? NETWORK_OPTIONS[formData.asset] || [] : [];
  const selectedNetwork = availableNetworks.find(n => n.value === formData.network);
  const selectedBalance = balances.find((b: AccountBalanceItem) => b.asset === formData.asset);
  const addressValidation = formData.destination && formData.network 
    ? validateAddress(formData.destination, formData.network) 
    : { valid: true };

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

  const handleCalculateFee = async () => {
    if (!formData.account || !formData.asset || !formData.network || !formData.amount || !formData.destination) {
      return;
    }

    if (!addressValidation.valid) {
      toast.error(addressValidation.message);
      return;
    }

    try {
      const result = await calculateFee.mutateAsync({
        asset: formData.asset,
        crypto_network: formData.network,
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

  const handleProceed = () => {
    if (!formData.account || !formData.asset || !formData.destination || !formData.amount || !formData.network) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!addressValidation.valid) {
      toast.error(addressValidation.message);
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      await withdrawAssets.mutateAsync({
        account_id: formData.account,
        source_asset: formData.asset,
        destination_asset: formData.asset, // Same asset - no conversion
        destination_address: formData.destination,
        amount: formData.amount,
        network: formData.network as CryptoNetwork,
      });
      toast.success('Withdrawal initiated successfully');
      setShowConfirmation(false);
      // Reset form
      setFormData({
        account: formData.account,
        asset: '',
        network: '',
        destination: '',
        amount: '',
      });
      setFee(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate withdrawal');
    }
  };

  const walletName = whiteLabelConfig?.walletName || 'My Wallet';
  const displayAssetName = formData.asset ? getAssetDisplayName(formData.asset) : '';
  const assetMapping = whiteLabelConfig?.assetMappings.find(m => m.assetId === formData.asset);
  const selectedWallet = accounts.find(a => a.id === formData.account);

  if (showConfirmation) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowConfirmation(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Confirm Withdrawal</h2>
            <p className="text-muted-foreground">Review and confirm your transaction</p>
          </div>
        </div>

        <div className="glass rounded-xl p-8 space-y-6">
          {/* Confirmation Summary */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {assetMapping?.customIcon ? (
                <img src={assetMapping.customIcon} alt={displayAssetName} className="h-16 w-16 rounded-full" />
              ) : (
                <AssetIcon asset={formData.asset} size="lg" />
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{formData.amount} {displayAssetName}</p>
              <p className="text-muted-foreground">on {selectedNetwork?.label} Network</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
              <span className="font-medium text-foreground">{selectedWallet?.nickname || 'Wallet'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span className="font-mono text-sm text-foreground truncate max-w-[200px]">{formData.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium text-foreground">{selectedNetwork?.label}</span>
            </div>
            {fee && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium text-foreground">{fee} {displayAssetName}</span>
              </div>
            )}
          </div>

          {/* Explicit Confirmation Message */}
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
            <p className="text-sm text-center text-foreground">
              You are sending <strong>{formData.amount} {displayAssetName}</strong> on <strong>{selectedNetwork?.label}</strong> to:
            </p>
            <p className="font-mono text-xs text-center text-muted-foreground mt-2 break-all">
              {formData.destination}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground"
              onClick={handleConfirmSubmit}
              disabled={withdrawAssets.isPending}
            >
              {withdrawAssets.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Withdrawal
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-foreground">Send Stablecoins</h2>
          <p className="text-muted-foreground">Withdraw from {walletName}</p>
        </div>
      </div>

      <div className="glass rounded-xl p-8 space-y-6">
        {/* Wallet Selection */}
        <div className="space-y-2">
          <Label>From Wallet</Label>
          <Select
            value={formData.account}
            onValueChange={(v) => setFormData({...formData, account: v, asset: '', amount: '', network: ''})}
            disabled={loadingAccounts}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={loadingAccounts ? 'Loading...' : 'Select wallet'} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account, index) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.nickname || `Wallet ${index + 1}`}
                </SelectItem>
              ))}
              {accounts.length === 0 && !loadingAccounts && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No wallets found
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
            onValueChange={(v) => { 
              setFormData({...formData, asset: v, network: '', amount: ''}); 
              setFee(null); 
            }}
            disabled={!formData.account || loadingBalances}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={
                loadingBalances ? 'Loading...' : 
                !formData.account ? 'Select wallet first' : 
                'Select stablecoin'
              } />
            </SelectTrigger>
            <SelectContent>
              {balances.map((balance: AccountBalanceItem) => {
                const mapping = whiteLabelConfig?.assetMappings.find(m => m.assetId === balance.asset);
                const displayName = mapping?.customName || balance.asset;
                
                return (
                  <SelectItem key={balance.asset} value={balance.asset}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-2">
                        {mapping?.customIcon ? (
                          <img src={mapping.customIcon} alt={displayName} className="h-5 w-5 rounded-full" />
                        ) : (
                          <AssetIcon asset={balance.asset} size="sm" />
                        )}
                        <span>{displayName}</span>
                      </div>
                      <span className="text-muted-foreground">{parseFloat(balance.available).toFixed(2)}</span>
                    </div>
                  </SelectItem>
                );
              })}
              {balances.length === 0 && !loadingBalances && formData.account && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No stablecoin balances
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Network Selection */}
        <div className="space-y-2">
          <Label>Network</Label>
          {formData.asset ? (
            <Select 
              value={formData.network} 
              onValueChange={(v) => { 
                setFormData({...formData, network: v}); 
                setFee(null);
              }}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {availableNetworks.map((network) => (
                  <SelectItem key={network.value} value={network.value}>
                    {network.label}
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

        {/* Destination Address */}
        <div className="space-y-2">
          <Label>Destination Address</Label>
          <Input
            placeholder={selectedNetwork?.addressHint || 'Enter wallet address'}
            value={formData.destination}
            onChange={(e) => setFormData({...formData, destination: e.target.value})}
            className={`bg-secondary border-border font-mono ${
              formData.destination && !addressValidation.valid ? 'border-destructive' : ''
            }`}
          />
          {formData.destination && !addressValidation.valid && (
            <p className="text-sm text-destructive">{addressValidation.message}</p>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount</Label>
            {selectedBalance && (
              <button
                type="button"
                className="text-xs text-module-whitelabel hover:underline"
                onClick={() => setFormData({...formData, amount: selectedBalance.available})}
              >
                Max: {parseFloat(selectedBalance.available).toFixed(6)} {displayAssetName}
              </button>
            )}
          </div>
          <Input
            type="text"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => {
              setFormData({...formData, amount: e.target.value});
              setFee(null);
            }}
            className="bg-secondary border-border"
          />
        </div>

        {/* Calculate Fee Button */}
        {formData.amount && formData.destination && formData.network && !fee && (
          <Button
            variant="outline"
            onClick={handleCalculateFee}
            disabled={calculateFee.isPending || !addressValidation.valid}
            className="w-full"
          >
            {calculateFee.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              'Calculate Network Fee'
            )}
          </Button>
        )}

        {/* Fee Display */}
        {fee && (
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="font-medium text-foreground">{fee} {displayAssetName}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-foreground">
                {(parseFloat(formData.amount) + parseFloat(fee)).toFixed(6)} {displayAssetName}
              </span>
            </div>
          </div>
        )}

        {/* Network Warning */}
        {formData.network && (
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Network Match Required</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ensure the destination address supports <strong>{displayAssetName}</strong> on <strong>{selectedNetwork?.label}</strong>. 
                  Sending to an incompatible address will result in permanent loss.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleProceed}
          disabled={
            !formData.amount || 
            !formData.destination || 
            !formData.network || 
            !addressValidation.valid
          }
          className="w-full bg-warning hover:bg-warning/90 text-warning-foreground"
        >
          <ArrowUpFromLine className="h-4 w-4 mr-2" />
          Review Withdrawal
        </Button>
      </div>
    </div>
  );
};

export default WhiteLabelSend;