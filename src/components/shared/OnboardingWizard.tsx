import React, { useState } from 'react';
import { User, Building2, ArrowRight, ArrowLeft, Loader2, Check, Shield, AlertCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateIdentityRequest, IdentityType, PaxosAddress } from '@/api/types';

interface OnboardingWizardProps {
  onSubmit: (data: CreateIdentityRequest) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

type Step = 'type' | 'details' | 'address' | 'review';

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

  // Individual (Person) fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [cipId, setCipId] = useState('');
  const [cipIdType, setCipIdType] = useState<'SSN' | 'ITIN' | 'PASSPORT' | 'ID_CARD' | 'DRIVING_LICENSE'>('SSN');
  const [nationality, setNationality] = useState('USA');

  // Institution fields
  const [bizName, setBizName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizType, setBizType] = useState<'CORPORATION' | 'LLC' | 'PARTNERSHIP' | 'TRUST'>('LLC');
  const [bizSubType, setBizSubType] = useState('');
  const [bizCipId, setBizCipId] = useState('');
  const [bizGovtRegDate, setBizGovtRegDate] = useState('');

  // Address
  const [address, setAddress] = useState<PaxosAddress>(emptyAddress);

  const steps: Step[] = ['type', 'details', 'address', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const getStepLabel = (s: Step): string => {
    const labels: Record<Step, string> = {
      type: 'Type',
      details: 'Details',
      address: 'Address',
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

    if (identityType === 'INDIVIDUAL') {
      const data: CreateIdentityRequest = {
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
          address: address,
        },
        customer_due_diligence: {
          purpose_of_account: 'INVESTMENT_TRADING',
        },
      };
      await onSubmit(data);
    } else {
      const data: CreateIdentityRequest = {
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
          business_address: address,
          regulation_status: 'NON_REGULATED',
          trading_type: 'PRIVATE',
        },
        institution_members: [],
        customer_due_diligence: {
          industry_sector: bizSubType,
          purpose_of_account: 'INVESTMENT_TRADING',
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
          return !!(lastName && email && phone && dateOfBirth && cipId && nationality);
        }
        return !!(bizName && bizEmail && bizPhone && bizSubType && bizCipId && bizGovtRegDate);
      case 'address':
        return !!(address.address1 && address.city && address.province && address.zip_code);
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col max-h-[70vh]">
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
                <span className={`ml-2 text-sm font-medium ${
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
      <div className="flex-1 overflow-y-auto">
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
                <Label>Phone *</Label>
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

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Identity Verification</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tax ID / SSN *</Label>
                  <Input
                    value={cipId}
                    onChange={(e) => setCipId(e.target.value)}
                    placeholder="XXX-XX-XXXX"
                    className="bg-secondary border-border"
                  />
                </div>
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

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Institutions require at least one authorized representative. You'll need to add members after creation.
                </p>
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
                <Label>State *</Label>
                <Input
                  value={address.province}
                  onChange={(e) => setAddress({ ...address, province: e.target.value })}
                  placeholder="NY"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP *</Label>
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
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                placeholder="USA"
                maxLength={3}
                className="bg-secondary border-border"
              />
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
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground">{email}</span>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="text-foreground">{phone}</span>
                    <span className="text-muted-foreground">Nationality:</span>
                    <span className="text-foreground">{nationality}</span>
                  </div>
                ) : (
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
