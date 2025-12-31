import React, { useState } from 'react';
import { Building2, Loader2, Network, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaxosIdentity, CreateAccountRequest, ModuleName, CryptoNetwork } from '@/api/types';
import { CRYPTO_NETWORKS, TREASURY_ASSETS } from '@/lib/constants';

interface CreateAccountFormProps {
  identities: PaxosIdentity[];
  onSubmit: (data: CreateAccountRequest & { depositConfig?: { network: CryptoNetwork; asset: string } }) => Promise<void>;
  isLoading?: boolean;
  module?: ModuleName;
  showDepositConfig?: boolean;
}

export const CreateAccountForm: React.FC<CreateAccountFormProps> = ({
  identities,
  onSubmit,
  isLoading,
  module = 'TREASURY',
  showDepositConfig = false,
}) => {
  const [identityId, setIdentityId] = useState('');
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [network, setNetwork] = useState<CryptoNetwork>('ETHEREUM');
  const [asset, setAsset] = useState('USDC');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identityId) return;

    const payload: CreateAccountRequest & { depositConfig?: { network: CryptoNetwork; asset: string } } = {
      account_request: {
        account: {
          identity_id: identityId,
          description: description || undefined,
        },
      },
      module,
      nickname: nickname || undefined,
    };

    if (showDepositConfig) {
      payload.depositConfig = { network, asset };
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Select Identity *</Label>
        {identities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-secondary/50 rounded-lg">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No identities available</p>
            <p className="text-sm">Create an identity first</p>
          </div>
        ) : (
          <Select value={identityId} onValueChange={setIdentityId}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select an identity" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {identities.map((identity) => (
                <SelectItem key={identity.id} value={identity.identity_id}>
                  <div className="flex items-center gap-2">
                    <span>{identity.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({identity.identity_type})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label>Nickname *</Label>
        <Input
          placeholder="Enter a nickname for this account"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="bg-secondary border-border"
        />
        <p className="text-xs text-muted-foreground">
          A short, memorable name to identify this account
        </p>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Enter account description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-secondary border-border resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          A brief description to help identify this account
        </p>
      </div>

      {/* Deposit Address Configuration - Only shown for Treasury */}
      {showDepositConfig && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Network className="h-4 w-4 text-primary" />
            <span>Deposit Address Configuration</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A deposit address will be automatically created for this account
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Network *</Label>
              <Select value={network} onValueChange={(v) => setNetwork(v as CryptoNetwork)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {CRYPTO_NETWORKS.map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Asset *</Label>
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {TREASURY_ASSETS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      <div className="flex items-center gap-2">
                        <Coins className="h-3 w-3" />
                        {a.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isLoading || !identityId || !nickname} 
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
};
