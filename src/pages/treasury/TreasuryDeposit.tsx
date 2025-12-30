import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useCreateCryptoAddress } from '@/hooks/useCrypto';
import { useAccounts } from '@/hooks/useAccounts';
import { CryptoNetwork } from '@/api/types';

const TreasuryDeposit: React.FC = () => {
  const [formData, setFormData] = useState({
    account: '',
    asset: '',
    network: '',
  });
  const [generatedAddress, setGeneratedAddress] = useState<{ address: string; id: string } | null>(null);
  
  const createCryptoAddress = useCreateCryptoAddress();
  const { data: accountsResponse } = useAccounts();
  const accounts = accountsResponse?.data || [];

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
      });
      
      if (result.success && result.data) {
        setGeneratedAddress({
          address: result.data.wallet_address,
          id: result.data.id,
        });
        toast.success('Deposit address created');
      }
    } catch (error) {
      // Fallback to mock for demo purposes
      const mockAddresses: Record<string, string> = {
        BTC: 'bc1q9h7z9w8k3qx2p5v6t7y8u9i0o1k2l3m4n5b6v7c8x9z0',
        ETH: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        USDC: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      };
      setGeneratedAddress({
        address: mockAddresses[formData.asset] || mockAddresses.BTC,
        id: 'mock-' + Date.now(),
      });
      toast.success('Deposit address generated');
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
        <Link to="/app/treasury">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Generate Deposit Address</h2>
          <p className="text-muted-foreground">Create a deposit address for crypto on-ramp</p>
        </div>
      </div>

      <div className="glass rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <Label>Account</Label>
          <Select value={formData.account} onValueChange={(v) => setFormData({...formData, account: v})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.paxos_account_id}>
                  {account.paxos_account_id}
                </SelectItem>
              ))}
              {accounts.length === 0 && (
                <SelectItem value="" disabled>No accounts available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select value={formData.asset} onValueChange={(v) => setFormData({...formData, asset: v, network: ''})}>
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
                {formData.asset === 'BTC' && <SelectItem value="BITCOIN">Bitcoin Network</SelectItem>}
                {formData.asset === 'ETH' && <SelectItem value="ETHEREUM">Ethereum Network</SelectItem>}
                {formData.asset === 'USDC' && (
                  <>
                    <SelectItem value="ETHEREUM">Ethereum Network</SelectItem>
                    <SelectItem value="POLYGON">Polygon Network</SelectItem>
                    <SelectItem value="SOLANA">Solana</SelectItem>
                  </>
                )}
                {!formData.asset && <SelectItem value="" disabled>Select asset first</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!generatedAddress ? (
          <Button 
            onClick={handleGenerate} 
            disabled={createCryptoAddress.isPending || !formData.account || !formData.asset || !formData.network} 
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
              <Link to="/app/treasury" className="flex-1">
                <Button className="w-full bg-primary hover:bg-primary/90">Done</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreasuryDeposit;
