import React, { useState } from 'react';
import { User, Building2, ArrowRight, ArrowLeft, Loader2, Check, Shield, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateIdentityRequest, IdentityType, PaxosAddress } from '@/api/types';
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

interface OnboardingWizardProps {
  onSubmit: (data: CreateIdentityRequest) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

type Step = 'type' | 'details' | 'address' | 'cdd' | 'review';

const emptyAddress: PaxosAddress = {
  country: 'USA',
  address1: '',
  address2: '',
  city: '',
  province: '',
  zip_code: '',
};

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>('type');
  const [identityType, setIdentityType] = useState<IdentityType | null>(null);

  // Individual (Person) fields - only last_name is required per API
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [cipId, setCipId] = useState('');
  const [cipIdType, setCipIdType] = useState<string>('SSN');
  const [nationality, setNationality] = useState('USA');

  // Institution fields - all required per API
  const [bizName, setBizName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizType, setBizType] = useState<string>('LLC');
  const [bizSubType, setBizSubType] = useState('');
  const [bizCipId, setBizCipId] = useState('');
  const [bizGovtRegDate, setBizGovtRegDate] = useState('');

  // Address - required for both
  const [address, setAddress] = useState<PaxosAddress>(emptyAddress);

  // Customer Due Diligence - REQUIRED
  const [purposeOfAccount, setPurposeOfAccount] = useState<string>('');
  const [employmentStatus, setEmploymentStatus] = useState<string>('');
  const [sourceOfWealth, setSourceOfWealth] = useState<string>('');
  const [sourceOfFunds, setSourceOfFunds] = useState<string>('');

