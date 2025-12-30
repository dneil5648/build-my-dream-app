import React, { useState } from 'react';
import { User, Building2, ArrowRight, ArrowLeft, Loader2, Check, DollarSign, Shield, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreateIdentityRequest, PaxosAddress, PaxosIdentity } from '@/api/types';
import { 
  INDUSTRY_SECTORS, 
  CIP_ID_TYPES, 
  INSTITUTION_TYPES,
  INSTITUTION_SUB_TYPES,
  REGULATION_STATUSES, 
  TRADING_TYPES,
  ACCOUNT_PURPOSES,
  EMPLOYMENT_STATUSES,
  SOURCE_OF_WEALTH,
  SOURCE_OF_FUNDS,
  MEMBER_ROLES,
} from '@/lib/constants';
import { Checkbox } from '@/components/ui/checkbox';
import { getModuleIdentityConfig } from '@/pages/config/ConfigPage';

interface InstitutionOnboardingWizardProps {
  onSubmit: (data: CreateIdentityRequest) => Promise<PaxosIdentity | void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

type Step = 'rep-info' | 'rep-address' | 'rep-cdd' | 'biz-info' | 'biz-address' | 'biz-details' | 'review';

const emptyAddress: PaxosAddress = {
  country: 'USA',
  address1: '',
  address2: '',
  city: '',
  province: '',
  zip_code: '',
};

export const InstitutionOnboardingWizard: React.FC<InstitutionOnboardingWizardProps> = ({
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>('rep-info');

  // Representative Fields - only last_name and address required per API
  const [repFirstName, setRepFirstName] = useState('');
  const [repLastName, setRepLastName] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repDateOfBirth, setRepDateOfBirth] = useState('');
  const [repCipId, setRepCipId] = useState('');
  const [repCipIdType, setRepCipIdType] = useState<string>('SSN');
  const [repNationality, setRepNationality] = useState('USA');
  const [repAddress, setRepAddress] = useState<PaxosAddress>(emptyAddress);

  // Representative CDD - REQUIRED
  const [repPurposeOfAccount, setRepPurposeOfAccount] = useState<string>('');
  const [repEmploymentStatus, setRepEmploymentStatus] = useState<string>('');
  const [repSourceOfWealth, setRepSourceOfWealth] = useState<string>('');
  const [repSourceOfFunds, setRepSourceOfFunds] = useState<string>('');

  // Business Fields - all required per API
  const [bizName, setBizName] = useState('');
  const [bizDBA, setBizDBA] = useState('');
  const [bizDescription, setBizDescription] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizType, setBizType] = useState<string>('CORPORATION');
  const [bizSubType, setBizSubType] = useState('');
  const [bizCipId, setBizCipId] = useState('');
  const [bizGovtRegDate, setBizGovtRegDate] = useState('');
  const [bizAddress, setBizAddress] = useState<PaxosAddress>(emptyAddress);

  // Regulatory & Financial
  const [bizRegulationStatus, setBizRegulationStatus] = useState<string>('NON_REGULATED');
  const [bizTradingType, setBizTradingType] = useState<string>('PRIVATE');
  const [bizIndustrySector, setBizIndustrySector] = useState('');
  const [bizPurpose, setBizPurpose] = useState('');
  const [bizSourceOfFunds, setBizSourceOfFunds] = useState('');
  const [bizSourceOfWealth, setBizSourceOfWealth] = useState('');

  // Representative Member Details
  const [repRoles, setRepRoles] = useState<string[]>(['BENEFICIAL_OWNER']);
  const [repPosition, setRepPosition] = useState('');
  const [repOwnership, setRepOwnership] = useState('');

  type MemberRole = 'BENEFICIAL_OWNER' | 'ACCOUNT_OPENER' | 'TRUSTEE' | 'AUTHORIZED_USER' |
    'GRANTOR' | 'MANAGEMENT_CONTROL_PERSON' | 'BENEFICIARY';

