import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaxosAccount, CryptoNetwork, CreateCryptoDestinationAddressRequest } from '@/api/types';

interface CreateDestinationAddressFormProps {
  accounts: PaxosAccount[];
  onSubmit: (data: CreateCryptoDestinationAddressRequest) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

const CRYPTO_NETWORKS: { value: CryptoNetwork; label: string; addressHint: string }[] = [
  { value: 'ETHEREUM', label: 'Ethereum', addressHint: '0x...' },
  { value: 'SOLANA', label: 'Solana', addressHint: 'Base58 encoded' },
  { value: 'STELLAR', label: 'Stellar', addressHint: 'G...' },
  { value: 'BASE', label: 'Base', addressHint: '0x...' },
  { value: 'POLYGON', label: 'Polygon', addressHint: '0x...' },
];

export const CreateDestinationAddressForm: React.FC<CreateDestinationAddressFormProps> = ({
  accounts,
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    account_id: '',
    crypto_network: '' as CryptoNetwork | '',
    address: '',
    label: '',
  });

  const selectedNetwork = CRYPTO_NETWORKS.find(n => n.value === formData.crypto_network);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.crypto_network || !formData.address) return;

    await onSubmit({
      account_id: formData.account_id,
      crypto_network: formData.crypto_network as CryptoNetwork,
      address: formData.address,
      label: formData.label || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Account</Label>
        <Select 
          value={formData.account_id} 
          onValueChange={(v) => setFormData({...formData, account_id: v})}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.description || account.paxos_account_id.slice(0, 12) + '...'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Network</Label>
        <Select 
          value={formData.crypto_network} 
          onValueChange={(v) => setFormData({...formData, crypto_network: v as CryptoNetwork})}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {CRYPTO_NETWORKS.map((network) => (
              <SelectItem key={network.value} value={network.value}>
                {network.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Wallet Address</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          placeholder={selectedNetwork?.addressHint || 'Enter wallet address'}
          className="bg-secondary border-border font-mono text-sm"
        />
        {selectedNetwork && (
          <p className="text-xs text-muted-foreground">
            Format: {selectedNetwork.addressHint}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Label (Optional)</Label>
        <Input
          value={formData.label}
          onChange={(e) => setFormData({...formData, label: e.target.value})}
          placeholder="e.g., My Hardware Wallet"
          className="bg-secondary border-border"
        />
        <p className="text-xs text-muted-foreground">
          A friendly name to identify this address
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading || !formData.account_id || !formData.crypto_network || !formData.address} 
          className="flex-1 bg-module-payins hover:bg-module-payins/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Register Address'
          )}
        </Button>
      </div>
    </form>
  );
};