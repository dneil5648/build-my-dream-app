import React, { useState } from 'react';
import { User, Building2, ArrowRight, ArrowLeft, Loader2, Check, Wallet, Plus, Shield, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreateIdentityRequest, CreateAccountRequest, PaxosAddress, PaxosIdentity } from '@/api/types';

interface WalletOnboardingWizardProps {
  onCreateIdentity: (data: CreateIdentityRequest) => Promise<PaxosIdentity | void>;
  onCreateWallet: (data: CreateAccountRequest) => Promise<void>;
  existingIdentities?: PaxosIdentity[];
  isLoading?: boolean;
  onCancel?: () => void;
}

type WalletType = 'personal' | 'business';
type Step = 'wallet-type' |
  'individual-basic' | 'individual-cip' | 'individual-address' |
  'business-basic' | 'business-address' |
  'review';

const emptyAddress: PaxosAddress = {
  country: 'USA',
  address1: '',
  address2: '',
  city: '',
  province: '',
  zip_code: '',
};

export const WalletOnboardingWizard: React.FC<WalletOnboardingWizardProps> = ({
  onCreateIdentity,
  onCreateWallet,
  existingIdentities = [],
  isLoading,
  onCancel,
}) => {
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [step, setStep] = useState<Step>('wallet-type');

  // Individual (Person) Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [cipId, setCipId] = useState('');
  const [cipIdType, setCipIdType] = useState<'SSN' | 'ITIN' | 'PASSPORT' | 'ID_CARD' | 'DRIVING_LICENSE'>('SSN');
  const [nationality, setNationality] = useState('USA');
  const [individualAddress, setIndividualAddress] = useState<PaxosAddress>(emptyAddress);

  // Business (Institution) Fields
  const [bizName, setBizName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizType, setBizType] = useState<'CORPORATION' | 'LLC' | 'PARTNERSHIP' | 'TRUST'>('LLC');
  const [bizSubType, setBizSubType] = useState('');
  const [bizCipId, setBizCipId] = useState('');
  const [bizGovtRegDate, setBizGovtRegDate] = useState('');
  const [bizAddress, setBizAddress] = useState<PaxosAddress>(emptyAddress);

  // Use existing identity
  const [useExistingIndividual, setUseExistingIndividual] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');

  const individualIdentities = existingIdentities.filter(i => i.identity_type === 'INDIVIDUAL');

  const getSteps = (): Step[] => {
    if (walletType === 'personal') {
      return ['wallet-type', 'individual-basic', 'individual-cip', 'individual-address', 'review'];
    } else if (walletType === 'business') {
      return ['wallet-type', 'individual-basic', 'individual-cip', 'individual-address', 'business-basic', 'business-address', 'review'];
    }
    return ['wallet-type'];
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(step);

  const getStepLabel = (s: Step): string => {
    const labels: Record<Step, string> = {
      'wallet-type': 'Type',
      'individual-basic': 'Personal Info',
      'individual-cip': 'Verification',
      'individual-address': 'Address',
      'business-basic': 'Business',
      'business-address': 'Biz Address',
      'review': 'Review',
    };
    return labels[s];
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
            person_details: {
              verifier_type: 'PAXOS',
              first_name: firstName || undefined,
              last_name: lastName,
              email: email || undefined,
              phone_number: phone || undefined,
              date_of_birth: dateOfBirth || undefined,
              cip_id: cipId || undefined,
              cip_id_type: cipIdType,
              cip_id_country: nationality,
              nationality: nationality,
              address: individualAddress,
            },
            customer_due_diligence: {
              purpose_of_account: 'SAVINGS',  // Default for personal wallets
            },
          };
          const result = await onCreateIdentity(individualData);
          identityIdForWallet = (result as PaxosIdentity)?.identity_id;
        }
      }

      // For business wallet, create individual first (if needed), then institution
      if (walletType === 'business') {
        let individualId = selectedExistingId;

        if (!useExistingIndividual) {
          const individualData: CreateIdentityRequest = {
            person_details: {
              verifier_type: 'PAXOS',
              first_name: firstName || undefined,
              last_name: lastName,
              email: email || undefined,
              phone_number: phone || undefined,
              date_of_birth: dateOfBirth || undefined,
              cip_id: cipId || undefined,
              cip_id_type: cipIdType,
              cip_id_country: nationality,
              nationality: nationality,
              address: individualAddress,
            },
            customer_due_diligence: {
              purpose_of_account: 'INVESTMENT_TRADING',
            },
          };
          const individualResult = await onCreateIdentity(individualData);
          individualId = (individualResult as PaxosIdentity)?.identity_id || '';
        }

        // Create institution identity
        const institutionData: CreateIdentityRequest = {
          institution_details: {
            name: bizName,
            email: bizEmail,
            phone_number: bizPhone,
            institution_type: bizType,
            institution_sub_type: bizSubType,
            cip_id: bizCipId,
            cip_id_type: 'EIN',
            cip_id_country: 'USA',
            govt_registration_date: bizGovtRegDate ? `${bizGovtRegDate}T00:00:00Z` : new Date().toISOString(),
            business_address: bizAddress,
            regulation_status: 'NON_REGULATED',
            trading_type: 'PRIVATE',
          },
          institution_members: individualId ? [{
            identity_id: individualId,
            roles: ['ACCOUNT_OPENER', 'BENEFICIAL_OWNER'],
          }] : [],
          customer_due_diligence: {
            industry_sector: bizSubType,
            purpose_of_account: 'INVESTMENT_TRADING',
          },
        };
        const institutionResult = await onCreateIdentity(institutionData);
        identityIdForWallet = (institutionResult as PaxosIdentity)?.identity_id;
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
      case 'individual-basic':
        if (useExistingIndividual) return !!selectedExistingId;
        return !!(lastName && email && phone && dateOfBirth);
      case 'individual-cip':
        if (useExistingIndividual) return true;
        return !!(cipId && nationality);
      case 'individual-address':
        if (useExistingIndividual) return true;
        return !!(individualAddress.address1 && individualAddress.city && individualAddress.province && individualAddress.zip_code);
      case 'business-basic':
        return !!(bizName && bizEmail && bizPhone && bizSubType && bizCipId && bizGovtRegDate);
      case 'business-address':
        return !!(bizAddress.address1 && bizAddress.city && bizAddress.province && bizAddress.zip_code);
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col max-h-[75vh]">
      {/* Progress Steps - only show after type selection */}
      {step !== 'wallet-type' && (
        <div className="flex-shrink-0 flex items-center justify-between mb-4 pb-2">
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

      {/* Step Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2">
        {/* WALLET TYPE SELECTION */}
        {step === 'wallet-type' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Choose Wallet Type</h3>
            <p className="text-muted-foreground">Select the type of wallet you want to create.</p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setWalletType('personal');
                  handleNext();
                }}
                className="p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left group"
              >
                <User className="h-8 w-8 mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                <h4 className="font-semibold text-foreground">Personal Wallet</h4>
                <p className="text-sm text-muted-foreground mt-1">For individual use</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWalletType('business');
                  handleNext();
                }}
                className="p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left group"
              >
                <Building2 className="h-8 w-8 mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                <h4 className="font-semibold text-foreground">Business Wallet</h4>
                <p className="text-sm text-muted-foreground mt-1">For organizations</p>
              </button>
            </div>
          </div>
        )}

        {/* INDIVIDUAL BASIC INFO */}
        {step === 'individual-basic' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {walletType === 'business' ? 'Authorized Representative' : 'Personal Information'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {walletType === 'business'
                    ? 'Individual authorized to manage the wallet'
                    : 'Your personal details for identity verification'}
                </p>
              </div>
            </div>

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
                    <Label>First Name</Label>
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

                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* INDIVIDUAL CIP & VERIFICATION */}
        {step === 'individual-cip' && !useExistingIndividual && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Identity Verification</h3>
                <p className="text-sm text-muted-foreground">Government-issued identification</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tax ID / SSN / ITIN *</Label>
              <Input
                value={cipId}
                onChange={(e) => setCipId(e.target.value)}
                placeholder="XXX-XX-XXXX"
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">For USA citizens, use SSN or ITIN</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Type *</Label>
                <Select value={cipIdType} onValueChange={(v: any) => setCipIdType(v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SSN">SSN</SelectItem>
                    <SelectItem value="ITIN">ITIN</SelectItem>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="ID_CARD">ID Card</SelectItem>
                    <SelectItem value="DRIVING_LICENSE">Driver's License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nationality *</Label>
                <Input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="USA"
                  maxLength={3}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </div>
        )}

        {step === 'individual-cip' && useExistingIndividual && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Using Existing Identity</h3>
                <p className="text-sm text-muted-foreground">You're using a previously verified identity</p>
              </div>
            </div>
          </div>
        )}

        {/* INDIVIDUAL ADDRESS */}
        {step === 'individual-address' && !useExistingIndividual && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Residential Address</h3>
            <p className="text-muted-foreground">Your physical address</p>

            <div className="space-y-2">
              <Label>Address Line 1 *</Label>
              <Input
                value={individualAddress.address1}
                onChange={(e) => setIndividualAddress({ ...individualAddress, address1: e.target.value })}
                placeholder="123 Main Street"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input
                value={individualAddress.address2}
                onChange={(e) => setIndividualAddress({ ...individualAddress, address2: e.target.value })}
                placeholder="Apt, Suite, Unit"
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                <Label>State *</Label>
                <Input
                  value={individualAddress.province}
                  onChange={(e) => setIndividualAddress({ ...individualAddress, province: e.target.value })}
                  placeholder="NY"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP *</Label>
                <Input
                  value={individualAddress.zip_code}
                  onChange={(e) => setIndividualAddress({ ...individualAddress, zip_code: e.target.value })}
                  placeholder="10001"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Country *</Label>
              <Input
                value={individualAddress.country}
                onChange={(e) => setIndividualAddress({ ...individualAddress, country: e.target.value })}
                placeholder="USA"
                maxLength={3}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        )}

        {step === 'individual-address' && useExistingIndividual && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Identity Verified</h3>
                <p className="text-sm text-muted-foreground">Using previously verified identity</p>
              </div>
            </div>
          </div>
        )}

        {/* BUSINESS BASIC INFO */}
        {step === 'business-basic' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Business Information</h3>
                <p className="text-sm text-muted-foreground">Basic details about your business</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Legal Business Name *</Label>
              <Input
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="Acme Corporation"
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Email *</Label>
                <Input
                  type="email"
                  value={bizEmail}
                  onChange={(e) => setBizEmail(e.target.value)}
                  placeholder="contact@business.com"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Business Phone *</Label>
                <Input
                  type="tel"
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  placeholder="+1 555-1234"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Type *</Label>
                <Select value={bizType} onValueChange={(v: any) => setBizType(v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LLC">LLC</SelectItem>
                    <SelectItem value="CORPORATION">Corporation</SelectItem>
                    <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                    <SelectItem value="TRUST">Trust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Input
                  value={bizSubType}
                  onChange={(e) => setBizSubType(e.target.value)}
                  placeholder="e.g., Technology, Retail"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax ID (EIN) *</Label>
                <Input
                  value={bizCipId}
                  onChange={(e) => setBizCipId(e.target.value)}
                  placeholder="XX-XXXXXXX"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Registration Date *</Label>
                <Input
                  type="date"
                  value={bizGovtRegDate}
                  onChange={(e) => setBizGovtRegDate(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </div>
        )}

        {/* BUSINESS ADDRESS */}
        {step === 'business-address' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Business Address</h3>
            <p className="text-muted-foreground">Primary business location</p>

            <div className="space-y-2">
              <Label>Address Line 1 *</Label>
              <Input
                value={bizAddress.address1}
                onChange={(e) => setBizAddress({ ...bizAddress, address1: e.target.value })}
                placeholder="123 Business Ave"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input
                value={bizAddress.address2}
                onChange={(e) => setBizAddress({ ...bizAddress, address2: e.target.value })}
                placeholder="Suite, Floor"
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  value={bizAddress.city}
                  onChange={(e) => setBizAddress({ ...bizAddress, city: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input
                  value={bizAddress.province}
                  onChange={(e) => setBizAddress({ ...bizAddress, province: e.target.value })}
                  placeholder="NY"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP *</Label>
                <Input
                  value={bizAddress.zip_code}
                  onChange={(e) => setBizAddress({ ...bizAddress, zip_code: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Country *</Label>
              <Input
                value={bizAddress.country}
                onChange={(e) => setBizAddress({ ...bizAddress, country: e.target.value })}
                placeholder="USA"
                maxLength={3}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        )}

        {/* REVIEW */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Review & Create Wallet</h3>
                <p className="text-sm text-muted-foreground">Verify all details before creating your wallet</p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="glass rounded-lg p-4">
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
              </div>

              <div className="glass rounded-lg p-4">
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
                    <span className="text-muted-foreground">Nationality:</span>
                    <span className="text-foreground">{nationality}</span>
                  </div>
                )}
              </div>

              {walletType === 'business' && (
                <div className="glass rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Business Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Legal Name:</span>
                    <span className="text-foreground">{bizName}</span>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-foreground">{bizType}</span>
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="text-foreground">{bizSubType}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground">{bizEmail}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons - Fixed at bottom */}
      <div className="flex-shrink-0 flex justify-between pt-4 border-t border-border mt-4">
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