  const toggleRole = (role: string) => {
    setRepRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const steps: Step[] = ['rep-info', 'rep-address', 'rep-cdd', 'biz-info', 'biz-address', 'biz-details', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const getStepLabel = (s: Step): string => {
    const labels: Record<Step, string> = {
      'rep-info': 'Rep Info',
      'rep-address': 'Rep Address',
      'rep-cdd': 'Rep CDD',
      'biz-info': 'Business',
      'biz-address': 'Biz Address',
      'biz-details': 'Details',
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
    // Get IDV config for passthrough verification
    const moduleConfig = getModuleIdentityConfig();
    const idvVendor = moduleConfig.idvVendor;

    // Helper to validate SSN format (XXX-XX-XXXX or XXXXXXXXX)
    const isValidSsn = (ssn: string) => /^\d{3}-?\d{2}-?\d{4}$/.test(ssn);
    
    // Only include cip_id if it's valid for the selected type
    const shouldIncludeRepCipId = () => {
      if (!repCipId) return false;
      if (repCipIdType === 'SSN' && !isValidSsn(repCipId)) return false;
      return true;
    };

    // Step 1: Create representative (person) identity first
    const representativeData: CreateIdentityRequest = {
      person_details: {
        verifier_type: idvVendor ? 'PASSTHROUGH' : 'PAXOS',
        passthrough_verifier_type: idvVendor ? idvVendor as any : undefined,
        passthrough_verified_at: idvVendor ? new Date().toISOString() : undefined,
        passthrough_verification_status: idvVendor ? 'APPROVED' : undefined,
        last_name: repLastName,
        first_name: repFirstName || undefined,
        email: repEmail || undefined,
        phone_number: repPhone || undefined,
        date_of_birth: repDateOfBirth || undefined,
        cip_id: shouldIncludeRepCipId() ? repCipId : undefined,
        cip_id_type: shouldIncludeRepCipId() ? repCipIdType as any : undefined,
        cip_id_country: shouldIncludeRepCipId() ? repNationality : undefined,
        nationality: repNationality || undefined,
        address: repAddress,
      },
      tax_details: shouldIncludeRepCipId() ? [{
        tax_payer_id: repCipId,
        tax_payer_country: repNationality,
        tin_verification_status: 'APPROVED',
      }] : undefined,
      customer_due_diligence: {
        purpose_of_account: repPurposeOfAccount as any,
        employment_status: repEmploymentStatus as any,
        source_of_wealth: repSourceOfWealth as any,
        source_of_funds: repSourceOfFunds as any,
      },
    };

    // Create person identity and get the returned ID
    const personResult = await onSubmit(representativeData);
    const personIdentityId = (personResult as PaxosIdentity)?.identity_id;

    if (!personIdentityId) {
      throw new Error('Failed to create representative identity');
    }

    // Step 2: Create institution identity with the person as a member
    const institutionData: CreateIdentityRequest = {
      institution_details: {
        name: bizName,
        doing_business_as: bizDBA || undefined,
        business_description: bizDescription || undefined,
        email: bizEmail,
        phone_number: bizPhone,
        institution_type: bizType as any,
        institution_sub_type: bizSubType,
        cip_id: bizCipId,
        cip_id_type: 'EIN',
        cip_id_country: 'USA',
        govt_registration_date: bizGovtRegDate ? `${bizGovtRegDate}T00:00:00Z` : '',
        business_address: bizAddress,
        incorporation_address: bizAddress, // Required by API
        regulation_status: bizRegulationStatus as any,
        trading_type: bizTradingType as any,
      },
      institution_members: [{
        identity_id: personIdentityId,
        roles: repRoles as MemberRole[],
        ownership: repOwnership || '100',
        position: repPosition || 'Authorized Representative',
      }],
      tax_details: [{
        tax_payer_id: bizCipId,
        tax_payer_country: 'USA',
      }],
      customer_due_diligence: {
        industry_sector: bizIndustrySector || bizSubType,
        purpose_of_account: bizPurpose as any,
        source_of_funds: bizSourceOfFunds as any,
        source_of_wealth: bizSourceOfWealth as any,
        has_underlying_trust_structure: false,
        has_nominee_shareholders: false,
      },
    };

    await onSubmit(institutionData);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'rep-info':
        // Only last_name required per API spec
        return !!repLastName;
      case 'rep-address':
        return !!(repAddress.address1 && repAddress.city && repAddress.province && repAddress.zip_code && repAddress.country);
      case 'rep-cdd':
        // CDD is mandatory for representative
        return !!(repPurposeOfAccount && repEmploymentStatus && repSourceOfWealth && repSourceOfFunds);
      case 'biz-info':
        // All institution fields required per API
        return !!(bizName && bizEmail && bizPhone && bizType && bizSubType && bizCipId && bizGovtRegDate);
      case 'biz-address':
        return !!(bizAddress.address1 && bizAddress.city && bizAddress.province && bizAddress.zip_code && bizAddress.country);
      case 'biz-details':
        // Industry sector and CDD required for institutions
        return !!((bizIndustrySector || bizSubType) && bizPurpose && bizSourceOfFunds && bizSourceOfWealth && repRoles.length > 0);
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col max-h-[70vh] overflow-hidden">
      {/* Progress Steps */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6 pb-4 border-b border-border">
        {steps.map((s, index) => (
          <React.Fragment key={s}>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index <= currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`ml-2 text-xs font-medium hidden lg:inline ${
                index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {getStepLabel(s)}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                index < currentStepIndex ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {/* REPRESENTATIVE INFO */}
        {step === 'rep-info' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Authorized Representative</h3>
                <p className="text-sm text-muted-foreground">Person authorized to act for the business</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={repFirstName}
                  onChange={(e) => setRepFirstName(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={repLastName}
                  onChange={(e) => setRepLastName(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={repPhone}
                  onChange={(e) => setRepPhone(e.target.value)}
                  placeholder="+1 555-1234"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={repDateOfBirth}
                onChange={(e) => setRepDateOfBirth(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Identity Verification (Optional)</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <Input
                    value={repCipId}
                    onChange={(e) => setRepCipId(e.target.value)}
                    placeholder="XXX-XX-XXXX"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID Type</Label>
                  <Select value={repCipIdType} onValueChange={setRepCipIdType}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CIP_ID_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input
                    value={repNationality}
                    onChange={(e) => setRepNationality(e.target.value.toUpperCase())}
                    placeholder="USA"
                    maxLength={3}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPRESENTATIVE ADDRESS */}
        {step === 'rep-address' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Representative Address</h3>
                <p className="text-sm text-muted-foreground">Residential address of the authorized representative</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address Line 1 *</Label>
              <Input
                value={repAddress.address1}
                onChange={(e) => setRepAddress({ ...repAddress, address1: e.target.value })}
                placeholder="123 Main Street"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input
                value={repAddress.address2}
                onChange={(e) => setRepAddress({ ...repAddress, address2: e.target.value })}
                placeholder="Apt, Suite, Unit"
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  value={repAddress.city}
                  onChange={(e) => setRepAddress({ ...repAddress, city: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input
                  value={repAddress.province}
                  onChange={(e) => setRepAddress({ ...repAddress, province: e.target.value })}
                  placeholder="NY"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP *</Label>
                <Input
                  value={repAddress.zip_code}
                  onChange={(e) => setRepAddress({ ...repAddress, zip_code: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Country *</Label>
              <Input
                value={repAddress.country}
                onChange={(e) => setRepAddress({ ...repAddress, country: e.target.value.toUpperCase() })}
                placeholder="USA"
                maxLength={3}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        )}

        {/* REPRESENTATIVE CDD */}
        {step === 'rep-cdd' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Representative Due Diligence</h3>
                <p className="text-sm text-muted-foreground">Required compliance information for the representative</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose of Account *</Label>
              <Select value={repPurposeOfAccount} onValueChange={setRepPurposeOfAccount}>
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
              <Select value={repEmploymentStatus} onValueChange={setRepEmploymentStatus}>
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
              <Select value={repSourceOfWealth} onValueChange={setRepSourceOfWealth}>
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
              <Select value={repSourceOfFunds} onValueChange={setRepSourceOfFunds}>
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

        {/* BUSINESS INFO */}
        {step === 'biz-info' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Business Information</h3>
                <p className="text-sm text-muted-foreground">Organization details and registration</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Legal Business Name *</Label>
                <Input
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="Acme Corporation"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>DBA (Doing Business As)</Label>
                <Input
                  value={bizDBA}
                  onChange={(e) => setBizDBA(e.target.value)}
                  placeholder="Optional trade name"
                  className="bg-secondary border-border"
                />
              </div>
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
                <Select value={bizType} onValueChange={setBizType}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Business Sub-Type *</Label>
                <Select value={bizSubType} onValueChange={setBizSubType}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select sub-type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTION_SUB_TYPES.map((subType) => (
                      <SelectItem key={subType.value} value={subType.value}>
                        {subType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Business Registration</span>
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
          </div>
        )}

        {/* BUSINESS ADDRESS */}
        {step === 'biz-address' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Business Address</h3>
                <p className="text-sm text-muted-foreground">Primary business location</p>
              </div>
            </div>

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
                onChange={(e) => setBizAddress({ ...bizAddress, country: e.target.value.toUpperCase() })}
                placeholder="USA"
                maxLength={3}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Business Description</Label>
              <Textarea
                value={bizDescription}
                onChange={(e) => setBizDescription(e.target.value)}
                placeholder="Brief description of business activities"
                className="bg-secondary border-border min-h-[80px]"
              />
            </div>
          </div>
        )}

        {/* BUSINESS DETAILS */}
        {step === 'biz-details' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Business Details & Due Diligence</h3>
                <p className="text-sm text-muted-foreground">Regulatory and compliance information</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Industry Sector *</Label>
              <Select value={bizIndustrySector || bizSubType} onValueChange={setBizIndustrySector}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select industry sector" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_SECTORS.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Regulation Status</Label>
                <Select value={bizRegulationStatus} onValueChange={setBizRegulationStatus}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGULATION_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trading Type</Label>
                <Select value={bizTradingType} onValueChange={setBizTradingType}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Business Due Diligence *</span>
              </div>

              <div className="space-y-4">
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

                <div className="space-y-2">
                  <Label>Source of Wealth *</Label>
                  <Select value={bizSourceOfWealth} onValueChange={setBizSourceOfWealth}>
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
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Representative Membership Details</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Roles *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {MEMBER_ROLES.map((role) => (
                      <div key={role.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={role.value}
                          checked={repRoles.includes(role.value)}
                          onCheckedChange={() => toggleRole(role.value)}
                        />
                        <Label htmlFor={role.value} className="text-sm font-normal cursor-pointer">
                          {role.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      value={repPosition}
                      onChange={(e) => setRepPosition(e.target.value)}
                      placeholder="e.g., CEO, Director"
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ownership %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={repOwnership}
                      onChange={(e) => setRepOwnership(e.target.value)}
                      placeholder="e.g., 51"
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Review & Submit</h3>
                <p className="text-sm text-muted-foreground">Verify all information before submitting</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-foreground">Authorized Representative</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="text-foreground">{repFirstName} {repLastName}</span>
                  {repEmail && (
                    <>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="text-foreground">{repEmail}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">Employment:</span>
                  <span className="text-foreground">{EMPLOYMENT_STATUSES.find(e => e.value === repEmploymentStatus)?.label}</span>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-foreground">Business Information</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Legal Name:</span>
                  <span className="text-foreground">{bizName}</span>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-foreground">{INSTITUTION_TYPES.find(t => t.value === bizType)?.label}</span>
                  <span className="text-muted-foreground">Sub-Type:</span>
                  <span className="text-foreground">{INSTITUTION_SUB_TYPES.find(s => s.value === bizSubType)?.label}</span>
                  <span className="text-muted-foreground">Purpose:</span>
                  <span className="text-foreground">{ACCOUNT_PURPOSES.find(p => p.value === bizPurpose)?.label}</span>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  By submitting, you confirm that all information is accurate. This will create both a representative identity and a business institution identity.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 flex justify-between pt-4 border-t border-border mt-6">
        <div>
          {currentStepIndex > 0 ? (
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
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
