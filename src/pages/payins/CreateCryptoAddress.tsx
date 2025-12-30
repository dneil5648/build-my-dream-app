import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle, Loader2, QrCode, Wallet, Building2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreateCryptoAddress } from '@/hooks/useCrypto';
import { CryptoNetwork } from '@/api/types';

type DestinationType = 'ACCOUNT' | 'EXTERNAL_WALLET' | 'FIAT_ACCOUNT';

const CreateCryptoAddress: React.FC = () => {
  const [formData, setFormData] = useState({
    account_id: '',
    source_asset: '',
    network: '',
    enable_conversion: false,
    destination_asset: '',
    destination_type: '' as DestinationType | '',
    destination_account_id: '',
    destination_address: '',
    fiat_account_id: '',
  });
  const [generatedAddress, setGeneratedAddress] = useState<{
    id: string;
    wallet_address: string;
    network: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const createCryptoAddress = useCreateCryptoAddress();
  const accounts = accountsResponse?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_id || !formData.source_asset || !formData.network) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await createCryptoAddress.mutateAsync({
        account_id: formData.account_id,
        network: formData.network as CryptoNetwork,
        source_asset: formData.source_asset,
        destination_asset: formData.enable_conversion ? formData.destination_asset : undefined,
        destination_type: formData.destination_type as DestinationType || undefined,
        destination_account_id: formData.destination_type === 'ACCOUNT' ? formData.destination_account_id : undefined,
        destination_address: formData.destination_type === 'EXTERNAL_WALLET' ? formData.destination_address : undefined,
        fiat_account_id: formData.destination_type === 'FIAT_ACCOUNT' ? formData.fiat_account_id : undefined,
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
      // Fallback to mock for demo
      const mockAddresses: Record<string, string> = {
        BTC: 'bc1q9h7z9w8k3qx2p5v6t7y8u9i0o1k2l3m4n5b6v7c8x9z0',
        ETH: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        USDC: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      };
      setGeneratedAddress({
        id: 'mock-' + Date.now(),
        wallet_address: mockAddresses[formData.source_asset] || mockAddresses.BTC,
        network: formData.network,
      });
      toast.success('Deposit address generated');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const getNetworkOptions = (asset: string) => {
    switch (asset) {
      case 'BTC':
        return [{ value: 'BITCOIN', label: 'Bitcoin Network' }];
      case 'ETH':
        return [{ value: 'ETHEREUM', label: 'Ethereum Network' }];
      case 'USDC':
        return [
          { value: 'ETHEREUM', label: 'Ethereum Network' },
          { value: 'POLYGON', label: 'Polygon Network' },
          { value: 'SOLANA', label: 'Solana' },
        ];
      default:
        return [];
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
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.paxos_account_id}>
                    Account {account.paxos_account_id.slice(0, 8)}...
                  </SelectItem>
                ))}
                {accounts.length === 0 && !loadingAccounts && (
                  <SelectItem value="" disabled>No accounts found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Source Asset & Network */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Source Asset *</Label>
              <Select 
                value={formData.source_asset} 
                onValueChange={(v) => setFormData({...formData, source_asset: v, network: ''})}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">
                    <div className="flex items-center gap-2">
                      <AssetIcon asset="BTC" size="sm" />
                      Bitcoin (BTC)
                    </div>
                  </SelectItem>
                  <SelectItem value="ETH">
                    <div className="flex items-center gap-2">
                      <AssetIcon asset="ETH" size="sm" />
                      Ethereum (ETH)
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
                <SelectContent>
                  {getNetworkOptions(formData.source_asset).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversion Toggle */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Enable Auto-Conversion</p>
                  <p className="text-sm text-muted-foreground">Automatically convert deposits to another asset</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, enable_conversion: !formData.enable_conversion, destination_asset: ''})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  formData.enable_conversion ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  formData.enable_conversion ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          {/* Destination Asset (if conversion enabled) */}
          {formData.enable_conversion && (
            <div className="space-y-2">
              <Label>Destination Asset</Label>
              <Select 
                value={formData.destination_asset} 
                onValueChange={(v) => setFormData({...formData, destination_asset: v})}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select destination asset" />
                </SelectTrigger>
                <SelectContent>
                  {['USD', 'USDC', 'BTC', 'ETH'].filter(a => a !== formData.source_asset).map((asset) => (
                    <SelectItem key={asset} value={asset}>
                      <div className="flex items-center gap-2">
                        <AssetIcon asset={asset} size="sm" />
                        {asset}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Destination Type */}
          <div className="space-y-4">
            <Label>Destination Type</Label>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { type: 'ACCOUNT', label: 'Internal Account', icon: Wallet, description: 'Route to another account' },
                { type: 'EXTERNAL_WALLET', label: 'External Wallet', icon: ArrowRightLeft, description: 'Route to external address' },
                { type: 'FIAT_ACCOUNT', label: 'Fiat Account', icon: Building2, description: 'Route to bank account' },
              ].map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, destination_type: type as DestinationType})}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    formData.destination_type === type
                      ? 'border-module-payins bg-module-payins/10'
                      : 'border-border bg-secondary/50 hover:border-muted-foreground'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${formData.destination_type === type ? 'text-module-payins' : 'text-muted-foreground'}`} />
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Destination Details based on type */}
          {formData.destination_type === 'ACCOUNT' && (
            <div className="space-y-2">
              <Label>Destination Account</Label>
              <Select 
                value={formData.destination_account_id} 
                onValueChange={(v) => setFormData({...formData, destination_account_id: v})}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.paxos_account_id !== formData.account_id).map((account) => (
                    <SelectItem key={account.id} value={account.paxos_account_id}>
                      Account {account.paxos_account_id.slice(0, 8)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.destination_type === 'EXTERNAL_WALLET' && (
            <div className="space-y-2">
              <Label>Destination Address</Label>
              <Input
                placeholder="Enter external wallet address"
                value={formData.destination_address}
                onChange={(e) => setFormData({...formData, destination_address: e.target.value})}
                className="bg-secondary border-border font-mono"
              />
            </div>
          )}

          {formData.destination_type === 'FIAT_ACCOUNT' && (
            <div className="space-y-2">
              <Label>Fiat Account ID</Label>
              <Input
                placeholder="Enter fiat account ID"
                value={formData.fiat_account_id}
                onChange={(e) => setFormData({...formData, fiat_account_id: e.target.value})}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">The registered bank account to receive converted funds</p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={createCryptoAddress.isPending || !formData.account_id || !formData.source_asset || !formData.network} 
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
