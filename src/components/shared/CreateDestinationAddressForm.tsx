import React, { useState } from 'react';
import { Loader2, Bookmark, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PaxosAccount, CryptoNetwork, CreateCryptoDestinationAddressRequest, TravelRuleMetadata } from '@/api/types';

interface CreateDestinationAddressFormProps {
  accounts: PaxosAccount[];
  onSubmit: (data: CreateCryptoDestinationAddressRequest) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

const CRYPTO_NETWORKS: { value: CryptoNetwork; label: string; addressHint: string; examples: string[] }[] = [
  { 
    value: 'BITCOIN', 
    label: 'Bitcoin', 
    addressHint: 'Legacy (1...), SegWit (3...), or Native SegWit (bc1...)',
    examples: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh']
  },
  { 
    value: 'ETHEREUM', 
    label: 'Ethereum', 
    addressHint: '0x... (42 characters)',
    examples: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb']
  },
  { 
    value: 'POLYGON', 
    label: 'Polygon', 
    addressHint: '0x... (same as Ethereum)',
    examples: ['0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063']
  },
  { 
    value: 'SOLANA', 
    label: 'Solana', 
    addressHint: 'Base58 encoded (32-44 characters)',
    examples: ['7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV']
  },
  { 
    value: 'LITECOIN', 
    label: 'Litecoin', 
    addressHint: 'Legacy (L...), SegWit (M...), or Native SegWit (ltc1...)',
    examples: ['ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kgmn4n9']
  },
];

type CustodianType = 'PRIVATE' | 'VASP';
type BeneficiaryType = 'person' | 'institution' | 'none';

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
    nickname: '',
    bookmarked_status: false,
  });

  const [travelRuleEnabled, setTravelRuleEnabled] = useState(false);
  const [custodianType, setCustodianType] = useState<CustodianType>('PRIVATE');
  const [beneficiaryType, setBeneficiaryType] = useState<BeneficiaryType>('none');
  const [beneficiaryFirstName, setBeneficiaryFirstName] = useState('');
  const [beneficiaryLastName, setBeneficiaryLastName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [vaspId, setVaspId] = useState('');

  const selectedNetwork = CRYPTO_NETWORKS.find(n => n.value === formData.crypto_network);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.crypto_network || !formData.address) return;

    let travelrule_metadata: TravelRuleMetadata | undefined;

    if (travelRuleEnabled) {
      travelrule_metadata = {
        custodian_type: custodianType,
      };

      if (beneficiaryType === 'person' && beneficiaryFirstName && beneficiaryLastName) {
        travelrule_metadata.beneficiary = {
          person_details: {
            first_name: beneficiaryFirstName,
            last_name: beneficiaryLastName,
          },
        };
      } else if (beneficiaryType === 'institution' && institutionName) {
        travelrule_metadata.beneficiary = {
          institution_details: {
            name: institutionName,
          },
        };
      }

      if (custodianType === 'VASP' && vaspId) {
        travelrule_metadata.vasp = { id: vaspId };
      }
    }

    await onSubmit({
      account_id: formData.account_id,
      crypto_network: formData.crypto_network as CryptoNetwork,
      address: formData.address.trim(),
      nickname: formData.nickname.trim() || undefined,
      bookmarked_status: formData.bookmarked_status || undefined,
      travelrule_metadata,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Selection */}
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
            {accounts.map((account, index) => (
              <SelectItem key={account.id} value={account.id}>
                {account.nickname || `Account ${index + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Network Selection */}
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

      {/* Wallet Address */}
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

      {/* Nickname */}
      <div className="space-y-2">
        <Label>Nickname (Optional)</Label>
        <Input
          value={formData.nickname}
          onChange={(e) => setFormData({...formData, nickname: e.target.value})}
          placeholder="e.g., My Hardware Wallet, Coinbase Deposit"
          className="bg-secondary border-border"
        />
        <p className="text-xs text-muted-foreground">
          A friendly name to identify this address
        </p>
      </div>

      {/* Bookmark Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Bookmark Address</p>
            <p className="text-xs text-muted-foreground">Quick access in withdrawal list</p>
          </div>
        </div>
        <Switch
          checked={formData.bookmarked_status}
          onCheckedChange={(checked) => setFormData({...formData, bookmarked_status: checked})}
        />
      </div>

      {/* Travel Rule Section */}
      <Collapsible open={travelRuleEnabled} onOpenChange={setTravelRuleEnabled}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between">
            <span>Travel Rule Compliance (Optional)</span>
            <span className="text-xs text-muted-foreground">
              {travelRuleEnabled ? 'Enabled' : 'Click to configure'}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4 p-4 rounded-lg border border-border bg-secondary/30">
          <p className="text-xs text-muted-foreground">
            Travel rule compliance is required for transfers exceeding $3,000 USD.
          </p>

          {/* Custodian Type */}
          <div className="space-y-2">
            <Label>Custodian Type</Label>
            <Select value={custodianType} onValueChange={(v) => setCustodianType(v as CustodianType)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Private (Self-custody wallet)</SelectItem>
                <SelectItem value="VASP">VASP (Exchange or custodian)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* VASP ID (only for VASP custodian) */}
          {custodianType === 'VASP' && (
            <div className="space-y-2">
              <Label>VASP ID (Optional)</Label>
              <Input
                value={vaspId}
                onChange={(e) => setVaspId(e.target.value)}
                placeholder="e.g., vasp_coinbase_001"
                className="bg-secondary border-border"
              />
            </div>
          )}

          {/* Beneficiary Type */}
          <div className="space-y-2">
            <Label>Beneficiary Information</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={beneficiaryType === 'none' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBeneficiaryType('none')}
              >
                None
              </Button>
              <Button
                type="button"
                variant={beneficiaryType === 'person' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBeneficiaryType('person')}
                className="flex items-center gap-1"
              >
                <User className="h-3 w-3" /> Individual
              </Button>
              <Button
                type="button"
                variant={beneficiaryType === 'institution' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBeneficiaryType('institution')}
                className="flex items-center gap-1"
              >
                <Building className="h-3 w-3" /> Institution
              </Button>
            </div>
          </div>

          {/* Person Details */}
          {beneficiaryType === 'person' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={beneficiaryFirstName}
                  onChange={(e) => setBeneficiaryFirstName(e.target.value)}
                  placeholder="John"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={beneficiaryLastName}
                  onChange={(e) => setBeneficiaryLastName(e.target.value)}
                  placeholder="Doe"
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          )}

          {/* Institution Details */}
          {beneficiaryType === 'institution' && (
            <div className="space-y-2">
              <Label>Institution Name</Label>
              <Input
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="e.g., Coinbase Exchange"
                className="bg-secondary border-border"
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Action Buttons */}
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
