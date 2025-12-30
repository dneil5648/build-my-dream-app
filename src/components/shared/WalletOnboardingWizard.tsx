import React, { useState } from 'react';
import { User, Building2, ArrowRight, ArrowLeft, Loader2, Check, Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateIdentityRequest, CreateAccountRequest, IdentityType, Address, PaxosIdentity } from '@/api/types';

interface WalletOnboardingWizardProps {
  onCreateIdentity: (data: CreateIdentityRequest) => Promise<PaxosIdentity | void>;
  onCreateWallet: (data: CreateAccountRequest) => Promise<void>;
  existingIdentities?: PaxosIdentity[];
  isLoading?: boolean;
  onCancel?: () => void;
  accentColor?: string;
}

type WalletType = 'personal' | 'business';
type Step = 'wallet-type' | 'individual-details' | 'individual-address' | 'institution-details' | 'institution-address' | 'wallet-name' | 'review';

const emptyAddress: Address = {
  street_address: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
};

export const WalletOnboardingWizard: React.FC<WalletOnboardingWizardProps> = ({
  onCreateIdentity,
  onCreateWallet,
  existingIdentities = [],
  isLoading,
  onCancel,
  accentColor = 'primary',
}) => {
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [step, setStep] = useState<Step>('wallet-type');
  
  // Individual fields (required for both personal and business wallets)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [taxId, setTaxId] = useState('');
  const [individualAddress, setIndividualAddress] = useState<Address>(emptyAddress);
  
  // Institution fields (only for business wallets)
  const [legalName, setLegalName] = useState('');
  const [dba, setDba] = useState('');
  const [entityType, setEntityType] = useState('');
  const [institutionEmail, setInstitutionEmail] = useState('');
  const [institutionPhone, setInstitutionPhone] = useState('');
  const [institutionTaxId, setInstitutionTaxId] = useState('');
  const [institutionAddress, setInstitutionAddress] = useState<Address>(emptyAddress);
  
  // Wallet name
  const [walletName, setWalletName] = useState('');
  
  // Created identity IDs for linking
  const [createdIndividualId, setCreatedIndividualId] = useState<string | null>(null);
  const [createdInstitutionId, setCreatedInstitutionId] = useState<string | null>(null);
  
  // Use existing identity
  const [useExistingIndividual, setUseExistingIndividual] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');

  const individualIdentities = existingIdentities.filter(i => i.identity_type === 'INDIVIDUAL');

  const getSteps = (): Step[] => {
    if (walletType === 'personal') {
      return ['wallet-type', 'individual-details', 'individual-address', 'wallet-name', 'review'];
    } else if (walletType === 'business') {
      return ['wallet-type', 'individual-details', 'individual-address', 'institution-details', 'institution-address', 'wallet-name', 'review'];
    }
    return ['wallet-type'];
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(step);

  const getStepLabel = (s: Step): string => {
    switch (s) {
      case 'wallet-type': return 'Type';
      case 'individual-details': return 'Personal';
      case 'individual-address': return 'Address';
      case 'institution-details': return 'Business';
      case 'institution-address': return 'Business Address';
      case 'wallet-name': return 'Name';
      case 'review': return 'Review';
      default: return '';
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    try {
      let identityIdForWallet: string | undefined;

      // For personal wallet, create individual identity
      if (walletType === 'personal') {
        if (useExistingIndividual && selectedExistingId) {
          identityIdForWallet = selectedExistingId;
        } else {
          const individualData: CreateIdentityRequest = {
            type: 'INDIVIDUAL',
            individual: {
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone_number: phone,
              date_of_birth: dateOfBirth,
              tax_identification_number: taxId,
              address: individualAddress,
            },
          };
          const result = await onCreateIdentity(individualData);
          identityIdForWallet = (result as PaxosIdentity)?.identity_id || createdIndividualId || undefined;
        }
      }

      // For business wallet, create individual first (if needed), then institution
      if (walletType === 'business') {
        let individualId = selectedExistingId;
        
        if (!useExistingIndividual) {
          const individualData: CreateIdentityRequest = {
            type: 'INDIVIDUAL',
            individual: {
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone_number: phone,
              date_of_birth: dateOfBirth,
              tax_identification_number: taxId,
              address: individualAddress,
            },
          };
          const individualResult = await onCreateIdentity(individualData);
          individualId = (individualResult as PaxosIdentity)?.identity_id || '';
        }

        // Create institution identity
        const institutionData: CreateIdentityRequest = {
          type: 'INSTITUTION',
          institution: {
            legal_name: legalName,
            doing_business_as: dba,
            email: institutionEmail,
            phone_number: institutionPhone,
            entity_type: entityType,
            tax_identification_number: institutionTaxId,
            address: institutionAddress,
          },
        };
        const institutionResult = await onCreateIdentity(institutionData);
        identityIdForWallet = (institutionResult as PaxosIdentity)?.identity_id || undefined;
      }

      // Create the wallet (account)
      await onCreateWallet({
        identity_id: identityIdForWallet || '',
      });
    } catch (error) {
      throw error;
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'wallet-type':
        return walletType !== null;
      case 'individual-details':
        if (useExistingIndividual) return !!selectedExistingId;
        return !!(firstName && lastName && email && phone && dateOfBirth && taxId);
      case 'individual-address':
        if (useExistingIndividual) return true;
        return !!(individualAddress.street_address && individualAddress.city && individualAddress.state && individualAddress.postal_code && individualAddress.country);
      case 'institution-details':
        return !!(legalName && dba && institutionEmail && institutionPhone && entityType && institutionTaxId);
      case 'institution-address':
        return !!(institutionAddress.street_address && institutionAddress.city && institutionAddress.state && institutionAddress.postal_code && institutionAddress.country);
      case 'wallet-name':
        return true; // Optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps - only show after type selection */}
      {step !== 'wallet-type' && (
        <div className="flex items-center justify-between mb-8">
          {steps.slice(1).map((s, index) => (
            <React.Fragment key={s}>
              <div className="flex items-center flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index + 1 <= currentStepIndex 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {index + 1 < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-xs hidden md:inline whitespace-nowrap ${
                  index + 1 <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {getStepLabel(s)}
                </span>
              </div>
              {index < steps.slice(1).length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 min-w-[20px] transition-colors ${
                  index + 1 < currentStepIndex ? 'bg-primary' : 'bg-secondary'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step Content */}
      {step === 'wallet-type' && (
        <div className="space-y-4">
          <p className="text-muted-foreground">Choose the type of wallet you want to create.</p>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              type="button"
              onClick={() => setWalletType('personal')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                walletType === 'personal'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <User className={`h-8 w-8 mb-3 ${walletType === 'personal' ? 'text-primary' : 'text-muted-foreground'}`} />
              <h4 className="font-semibold text-foreground">Personal Wallet</h4>
              <p className="text-sm text-muted-foreground mt-1">For individual use</p>
            </button>
            
            <button
              type="button"
              onClick={() => setWalletType('business')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                walletType === 'business'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Building2 className={`h-8 w-8 mb-3 ${walletType === 'business' ? 'text-primary' : 'text-muted-foreground'}`} />
              <h4 className="font-semibold text-foreground">Business Wallet</h4>
              <p className="text-sm text-muted-foreground mt-1">For organizations</p>
              <p className="text-xs text-muted-foreground mt-2">Requires individual verification first</p>
            </button>
          </div>
        </div>
      )}

      {step === 'individual-details' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            {walletType === 'business' ? 'Authorized Representative' : 'Personal Information'}
          </h3>
          <p className="text-muted-foreground">
            {walletType === 'business' 
              ? 'First, we need to verify an individual who will represent the business.'
              : 'Enter your personal details to verify your identity.'}
          </p>

          {individualIdentities.length > 0 && (
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useExistingIndividual}
                  onChange={(e) => setUseExistingIndividual(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">Use an existing verified identity</span>
              </label>
              
              {useExistingIndividual && (
                <div className="mt-3">
                  <Select value={selectedExistingId} onValueChange={setSelectedExistingId}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select an identity" />
                    </SelectTrigger>
                    <SelectContent>
                      {individualIdentities.map((identity) => (
                        <SelectItem key={identity.identity_id} value={identity.identity_id}>
                          {identity.name} - {identity.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {!useExistingIndividual && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-1234"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax ID (SSN/TIN) *</Label>
                  <Input
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="XXX-XX-XXXX"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'individual-address' && !useExistingIndividual && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Residential Address</h3>
          <p className="text-muted-foreground">Enter your physical address.</p>
          
          <div className="space-y-2">
            <Label>Street Address *</Label>
            <Input
              value={individualAddress.street_address}
              onChange={(e) => setIndividualAddress({ ...individualAddress, street_address: e.target.value })}
              placeholder="123 Main Street"
              className="bg-secondary border-border"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={individualAddress.city}
                onChange={(e) => setIndividualAddress({ ...individualAddress, city: e.target.value })}
                placeholder="New York"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>State/Province *</Label>
              <Input
                value={individualAddress.state}
                onChange={(e) => setIndividualAddress({ ...individualAddress, state: e.target.value })}
                placeholder="NY"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Postal Code *</Label>
              <Input
                value={individualAddress.postal_code}
                onChange={(e) => setIndividualAddress({ ...individualAddress, postal_code: e.target.value })}
                placeholder="10001"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Country *</Label>
              <Input
                value={individualAddress.country}
                onChange={(e) => setIndividualAddress({ ...individualAddress, country: e.target.value })}
                placeholder="USA"
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>
      )}

      {step === 'individual-address' && useExistingIndividual && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Using Existing Identity</h3>
          <p className="text-muted-foreground">You're using a previously verified identity. Click next to continue.</p>
          
          <div className="p-4 rounded-lg bg-success/10 border border-success/30">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-success" />
              <span className="text-foreground">Identity already verified</span>
            </div>
          </div>
        </div>
      )}

      {step === 'institution-details' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Business Information</h3>
          <p className="text-muted-foreground">Enter your organization's details.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Legal Name *</Label>
              <Input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Acme Corporation Inc."
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Doing Business As (DBA) *</Label>
              <Input
                value={dba}
                onChange={(e) => setDba(e.target.value)}
                placeholder="Acme Corp"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entity Type *</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="CORPORATION">Corporation</SelectItem>
                  <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                  <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                  <SelectItem value="TRUST">Trust</SelectItem>
                  <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tax ID (EIN) *</Label>
              <Input
                value={institutionTaxId}
                onChange={(e) => setInstitutionTaxId(e.target.value)}
                placeholder="XX-XXXXXXX"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Email *</Label>
              <Input
                type="email"
                value={institutionEmail}
                onChange={(e) => setInstitutionEmail(e.target.value)}
                placeholder="contact@acme.com"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Business Phone *</Label>
              <Input
                type="tel"
                value={institutionPhone}
                onChange={(e) => setInstitutionPhone(e.target.value)}
                placeholder="+1 555-1234"
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>
      )}

      {step === 'institution-address' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Business Address</h3>
          <p className="text-muted-foreground">Enter your organization's physical address.</p>
          
          <div className="space-y-2">
            <Label>Street Address *</Label>
            <Input
              value={institutionAddress.street_address}
              onChange={(e) => setInstitutionAddress({ ...institutionAddress, street_address: e.target.value })}
              placeholder="123 Business Ave"
              className="bg-secondary border-border"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={institutionAddress.city}
                onChange={(e) => setInstitutionAddress({ ...institutionAddress, city: e.target.value })}
                placeholder="New York"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>State/Province *</Label>
              <Input
                value={institutionAddress.state}
                onChange={(e) => setInstitutionAddress({ ...institutionAddress, state: e.target.value })}
                placeholder="NY"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Postal Code *</Label>
              <Input
                value={institutionAddress.postal_code}
                onChange={(e) => setInstitutionAddress({ ...institutionAddress, postal_code: e.target.value })}
                placeholder="10001"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Country *</Label>
              <Input
                value={institutionAddress.country}
                onChange={(e) => setInstitutionAddress({ ...institutionAddress, country: e.target.value })}
                placeholder="USA"
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>
      )}

      {step === 'wallet-name' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Name Your Wallet</h3>
          <p className="text-muted-foreground">Give your wallet a memorable name (optional).</p>
          
          <div className="space-y-2">
            <Label>Wallet Name</Label>
            <Input
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              placeholder={walletType === 'personal' ? 'My Personal Wallet' : 'Business Wallet'}
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use the default name
            </p>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Review & Create Wallet</h3>
          <p className="text-muted-foreground">Please verify all details before creating your wallet.</p>
          
          <div className="space-y-4 mt-6">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet Type
              </h4>
              <div className="flex items-center gap-2">
                {walletType === 'personal' ? (
                  <User className="h-5 w-5 text-primary" />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
                <span className="text-foreground capitalize">{walletType} Wallet</span>
              </div>
              {walletName && (
                <p className="text-sm text-muted-foreground mt-2">Name: {walletName}</p>
              )}
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                {walletType === 'business' ? 'Authorized Representative' : 'Personal Details'}
              </h4>
              {useExistingIndividual ? (
                <p className="text-sm text-foreground">Using existing verified identity</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="text-foreground">{firstName} {lastName}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{email}</span>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-foreground">{phone}</span>
                </div>
              )}
            </div>
            
            {walletType === 'business' && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Legal Name:</span>
                  <span className="text-foreground">{legalName}</span>
                  <span className="text-muted-foreground">DBA:</span>
                  <span className="text-foreground">{dba}</span>
                  <span className="text-muted-foreground">Entity Type:</span>
                  <span className="text-foreground">{entityType}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{institutionEmail}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-border">
        <div>
          {step !== 'wallet-type' ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
        
        <div>
          {step !== 'review' ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-primary hover:bg-primary/90"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Wallet...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wallet
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
