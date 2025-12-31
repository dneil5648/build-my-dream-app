import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle, Loader2, QrCode, ArrowRightLeft, Building2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreateCryptoAddress, useCryptoDestinationAddresses } from '@/hooks/useCrypto';
import { useFiatAccounts } from '@/hooks/useFiat';
import { CryptoNetwork } from '@/api/types';

const CreateCryptoAddress: React.FC = () => {
  const [formData, setFormData] = useState({
    account_id: '',
    source_asset: '',
    destination_asset: '',
    network: '',
    destination_type: 'account', // 'account' | 'fiat' | 'crypto'
    fiat_account_id: '',
    crypto_address_id: '',
  });
  const [generatedAddress, setGeneratedAddress] = useState<{
    id: string;
    wallet_address: string;
    network: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: fiatAccountsResponse, isLoading: loadingFiatAccounts } = useFiatAccounts();
  const { data: destinationAddressesResponse, isLoading: loadingDestinations } = useCryptoDestinationAddresses();
  const createCryptoAddress = useCreateCryptoAddress();

  const accounts = accountsResponse?.data || [];
  const fiatAccounts = fiatAccountsResponse?.data || [];
  const destinationAddresses = destinationAddressesResponse?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.account_id || !formData.source_asset || !formData.network || !formData.destination_asset) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate destination selection
    if (formData.destination_type === 'fiat' && !formData.fiat_account_id) {
      toast.error('Please select a fiat account');
      return;
    }
    if (formData.destination_type === 'crypto' && !formData.crypto_address_id) {
      toast.error('Please select a destination address');
      return;
    }

    try {
      const response = await createCryptoAddress.mutateAsync({
        account_id: formData.account_id,
        network: formData.network as CryptoNetwork,
        source_asset: formData.source_asset,
        destination_asset: formData.destination_asset,
        fiat_account_id: formData.destination_type === 'fiat' ? formData.fiat_account_id : undefined,
        crypto_address_id: formData.destination_type === 'crypto' ? formData.crypto_address_id : undefined,
      });

      if (response.success && response.data) {
        setGeneratedAddress({
          id: response.data.id,
          wallet_address: response.data.wallet_address,
          network: response.data.network,
        });
        toast.success('Deposit address created successfully');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create deposit address');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  // Available networks: ETHEREUM, SOLANA, STELLAR, BASE, POLYGON
  const getNetworkOptions = (asset: string) => {
    // All stablecoins can be on multiple networks
    const allNetworks = [
      { value: 'ETHEREUM', label: 'Ethereum' },
      { value: 'SOLANA', label: 'Solana' },
      { value: 'STELLAR', label: 'Stellar' },
      { value: 'BASE', label: 'Base' },
      { value: 'POLYGON', label: 'Polygon' },
    ];
    
    // Return all networks for supported assets
    if (['USDG', 'PYUSD', 'USDP', 'USDC'].includes(asset)) {
      return allNetworks;
    }
    return allNetworks;
  };

  const getDestinationTypeDescription = () => {
    switch (formData.destination_type) {
      case 'account':
        return 'Funds will be credited to the account balance';
      case 'fiat':
        return 'Funds will be converted and withdrawn to bank account';
      case 'crypto':
        return 'Funds will be converted and sent to external wallet';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/pay-ins">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Create Crypto Deposit Address</h2>
          <p className="text-muted-foreground">Generate a deposit address with optional conversion and routing</p>
        </div>
      </div>

      {!generatedAddress ? (
        <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
          {/* Account Selection */}
          <div className="space-y-2">
            <Label>Account *</Label>
            <Select 
              value={formData.account_id} 
              onValueChange={(v) => setFormData({...formData, account_id: v})}
              disabled={loadingAccounts}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={loadingAccounts ? 'Loading...' : 'Select account'} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {accounts.length === 0 && !loadingAccounts ? (
                  <div className="px-2 py-4 text-center text-muted-foreground text-sm">No accounts found</div>
                ) : (
                  accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.description || `Account ${account.paxos_account_id.slice(0, 8)}...`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Source Asset, Network & Destination */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Source Asset *</Label>
              <Select
                value={formData.source_asset}
                onValueChange={(v) => setFormData({...formData, source_asset: v, destination_asset: v, network: ''})}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="USDG">
                    <div className="flex items-center gap-2">
                      <AssetIcon asset="USDG" size="sm" />
                      Global Dollar (USDG)
                    </div>
                  </SelectItem>
                  <SelectItem value="PYUSD">
                    <div className="flex items-center gap-2">
                      <AssetIcon asset="PYUSD" size="sm" />
                      PayPal USD (PYUSD)
                    </div>
                  </SelectItem>
                  <SelectItem value="USDP">
                    <div className="flex items-center gap-2">
                      <AssetIcon asset="USDP" size="sm" />
                      Pax Dollar (USDP)
                    </div>
                  </SelectItem>
                  <SelectItem value="USDC">
                    <div className="flex items-center gap-2">
                      <AssetIcon asset="USDC" size="sm" />
                      USD Coin (USDC)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Network *</Label>
              <Select
                value={formData.network}
                onValueChange={(v) => setFormData({...formData, network: v})}
                disabled={!formData.source_asset}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder={formData.source_asset ? 'Select network' : 'Select asset first'} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {getNetworkOptions(formData.source_asset).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destination Asset *</Label>
              <Select
                value={formData.destination_asset}
                onValueChange={(v) => setFormData({...formData, destination_asset: v})}
                disabled={!formData.source_asset}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {formData.source_asset && (
                    <SelectItem value={formData.source_asset}>{formData.source_asset} (No conversion)</SelectItem>
                  )}
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="USDG">Global Dollar (USDG)</SelectItem>
                  <SelectItem value="PYUSD">PayPal USD (PYUSD)</SelectItem>
                  <SelectItem value="USDP">Pax Dollar (USDP)</SelectItem>
                  <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                </SelectContent>
              </Select>
              {formData.source_asset && formData.destination_asset && (
                <p className="text-xs text-muted-foreground">
                  {formData.source_asset === formData.destination_asset
                    ? 'Direct deposit - no conversion'
                    : `Auto-convert ${formData.source_asset} → ${formData.destination_asset}`}
                </p>
              )}
            </div>
          </div>

          {/* Destination Type Selection */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-4">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Destination</p>
                <p className="text-sm text-muted-foreground">Where should deposits be routed?</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, destination_type: 'account', fiat_account_id: '', crypto_address_id: ''})}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  formData.destination_type === 'account'
                    ? 'border-module-payins bg-module-payins/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Wallet className={`h-6 w-6 mb-2 ${formData.destination_type === 'account' ? 'text-module-payins' : 'text-muted-foreground'}`} />
                <p className={`font-medium ${formData.destination_type === 'account' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Account Balance
                </p>
                <p className="text-xs text-muted-foreground">Hold in profile</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({...formData, destination_type: 'fiat', crypto_address_id: ''})}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  formData.destination_type === 'fiat'
                    ? 'border-module-payins bg-module-payins/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Building2 className={`h-6 w-6 mb-2 ${formData.destination_type === 'fiat' ? 'text-module-payins' : 'text-muted-foreground'}`} />
                <p className={`font-medium ${formData.destination_type === 'fiat' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Bank Account
                </p>
                <p className="text-xs text-muted-foreground">Withdraw to fiat</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({...formData, destination_type: 'crypto', fiat_account_id: ''})}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  formData.destination_type === 'crypto'
                    ? 'border-module-payins bg-module-payins/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Wallet className={`h-6 w-6 mb-2 ${formData.destination_type === 'crypto' ? 'text-module-payins' : 'text-muted-foreground'}`} />
                <p className={`font-medium ${formData.destination_type === 'crypto' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  External Wallet
                </p>
                <p className="text-xs text-muted-foreground">Send to crypto address</p>
              </button>
            </div>

            <p className="text-sm text-muted-foreground">{getDestinationTypeDescription()}</p>

            {/* Fiat Account Selection */}
            {formData.destination_type === 'fiat' && (
              <div className="space-y-2 pt-2">
                <Label>Select Fiat Account *</Label>
                <Select 
                  value={formData.fiat_account_id} 
                  onValueChange={(v) => setFormData({...formData, fiat_account_id: v})}
                  disabled={loadingFiatAccounts}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder={loadingFiatAccounts ? 'Loading...' : 'Select fiat account'} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {fiatAccounts.length === 0 && !loadingFiatAccounts ? (
                      <div className="px-2 py-4 text-center text-muted-foreground text-sm">No fiat accounts registered</div>
                    ) : (
                      fiatAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.paxos_fiat_account_id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {account.description || account.network}
                            {account.wire_account_number && ` (****${account.wire_account_number.slice(-4)})`}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {fiatAccounts.length === 0 && !loadingFiatAccounts && (
                  <p className="text-xs text-warning">
                    No fiat accounts found. Register a fiat account first.
                  </p>
                )}
              </div>
            )}

            {/* Crypto Destination Selection */}
            {formData.destination_type === 'crypto' && (
              <div className="space-y-2 pt-2">
                <Label>Select Destination Address *</Label>
                <Select 
                  value={formData.crypto_address_id} 
                  onValueChange={(v) => setFormData({...formData, crypto_address_id: v})}
                  disabled={loadingDestinations}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder={loadingDestinations ? 'Loading...' : 'Select destination address'} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {destinationAddresses.length === 0 && !loadingDestinations ? (
                      <div className="px-2 py-4 text-center text-muted-foreground text-sm">No destination addresses registered</div>
                    ) : (
                      destinationAddresses
                        .filter((addr) => addr.paxos_crypto_destination_id)
                        .map((addr) => (
                          <SelectItem key={addr.id} value={addr.paxos_crypto_destination_id!}>
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              {addr.nickname || addr.label || `${addr.crypto_network} - ${addr.address.slice(0, 12)}...`}
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                {destinationAddresses.length === 0 && !loadingDestinations && (
                  <p className="text-xs text-warning">
                    No destination addresses found. Register an external wallet first.
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={createCryptoAddress.isPending || !formData.account_id || !formData.source_asset || !formData.network || !formData.destination_asset}
            className="w-full bg-module-payins hover:bg-module-payins/90"
          >
            {createCryptoAddress.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Deposit Address'
            )}
          </Button>
        </form>
      ) : (
        <div className="glass rounded-xl p-8 space-y-6">
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Deposit Address Created</h3>
            <p className="text-muted-foreground">Share this address to receive deposits</p>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex justify-center">
            <div className="h-48 w-48 bg-secondary rounded-xl flex items-center justify-center border border-border">
              <QrCode className="h-24 w-24 text-muted-foreground" />
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Deposit Address</p>
                <p className="font-mono text-sm font-medium text-foreground break-all">{generatedAddress.wallet_address}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => copyToClipboard(generatedAddress.wallet_address)}
                className="ml-2 text-muted-foreground hover:text-primary flex-shrink-0"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border">
              <div>
                <p className="text-sm text-muted-foreground">Network</p>
                <p className="font-medium text-foreground">{generatedAddress.network}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 border-border" onClick={() => setGeneratedAddress(null)}>
              Create Another
            </Button>
            <Link to="/app/pay-ins" className="flex-1">
              <Button className="w-full bg-module-payins hover:bg-module-payins/90">Done</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCryptoAddress;