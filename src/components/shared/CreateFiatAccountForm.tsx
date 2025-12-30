import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaxosAccount, FiatNetwork, RegisterFiatAccountRequest, RoutingNumberType } from '@/api/types';

interface CreateFiatAccountFormProps {
  accounts: PaxosAccount[];
  onSubmit: (data: RegisterFiatAccountRequest) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

const FIAT_NETWORKS: { value: FiatNetwork; label: string; description: string }[] = [
  { value: 'WIRE', label: 'Wire Transfer', description: 'International wire (SWIFT/ABA/IBAN)' },
  { value: 'CBIT', label: 'CBIT', description: 'Crypto-based institutional transfers' },
  { value: 'DBS_ACT', label: 'DBS ACT', description: 'DBS Bank ACT network' },
  { value: 'CUBIX', label: 'Cubix', description: 'Cubix payment network' },
  { value: 'SCB', label: 'SCB', description: 'Standard Chartered Bank' },
];

const ROUTING_TYPES: { value: RoutingNumberType; label: string }[] = [
  { value: 'ABA', label: 'ABA (US Domestic)' },
  { value: 'SWIFT', label: 'SWIFT (International)' },
  { value: 'IBAN', label: 'IBAN (European)' },
];

export const CreateFiatAccountForm: React.FC<CreateFiatAccountFormProps> = ({
  accounts,
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    account_id: '',
    fiat_network: '' as FiatNetwork | '',
    description: '',
    // Owner address
    owner_country: 'US',
    owner_address1: '',
    owner_address2: '',
    owner_city: '',
    owner_province: '',
    owner_zip_code: '',
    // WIRE specific
    wire_account_number: '',
    routing_number_type: 'ABA' as RoutingNumberType,
    routing_number: '',
    bank_name: '',
    bank_country: 'US',
    bank_address1: '',
    bank_city: '',
    bank_province: '',
    bank_zip_code: '',
    // Other networks
    cbit_wallet_address: '',
    dbs_act_account_number: '',
    cubix_account_id: '',
    scb_account_number: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.fiat_network) return;

    const baseRequest: RegisterFiatAccountRequest = {
      account_id: formData.account_id,
      fiat_network: formData.fiat_network as FiatNetwork,
      description: formData.description || undefined,
      account_owner_address: {
        country: formData.owner_country,
        address1: formData.owner_address1,
        address2: formData.owner_address2 || undefined,
        city: formData.owner_city,
        province: formData.owner_province,
        zip_code: formData.owner_zip_code,
      },
    };

    // Add network-specific fields
    if (formData.fiat_network === 'WIRE') {
      baseRequest.wire_account_number = formData.wire_account_number;
      baseRequest.routing_details = {
        routing_number_type: formData.routing_number_type,
        routing_number: formData.routing_number,
        bank_name: formData.bank_name,
        bank_address: {
          country: formData.bank_country,
          address1: formData.bank_address1,
          city: formData.bank_city,
          province: formData.bank_province,
          zip_code: formData.bank_zip_code,
        },
      };
    } else if (formData.fiat_network === 'CBIT') {
      baseRequest.cbit_wallet_address = formData.cbit_wallet_address;
    } else if (formData.fiat_network === 'DBS_ACT') {
      baseRequest.dbs_act_account_number = formData.dbs_act_account_number;
    } else if (formData.fiat_network === 'CUBIX') {
      baseRequest.cubix_account_id = formData.cubix_account_id;
    } else if (formData.fiat_network === 'SCB') {
      baseRequest.scb_account_number = formData.scb_account_number;
    }

    await onSubmit(baseRequest);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-4">
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
            value={formData.fiat_network} 
            onValueChange={(v) => setFormData({...formData, fiat_network: v as FiatNetwork})}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {FIAT_NETWORKS.map((network) => (
                <SelectItem key={network.value} value={network.value}>
                  <div>
                    <span className="font-medium">{network.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{network.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (Optional)</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="e.g., Primary Business Checking"
          className="bg-secondary border-border"
        />
      </div>

      {/* Owner Address */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Account Owner Address</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Country</Label>
            <Input
              value={formData.owner_country}
              onChange={(e) => setFormData({...formData, owner_country: e.target.value})}
              placeholder="US"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Address Line 1</Label>
            <Input
              value={formData.owner_address1}
              onChange={(e) => setFormData({...formData, owner_address1: e.target.value})}
              placeholder="123 Main Street"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={formData.owner_city}
              onChange={(e) => setFormData({...formData, owner_city: e.target.value})}
              placeholder="New York"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>State/Province</Label>
            <Input
              value={formData.owner_province}
              onChange={(e) => setFormData({...formData, owner_province: e.target.value})}
              placeholder="NY"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>ZIP/Postal Code</Label>
            <Input
              value={formData.owner_zip_code}
              onChange={(e) => setFormData({...formData, owner_zip_code: e.target.value})}
              placeholder="10001"
              className="bg-secondary border-border"
            />
          </div>
        </div>
      </div>

      {/* WIRE-specific fields */}
      {formData.fiat_network === 'WIRE' && (
        <div className="space-y-4 border-t border-border pt-4">
          <h4 className="font-medium text-foreground">Wire Transfer Details</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={formData.wire_account_number}
                onChange={(e) => setFormData({...formData, wire_account_number: e.target.value})}
                placeholder="1234567890"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Routing Type</Label>
              <Select 
                value={formData.routing_number_type} 
                onValueChange={(v) => setFormData({...formData, routing_number_type: v as RoutingNumberType})}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUTING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Routing Number</Label>
              <Input
                value={formData.routing_number}
                onChange={(e) => setFormData({...formData, routing_number: e.target.value})}
                placeholder="021000021"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={formData.bank_name}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                placeholder="JPMorgan Chase Bank"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bank Country</Label>
              <Input
                value={formData.bank_country}
                onChange={(e) => setFormData({...formData, bank_country: e.target.value})}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Address</Label>
              <Input
                value={formData.bank_address1}
                onChange={(e) => setFormData({...formData, bank_address1: e.target.value})}
                placeholder="270 Park Avenue"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Bank City</Label>
              <Input
                value={formData.bank_city}
                onChange={(e) => setFormData({...formData, bank_city: e.target.value})}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Bank ZIP</Label>
              <Input
                value={formData.bank_zip_code}
                onChange={(e) => setFormData({...formData, bank_zip_code: e.target.value})}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>
      )}

      {/* CBIT-specific */}
      {formData.fiat_network === 'CBIT' && (
        <div className="space-y-2 border-t border-border pt-4">
          <Label>CBIT Wallet Address</Label>
          <Input
            value={formData.cbit_wallet_address}
            onChange={(e) => setFormData({...formData, cbit_wallet_address: e.target.value})}
            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            className="bg-secondary border-border font-mono"
          />
        </div>
      )}

      {/* DBS_ACT-specific */}
      {formData.fiat_network === 'DBS_ACT' && (
        <div className="space-y-2 border-t border-border pt-4">
          <Label>DBS ACT Account Number</Label>
          <Input
            value={formData.dbs_act_account_number}
            onChange={(e) => setFormData({...formData, dbs_act_account_number: e.target.value})}
            placeholder="1234567890"
            className="bg-secondary border-border"
          />
        </div>
      )}

      {/* CUBIX-specific */}
      {formData.fiat_network === 'CUBIX' && (
        <div className="space-y-2 border-t border-border pt-4">
          <Label>Cubix Account ID</Label>
          <Input
            value={formData.cubix_account_id}
            onChange={(e) => setFormData({...formData, cubix_account_id: e.target.value})}
            placeholder="CUBIX123456"
            className="bg-secondary border-border"
          />
        </div>
      )}

      {/* SCB-specific */}
      {formData.fiat_network === 'SCB' && (
        <div className="space-y-2 border-t border-border pt-4">
          <Label>SCB Account Number</Label>
          <Input
            value={formData.scb_account_number}
            onChange={(e) => setFormData({...formData, scb_account_number: e.target.value})}
            placeholder="SCB1234567890"
            className="bg-secondary border-border"
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !formData.account_id || !formData.fiat_network} className="flex-1 bg-module-payins hover:bg-module-payins/90">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Register Fiat Account'
          )}
        </Button>
      </div>
    </form>
  );
};
