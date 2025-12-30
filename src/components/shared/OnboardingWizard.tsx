import React, { useState } from 'react';
import { User, Building2, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateIdentityRequest, IdentityType, Address } from '@/api/types';

interface OnboardingWizardProps {
  onSubmit: (data: CreateIdentityRequest) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

type Step = 'type' | 'details' | 'address' | 'review';

const emptyAddress: Address = {
  street_address: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
};

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>('type');
  const [identityType, setIdentityType] = useState<IdentityType | null>(null);
  
  // Individual fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [taxId, setTaxId] = useState('');
  
  // Institution fields
  const [legalName, setLegalName] = useState('');
  const [dba, setDba] = useState('');
  const [entityType, setEntityType] = useState('');
  const [institutionEmail, setInstitutionEmail] = useState('');
  const [institutionPhone, setInstitutionPhone] = useState('');
  const [institutionTaxId, setInstitutionTaxId] = useState('');
  
  // Address
  const [address, setAddress] = useState<Address>(emptyAddress);

  const steps: Step[] = ['type', 'details', 'address', 'review'];
  const currentStepIndex = steps.indexOf(step);

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

    const data: CreateIdentityRequest = {
      type: identityType,
    };

    if (identityType === 'INDIVIDUAL') {
      data.individual = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phone,
        date_of_birth: dateOfBirth,
        tax_identification_number: taxId,
        address: address,
      };
    } else {
      data.institution = {
        legal_name: legalName,
        doing_business_as: dba,
        email: institutionEmail,
        phone_number: institutionPhone,
        entity_type: entityType,
        tax_identification_number: institutionTaxId,
        address: address,
      };
    }

    await onSubmit(data);
  };

  const canProceed = () => {
    switch (step) {
      case 'type':
        return identityType !== null;
      case 'details':
        if (identityType === 'INDIVIDUAL') {
          return firstName && lastName && email && phone && dateOfBirth && taxId;
        }
        return legalName && dba && institutionEmail && institutionPhone && entityType && institutionTaxId;
      case 'address':
        return address.street_address && address.city && address.state && address.postal_code && address.country;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <React.Fragment key={s}>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStepIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${
                index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {s === 'type' && 'Type'}
                {s === 'details' && 'Details'}
                {s === 'address' && 'Address'}
                {s === 'review' && 'Review'}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                index < currentStepIndex ? 'bg-primary' : 'bg-secondary'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      {step === 'type' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Select Identity Type</h3>
          <p className="text-muted-foreground">Choose whether you're onboarding an individual or an institution.</p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIdentityType('INDIVIDUAL')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                identityType === 'INDIVIDUAL'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <User className={`h-8 w-8 mb-3 ${identityType === 'INDIVIDUAL' ? 'text-primary' : 'text-muted-foreground'}`} />
              <h4 className="font-semibold text-foreground">Individual</h4>
              <p className="text-sm text-muted-foreground mt-1">Personal account for an individual person</p>
            </button>
            
            <button
              type="button"
              onClick={() => setIdentityType('INSTITUTION')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                identityType === 'INSTITUTION'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Building2 className={`h-8 w-8 mb-3 ${identityType === 'INSTITUTION' ? 'text-primary' : 'text-muted-foreground'}`} />
              <h4 className="font-semibold text-foreground">Institution</h4>
              <p className="text-sm text-muted-foreground mt-1">Business or organization account</p>
            </button>
          </div>
        </div>
      )}

      {step === 'details' && identityType === 'INDIVIDUAL' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
          <p className="text-muted-foreground">Enter the individual's details.</p>
          
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
        </div>
      )}

      {step === 'details' && identityType === 'INSTITUTION' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Institution Information</h3>
          <p className="text-muted-foreground">Enter the organization's details.</p>
          
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
              <Label>Email *</Label>
              <Input
                type="email"
                value={institutionEmail}
                onChange={(e) => setInstitutionEmail(e.target.value)}
                placeholder="contact@acme.com"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
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

      {step === 'address' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            {identityType === 'INDIVIDUAL' ? 'Residential Address' : 'Business Address'}
          </h3>
          <p className="text-muted-foreground">Enter the physical address.</p>
          
          <div className="space-y-2">
            <Label>Street Address *</Label>
            <Input
              value={address.street_address}
              onChange={(e) => setAddress({ ...address, street_address: e.target.value })}
              placeholder="123 Main Street"
              className="bg-secondary border-border"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                placeholder="NY"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Postal Code *</Label>
              <Input
                value={address.postal_code}
                onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                placeholder="10001"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Country *</Label>
              <Input
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                placeholder="USA"
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Review Information</h3>
          <p className="text-muted-foreground">Please verify all details before submitting.</p>
          
          <div className="space-y-4 mt-6">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-3">Identity Type</h4>
              <div className="flex items-center gap-2">
                {identityType === 'INDIVIDUAL' ? (
                  <User className="h-5 w-5 text-primary" />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
                <span className="text-foreground capitalize">{identityType?.toLowerCase()}</span>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-3">Details</h4>
              {identityType === 'INDIVIDUAL' ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="text-foreground">{firstName} {lastName}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{email}</span>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-foreground">{phone}</span>
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="text-foreground">{dateOfBirth}</span>
                </div>
              ) : (
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
              )}
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-3">Address</h4>
              <p className="text-sm text-foreground">
                {address.street_address}<br />
                {address.city}, {address.state} {address.postal_code}<br />
                {address.country}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-border">
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