  const steps: Step[] = ['type', 'details', 'address', 'cdd', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const getStepLabel = (s: Step): string => {
    const labels: Record<Step, string> = {
      type: 'Type',
      details: 'Details',
      address: 'Address',
      cdd: 'Due Diligence',
      review: 'Review',
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
    if (!identityType) return;

    // Get IDV config for passthrough verification
    const moduleConfig = getModuleIdentityConfig();
    const idvVendor = moduleConfig.idvVendor;

    if (identityType === 'INDIVIDUAL') {
      // Person identity - only verifier_type, last_name, and address are required
      const data: CreateIdentityRequest = {
        person_details: {
          verifier_type: idvVendor ? 'PASSTHROUGH' : 'PAXOS',
          passthrough_verifier_type: idvVendor ? idvVendor as any : undefined,
          first_name: firstName || undefined,
          last_name: lastName,
          email: email || undefined,
          phone_number: phone || undefined,
          date_of_birth: dateOfBirth || undefined,
          cip_id: cipId || undefined,
          cip_id_type: cipId ? cipIdType as any : undefined,
          cip_id_country: cipId ? nationality : undefined,
          nationality: nationality || undefined,
          address: address,
        },
        customer_due_diligence: {
          purpose_of_account: purposeOfAccount as any,
          employment_status: employmentStatus as any,
          source_of_wealth: sourceOfWealth as any,
          source_of_funds: sourceOfFunds as any,
        },
      };
      await onSubmit(data);
    } else {
      // Institution identity - many required fields
      const data: CreateIdentityRequest = {
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
          business_address: address,
          regulation_status: 'NON_REGULATED',
          trading_type: 'PRIVATE',
        },
        institution_members: [],
        customer_due_diligence: {
          industry_sector: bizSubType,
          purpose_of_account: purposeOfAccount as any,
          source_of_funds: sourceOfFunds as any,
        },
      };
      await onSubmit(data);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'type':
        return identityType !== null;
      case 'details':
        if (identityType === 'INDIVIDUAL') {
          // Only last_name is required for person per API spec
          return !!lastName;
        }
        // Institution requires all these fields
        return !!(bizName && bizEmail && bizPhone && bizSubType && bizCipId && bizGovtRegDate);
      case 'address':
        // Address is required with all sub-fields except address2
        return !!(address.address1 && address.city && address.province && address.zip_code && address.country);
      case 'cdd':
        // CDD is mandatory
        if (identityType === 'INDIVIDUAL') {
          return !!(purposeOfAccount && employmentStatus && sourceOfWealth && sourceOfFunds);
        }
        return !!(purposeOfAccount && sourceOfFunds);
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col max-h-[70vh] overflow-hidden">
      {/* Progress Steps */}
      {step !== 'type' && (
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
                <div className={`flex-1 h-0.5 mx-4 ${
                  index + 1 < currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {/* TYPE SELECTION */}
        {step === 'type' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground">Select Identity Type</h3>
              <p className="text-muted-foreground mt-1">Choose the type of identity to create</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setIdentityType('INDIVIDUAL');
                  handleNext();
                }}
                className="p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <User className="h-10 w-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <h4 className="text-lg font-semibold text-foreground">Individual</h4>
                <p className="text-sm text-muted-foreground mt-1">Personal account for an individual</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentityType('INSTITUTION');
                  handleNext();
                }}
                className="p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <Building2 className="h-10 w-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <h4 className="text-lg font-semibold text-foreground">Institution</h4>
                <p className="text-sm text-muted-foreground mt-1">Business or organization account</p>
              </button>
            </div>
          </div>
        )}

        {/* INDIVIDUAL DETAILS */}
        {step === 'details' && identityType === 'INDIVIDUAL' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                <p className="text-sm text-muted-foreground">Basic details and identity verification</p>
              </div>
            </div>

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
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
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
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
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
                    value={cipId}
                    onChange={(e) => setCipId(e.target.value)}
                    placeholder="XXX-XX-XXXX"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID Type</Label>
                  <Select value={cipIdType} onValueChange={setCipIdType}>
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
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value.toUpperCase())}
                    placeholder="USA"
                    maxLength={3}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INSTITUTION DETAILS */}
        {step === 'details' && identityType === 'INSTITUTION' && (
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
                <Label>Industry *</Label>
                <Select value={bizSubType} onValueChange={setBizSubType}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select industry" />
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

        {/* ADDRESS */}
        {step === 'address' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {identityType === 'INDIVIDUAL' ? 'Residential Address' : 'Business Address'}
                </h3>
                <p className="text-sm text-muted-foreground">Physical location</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address Line 1 *</Label>
              <Input
                value={address.address1}
                onChange={(e) => setAddress({ ...address, address1: e.target.value })}
                placeholder="123 Main Street"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input
                value={address.address2}
                onChange={(e) => setAddress({ ...address, address2: e.target.value })}
                placeholder="Apt, Suite, Unit"
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="New York"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>State/Province *</Label>
                <Input
                  value={address.province}
                  onChange={(e) => setAddress({ ...address, province: e.target.value })}
                  placeholder="NY"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP/Postal *</Label>
                <Input
                  value={address.zip_code}
                  onChange={(e) => setAddress({ ...address, zip_code: e.target.value })}
                  placeholder="10001"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Country *</Label>
              <Input
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value.toUpperCase() })}
                placeholder="USA"
                maxLength={3}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        )}

        {/* CUSTOMER DUE DILIGENCE */}
        {step === 'cdd' && (
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

            {identityType === 'INDIVIDUAL' && (
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
            )}

            {identityType === 'INDIVIDUAL' && (
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
            )}

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

        {/* REVIEW */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Review Information</h3>
                <p className="text-sm text-muted-foreground">Verify all details before submitting</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  {identityType === 'INDIVIDUAL' ? (
                    <User className="h-4 w-4 text-primary" />
                  ) : (
                    <Building2 className="h-4 w-4 text-primary" />
                  )}
                  <h4 className="font-medium text-foreground capitalize">{identityType?.toLowerCase()} Details</h4>
                </div>
                {identityType === 'INDIVIDUAL' ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="text-foreground">{firstName} {lastName}</span>
                    {email && (
                      <>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="text-foreground">{email}</span>
                      </>
                    )}
                    {phone && (
                      <>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="text-foreground">{phone}</span>
                      </>
                    )}
                    {nationality && (
                      <>
                        <span className="text-muted-foreground">Nationality:</span>
                        <span className="text-foreground">{nationality}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Legal Name:</span>
                    <span className="text-foreground">{bizName}</span>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-foreground">{INSTITUTION_TYPES.find(t => t.value === bizType)?.label}</span>
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="text-foreground">{INDUSTRY_SECTORS.find(s => s.value === bizSubType)?.label}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground">{bizEmail}</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-foreground">Address</h4>
                </div>
                <p className="text-sm text-foreground">
                  {address.address1}{address.address2 && `, ${address.address2}`}<br />
                  {address.city}, {address.province} {address.zip_code}<br />
                  {address.country}
                </p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-foreground">Due Diligence</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Purpose:</span>
                  <span className="text-foreground">{ACCOUNT_PURPOSES.find(p => p.value === purposeOfAccount)?.label}</span>
                  {identityType === 'INDIVIDUAL' && (
                    <>
                      <span className="text-muted-foreground">Employment:</span>
                      <span className="text-foreground">{EMPLOYMENT_STATUSES.find(e => e.value === employmentStatus)?.label}</span>
                      <span className="text-muted-foreground">Source of Wealth:</span>
                      <span className="text-foreground">{SOURCE_OF_WEALTH.find(s => s.value === sourceOfWealth)?.label}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">Source of Funds:</span>
                  <span className="text-foreground">{SOURCE_OF_FUNDS.find(s => s.value === sourceOfFunds)?.label}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 flex justify-between pt-4 border-t border-border mt-6">
        <div>
          {step !== 'type' ? (
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
                'Create Identity'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
