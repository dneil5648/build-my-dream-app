import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useCreateCryptoAddress, useCryptoAddresses } from '@/hooks/useCrypto';
import { useAccounts } from '@/hooks/useAccounts';
import { CryptoNetwork } from '@/api/types';

const CryptoDeposit: React.FC = () => {
  const [formData, setFormData] = useState({
    account: '',
    sourceAsset: '',
    destAsset: '',
    network: '',
  });
  const [generatedAddress, setGeneratedAddress] = useState<{ address: string; id: string } | null>(null);

  const createCryptoAddress = useCreateCryptoAddress();
  const { data: existingAddresses } = useCryptoAddresses();
  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const accounts = accountsResponse?.data || [];

  const handleGenerate = async () => {
    if (!formData.account || !formData.sourceAsset || !formData.network) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await createCryptoAddress.mutateAsync({
        account_id: formData.account,
        network: formData.network as CryptoNetwork,
        source_asset: formData.sourceAsset,
        destination_asset: formData.destAsset || formData.sourceAsset, // Default to same as source (no conversion)
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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/crypto">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Crypto Deposit</h2>
          <p className="text-muted-foreground">Generate a deposit address for crypto on-ramp</p>
        </div>
      </div>

      <div className="glass rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <Label>Account</Label>
          <Select
            value={formData.account}
            onValueChange={(v) => setFormData({...formData, account: v})}
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

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Source Asset</Label>
            <Select value={formData.sourceAsset} onValueChange={(v) => setFormData({...formData, sourceAsset: v, destAsset: v})}>
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
            <Label>Network</Label>
            <Select value={formData.network} onValueChange={(v) => setFormData({...formData, network: v})}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {formData.sourceAsset === 'BTC' && <SelectItem value="bitcoin">Bitcoin Network</SelectItem>}
                {formData.sourceAsset === 'ETH' && <SelectItem value="ethereum">Ethereum Network</SelectItem>}
                {formData.sourceAsset === 'USDC' && (
                  <>
                    <SelectItem value="ethereum">Ethereum Network</SelectItem>
                    <SelectItem value="polygon">Polygon Network</SelectItem>
                  </>
                )}
                {!formData.sourceAsset && <SelectItem value="" disabled>Select asset first</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!generatedAddress ? (
          <Button 
            onClick={handleGenerate} 
            disabled={createCryptoAddress.isPending || !formData.account || !formData.sourceAsset || !formData.network} 
            className="w-full bg-primary hover:bg-primary/90"
          >
            {createCryptoAddress.isPending ? 'Creating...' : 'Create Deposit Address'}
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
            <div className="p-4 rounded-lg bg-secondary border border-border">
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
              <Link to="/app/crypto" className="flex-1">
                <Button className="w-full bg-primary hover:bg-primary/90">Done</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoDeposit;
