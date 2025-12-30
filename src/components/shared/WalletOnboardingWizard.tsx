import React, { useState } from 'react';
import { User, Building2, ArrowRight, ArrowLeft, Loader2, Check, Wallet, Plus, Shield, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateIdentityRequest, CreateAccountRequest, PaxosAddress, PaxosIdentity, ModuleName } from '@/api/types';
import { 
  INDUSTRY_SECTORS, 
  CIP_ID_TYPES, 
  INSTITUTION_TYPES,
  ACCOUNT_PURPOSES,
  EMPLOYMENT_STATUSES,
  SOURCE_OF_WEALTH,
  SOURCE_OF_FUNDS,
} from '@/lib/constants';
import { getModuleIdentityConfig } from '@/pages/config/ConfigPage';

interface WalletOnboardingWizardProps {
  onCreateIdentity: (data: CreateIdentityRequest) => Promise<PaxosIdentity | void>;
  onCreateWallet: (data: CreateAccountRequest) => Promise<void>;
  existingIdentities?: PaxosIdentity[];
  isLoading?: boolean;
  onCancel?: () => void;
  module?: ModuleName;
}

type WalletType = 'personal' | 'business';
type Step = 'wallet-type' | 'personal-info' | 'address' | 'cdd' | 'business-info' | 'business-address' | 'business-cdd' | 'review';

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
  module = 'WHITE_LABEL',
}) => {
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [step, setStep] = useState<Step>('wallet-type');

  // Individual Fields - only last_name required per API
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [cipId, setCipId] = useState('');
  const [cipIdType, setCipIdType] = useState<string>('SSN');
  const [nationality, setNationality] = useState('USA');
  const [individualAddress, setIndividualAddress] = useState<PaxosAddress>(emptyAddress);

  // Individual CDD - REQUIRED
  const [purposeOfAccount, setPurposeOfAccount] = useState<string>('');
  const [employmentStatus, setEmploymentStatus] = useState<string>('');
  const [sourceOfWealth, setSourceOfWealth] = useState<string>('');
  const [sourceOfFunds, setSourceOfFunds] = useState<string>('');

  // Business Fields - all required per API
  const [bizName, setBizName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizType, setBizType] = useState<string>('LLC');
  const [bizSubType, setBizSubType] = useState('');
  const [bizCipId, setBizCipId] = useState('');
  const [bizGovtRegDate, setBizGovtRegDate] = useState('');
  const [bizAddress, setBizAddress] = useState<PaxosAddress>(emptyAddress);

  // Business CDD - REQUIRED
  const [bizPurpose, setBizPurpose] = useState<string>('');
  const [bizSourceOfFunds, setBizSourceOfFunds] = useState<string>('');

  // Use existing identity
  const [useExistingIndividual, setUseExistingIndividual] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');

  const individualIdentities = existingIdentities.filter(i => i.identity_type === 'INDIVIDUAL');

  const getSteps = (): Step[] => {
    if (walletType === 'personal') {
      return ['wallet-type', 'personal-info', 'address', 'cdd', 'review'];
    } else if (walletType === 'business') {
      return ['wallet-type', 'personal-info', 'address', 'cdd', 'business-info', 'business-address', 'business-cdd', 'review'];
    }
    return ['wallet-type'];
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(step);

  const getStepLabel = (s: Step): string => {
    const labels: Record<Step, string> = {
      'wallet-type': 'Type',
      'personal-info': 'Personal',
      'address': 'Address',
      'cdd': 'CDD',
      'business-info': 'Business',
      'business-address': 'Biz Address',
      'business-cdd': 'Biz CDD',
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
      // Get IDV config for passthrough verification
      const moduleConfig = getModuleIdentityConfig();
      const idvVendor = moduleConfig.idvVendor;

      // Helper to validate SSN format (XXX-XX-XXXX or XXXXXXXXX)
      const isValidSsn = (ssn: string) => /^\d{3}-?\d{2}-?\d{4}$/.test(ssn);
      
      // Only include cip_id if it's valid for the selected type
      const shouldIncludeCipId = () => {
        if (!cipId) return false;
        if (cipIdType === 'SSN' && !isValidSsn(cipId)) return false;
        return true;
      };

      let identityIdForWallet: string | undefined;

      if (walletType === 'personal') {
        if (useExistingIndividual && selectedExistingId) {
          identityIdForWallet = selectedExistingId;
        } else {
          const individualData: CreateIdentityRequest = {
            identity_request: {
              person_details: {
                verifier_type: idvVendor ? 'PASSTHROUGH' : 'PAXOS',
                passthrough_verifier_type: idvVendor ? idvVendor as any : undefined,
                passthrough_verified_at: idvVendor ? new Date().toISOString() : undefined,
                passthrough_verification_status: idvVendor ? 'APPROVED' : undefined,
                first_name: firstName || undefined,
                last_name: lastName,
                email: email || undefined,
                phone_number: phone || undefined,
                date_of_birth: dateOfBirth || undefined,
                cip_id: shouldIncludeCipId() ? cipId : undefined,
                cip_id_type: shouldIncludeCipId() ? cipIdType as any : undefined,
                cip_id_country: shouldIncludeCipId() ? nationality : undefined,
                nationality: nationality || undefined,
                address: individualAddress,
              },
              tax_details: shouldIncludeCipId() ? [{
                tax_payer_id: cipId,
                tax_payer_country: nationality,
                tin_verification_status: 'APPROVED',
              }] : undefined,
              customer_due_diligence: {
                purpose_of_account: purposeOfAccount as any,
                employment_status: employmentStatus as any,
                source_of_wealth: sourceOfWealth as any,
                source_of_funds: sourceOfFunds as any,
              },
            },
            module,
          };
          const result = await onCreateIdentity(individualData);
          identityIdForWallet = (result as PaxosIdentity)?.identity_id;
        }
      }

      if (walletType === 'business') {
        let individualId = selectedExistingId;

        if (!useExistingIndividual) {
          const individualData: CreateIdentityRequest = {
            identity_request: {
              person_details: {
                verifier_type: idvVendor ? 'PASSTHROUGH' : 'PAXOS',
                passthrough_verifier_type: idvVendor ? idvVendor as any : undefined,
                passthrough_verified_at: idvVendor ? new Date().toISOString() : undefined,
                passthrough_verification_status: idvVendor ? 'APPROVED' : undefined,
                first_name: firstName || undefined,
                last_name: lastName,
                email: email || undefined,
                phone_number: phone || undefined,
                date_of_birth: dateOfBirth || undefined,
                cip_id: shouldIncludeCipId() ? cipId : undefined,
                cip_id_type: shouldIncludeCipId() ? cipIdType as any : undefined,
                cip_id_country: shouldIncludeCipId() ? nationality : undefined,
                nationality: nationality || undefined,
                address: individualAddress,
              },
              tax_details: shouldIncludeCipId() ? [{
                tax_payer_id: cipId,
                tax_payer_country: nationality,
                tin_verification_status: 'APPROVED',
              }] : undefined,
              customer_due_diligence: {
                purpose_of_account: purposeOfAccount as any,
                employment_status: employmentStatus as any,
                source_of_wealth: sourceOfWealth as any,
                source_of_funds: sourceOfFunds as any,
              },
            },
            module,
          };
          const individualResult = await onCreateIdentity(individualData);
          individualId = (individualResult as PaxosIdentity)?.identity_id || '';
        }

        const institutionData: CreateIdentityRequest = {
          identity_request: {
            institution_details: {
              name: bizName,
              email: bizEmail,
              phone_number: bizPhone,
              institution_type: bizType as any,
              institution_sub_type: bizSubType,
              cip_id: bizCipId,
              cip_id_type: 'EIN',
              cip_id_country: 'USA',
              govt_registration_date: bizGovtRegDate ? `${bizGovtRegDate}T00:00:00Z` : new Date().toISOString(),
              business_address: bizAddress,
              incorporation_address: bizAddress, // Required by API
              regulation_status: 'NON_REGULATED',
              trading_type: 'PRIVATE',
            },
            institution_members: individualId ? [{
              identity_id: individualId,
              roles: ['ACCOUNT_OPENER', 'BENEFICIAL_OWNER'],
            }] : [],
            customer_due_diligence: {
              industry_sector: bizSubType,
              purpose_of_account: bizPurpose as any,
              source_of_funds: bizSourceOfFunds as any,
            },
          },
          module,
        };
        const institutionResult = await onCreateIdentity(institutionData);
        identityIdForWallet = (institutionResult as PaxosIdentity)?.identity_id;
      }

      await onCreateWallet({
        account_request: {
          identity_id: identityIdForWallet || '',
        },
        module,
      });
    } catch (error) {
      throw error;
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'wallet-type':
        return walletType !== null;
      case 'personal-info':
        if (useExistingIndividual) return !!selectedExistingId;
        // Only last_name required per API
        return !!lastName;
      case 'address':
        if (useExistingIndividual) return true;
        return !!(individualAddress.address1 && individualAddress.city && individualAddress.province && individualAddress.zip_code && individualAddress.country);
      case 'cdd':
        if (useExistingIndividual) return true;
        // CDD is mandatory
        return !!(purposeOfAccount && employmentStatus && sourceOfWealth && sourceOfFunds);
      case 'business-info':
        // All institution fields required
        return !!(bizName && bizEmail && bizPhone && bizSubType && bizCipId && bizGovtRegDate);
      case 'business-address':
        return !!(bizAddress.address1 && bizAddress.city && bizAddress.province && bizAddress.zip_code && bizAddress.country);
      case 'business-cdd':
        // Business CDD is mandatory
        return !!(bizPurpose && bizSourceOfFunds);
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col max-h-[70vh] overflow-hidden">
      {/* Progress Steps */}
      {step !== 'wallet-type' && (
        <div className="flex-shrink-0 flex items-center justify-between mb-6 pb-4 border-b border-border">
          {steps.slice(1).map((s, index) => (
            <React.Fragment key={s}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index + 1 <= currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1 < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:inline ${
                  index + 1 <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {getStepLabel(s)}
                </span>
              </div>
              {index < steps.slice(1).length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${
                  index + 1 < currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {/* WALLET TYPE */}
        {step === 'wallet-type' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground">Choose Wallet Type</h3>
              <p className="text-muted-foreground mt-1">Select the type of wallet to create</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setWalletType('personal'); handleNext(); }}
                className="p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <User className="h-10 w-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <h4 className="text-lg font-semibold text-foreground">Personal Wallet</h4>
                <p className="text-sm text-muted-foreground mt-1">For individual use</p>
              </button>

              <button
                type="button"
                onClick={() => { setWalletType('business'); handleNext(); }}
                className="p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <Building2 className="h-10 w-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <h4 className="text-lg font-semibold text-foreground">Business Wallet</h4>
                <p className="text-sm text-muted-foreground mt-1">For organizations</p>
              </button>
            </div>
          </div>
        )}

        {/* PERSONAL INFO */}
        {step === 'personal-info' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {walletType === 'business' ? 'Authorized Representative' : 'Personal Information'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {walletType === 'business' ? 'Individual authorized to manage the wallet' : 'Your personal details'}
                </p>
              </div>
            </div>

            {individualIdentities.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useExistingIndividual}
                    onChange={(e) => setUseExistingIndividual(e.target.checked)}
                    className="w-4 h-4 rounded"
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
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="bg-secondary border-border" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-1234" className="bg-secondary border-border" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="bg-secondary border-border" />
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Identity Verification (Optional)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>ID Number</Label>
                      <Input value={cipId} onChange={(e) => setCipId(e.target.value)} placeholder="XXX-XX-XXXX" className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Type</Label>
                      <Select value={cipIdType} onValueChange={setCipIdType}>
                        <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CIP_ID_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nationality</Label>
                      <Input value={nationality} onChange={(e) => setNationality(e.target.value.toUpperCase())} placeholder="USA" maxLength={3} className="bg-secondary border-border" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* INDIVIDUAL ADDRESS */}
        {step === 'address' && !useExistingIndividual && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Residential Address</h3>
                <p className="text-sm text-muted-foreground">Your physical address</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address Line 1 *</Label>
              <Input value={individualAddress.address1} onChange={(e) => setIndividualAddress({ ...individualAddress, address1: e.target.value })} placeholder="123 Main Street" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input value={individualAddress.address2} onChange={(e) => setIndividualAddress({ ...individualAddress, address2: e.target.value })} placeholder="Apt, Suite, Unit" className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>City *</Label><Input value={individualAddress.city} onChange={(e) => setIndividualAddress({ ...individualAddress, city: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>State *</Label><Input value={individualAddress.province} onChange={(e) => setIndividualAddress({ ...individualAddress, province: e.target.value })} placeholder="NY" className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>ZIP *</Label><Input value={individualAddress.zip_code} onChange={(e) => setIndividualAddress({ ...individualAddress, zip_code: e.target.value })} className="bg-secondary border-border" /></div>
            </div>
            <div className="space-y-2"><Label>Country *</Label><Input value={individualAddress.country} onChange={(e) => setIndividualAddress({ ...individualAddress, country: e.target.value.toUpperCase() })} placeholder="USA" maxLength={3} className="bg-secondary border-border" /></div>
          </div>
        )}

        {step === 'address' && useExistingIndividual && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Using Existing Identity</h3>
                <p className="text-sm text-muted-foreground">Address information is already on file</p>
              </div>
            </div>
          </div>
        )}

        {/* INDIVIDUAL CDD */}
        {step === 'cdd' && !useExistingIndividual && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Customer Due Diligence</h3>
                <p className="text-sm text-muted-foreground">Required compliance information</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose of Account *</Label>
              <Select value={purposeOfAccount} onValueChange={setPurposeOfAccount}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_PURPOSES.map((purpose) => (
                    <SelectItem key={purpose.value} value={purpose.value}>
                      {purpose.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Employment Status *</Label>
              <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source of Wealth *</Label>
              <Select value={sourceOfWealth} onValueChange={setSourceOfWealth}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select source of wealth" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OF_WEALTH.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source of Funds *</Label>
              <Select value={sourceOfFunds} onValueChange={setSourceOfFunds}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select source of funds" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OF_FUNDS.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 'cdd' && useExistingIndividual && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Using Existing Identity</h3>
                <p className="text-sm text-muted-foreground">Due diligence information is already on file</p>
              </div>
            </div>
          </div>
        )}

        {/* BUSINESS INFO */}
        {step === 'business-info' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Business Information</h3>
                <p className="text-sm text-muted-foreground">Details about your business</p>
              </div>
            </div>

            <div className="space-y-2"><Label>Legal Business Name *</Label><Input value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Acme Corporation" className="bg-secondary border-border" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Business Email *</Label><Input type="email" value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} placeholder="contact@business.com" className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Business Phone *</Label><Input type="tel" value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} placeholder="+1 555-1234" className="bg-secondary border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Type *</Label>
                <Select value={bizType} onValueChange={setBizType}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{INSTITUTION_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Select value={bizSubType} onValueChange={setBizSubType}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>{INDUSTRY_SECTORS.map((sector) => (<SelectItem key={sector.value} value={sector.value}>{sector.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4"><Shield className="h-4 w-4 text-primary" /><span className="font-medium text-foreground">Business Registration</span></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tax ID (EIN) *</Label><Input value={bizCipId} onChange={(e) => setBizCipId(e.target.value)} placeholder="XX-XXXXXXX" className="bg-secondary border-border" /></div>
                <div className="space-y-2"><Label>Registration Date *</Label><Input type="date" value={bizGovtRegDate} onChange={(e) => setBizGovtRegDate(e.target.value)} className="bg-secondary border-border" /></div>
              </div>
            </div>
          </div>
        )}

        {/* BUSINESS ADDRESS */}
        {step === 'business-address' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><MapPin className="h-5 w-5 text-primary" /></div>
              <div><h3 className="text-lg font-semibold text-foreground">Business Address</h3><p className="text-sm text-muted-foreground">Primary business location</p></div>
            </div>
            <div className="space-y-2"><Label>Address Line 1 *</Label><Input value={bizAddress.address1} onChange={(e) => setBizAddress({ ...bizAddress, address1: e.target.value })} placeholder="123 Business Ave" className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Address Line 2</Label><Input value={bizAddress.address2} onChange={(e) => setBizAddress({ ...bizAddress, address2: e.target.value })} placeholder="Suite, Floor" className="bg-secondary border-border" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>City *</Label><Input value={bizAddress.city} onChange={(e) => setBizAddress({ ...bizAddress, city: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>State *</Label><Input value={bizAddress.province} onChange={(e) => setBizAddress({ ...bizAddress, province: e.target.value })} placeholder="NY" className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>ZIP *</Label><Input value={bizAddress.zip_code} onChange={(e) => setBizAddress({ ...bizAddress, zip_code: e.target.value })} className="bg-secondary border-border" /></div>
            </div>
            <div className="space-y-2"><Label>Country *</Label><Input value={bizAddress.country} onChange={(e) => setBizAddress({ ...bizAddress, country: e.target.value.toUpperCase() })} placeholder="USA" maxLength={3} className="bg-secondary border-border" /></div>
          </div>
        )}

        {/* BUSINESS CDD */}
        {step === 'business-cdd' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Business Due Diligence</h3>
                <p className="text-sm text-muted-foreground">Required compliance information for the business</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose of Account *</Label>
              <Select value={bizPurpose} onValueChange={setBizPurpose}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_PURPOSES.map((purpose) => (
                    <SelectItem key={purpose.value} value={purpose.value}>
                      {purpose.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source of Funds *</Label>
              <Select value={bizSourceOfFunds} onValueChange={setBizSourceOfFunds}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select source of funds" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OF_FUNDS.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* REVIEW */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center"><Check className="h-5 w-5 text-success" /></div>
              <div><h3 className="text-lg font-semibold text-foreground">Review & Create Wallet</h3><p className="text-sm text-muted-foreground">Verify all details before creating</p></div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3"><Wallet className="h-4 w-4 text-primary" /><h4 className="font-medium text-foreground">Wallet Type</h4></div>
                <div className="flex items-center gap-2">{walletType === 'personal' ? <User className="h-4 w-4 text-muted-foreground" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}<span className="text-foreground capitalize">{walletType} Wallet</span></div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3"><User className="h-4 w-4 text-primary" /><h4 className="font-medium text-foreground">{walletType === 'business' ? 'Authorized Representative' : 'Personal Details'}</h4></div>
                {useExistingIndividual ? (<p className="text-sm text-foreground">Using existing verified identity</p>) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span><span className="text-foreground">{firstName} {lastName}</span>
                    {email && (<><span className="text-muted-foreground">Email:</span><span className="text-foreground">{email}</span></>)}
                    <span className="text-muted-foreground">Purpose:</span><span className="text-foreground">{ACCOUNT_PURPOSES.find(p => p.value === purposeOfAccount)?.label}</span>
                  </div>
                )}
              </div>
              {walletType === 'business' && (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-3"><Building2 className="h-4 w-4 text-primary" /><h4 className="font-medium text-foreground">Business Details</h4></div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Legal Name:</span><span className="text-foreground">{bizName}</span>
                    <span className="text-muted-foreground">Type:</span><span className="text-foreground">{INSTITUTION_TYPES.find(t => t.value === bizType)?.label}</span>
                    <span className="text-muted-foreground">Industry:</span><span className="text-foreground">{INDUSTRY_SECTORS.find(s => s.value === bizSubType)?.label}</span>
                    <span className="text-muted-foreground">Purpose:</span><span className="text-foreground">{ACCOUNT_PURPOSES.find(p => p.value === bizPurpose)?.label}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 flex justify-between pt-4 border-t border-border mt-6">
        <div>
          {step !== 'wallet-type' ? (<Button type="button" variant="outline" onClick={handleBack}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>) : onCancel ? (<Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>) : null}
        </div>
        <div>
          {step !== 'review' ? (<Button type="button" onClick={handleNext} disabled={!canProceed()}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>) : (
            <Button type="button" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>) : (<><Plus className="h-4 w-4 mr-2" />Create Wallet</>)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
