import React, { useState } from 'react';
import { User, Building2, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateIdentityRequest, Address } from '@/api/types';

interface InstitutionOnboardingWizardProps {
  onSubmit: (data: CreateIdentityRequest) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

type Step = 'individual-details' | 'individual-address' | 'institution-details' | 'institution-address' | 'review';

const emptyAddress: Address = {
  street_address: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
};

export const InstitutionOnboardingWizard: React.FC<InstitutionOnboardingWizardProps> = ({
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>('individual-details');
  
  // Individual fields (authorized representative)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [taxId, setTaxId] = useState('');
  const [individualAddress, setIndividualAddress] = useState<Address>(emptyAddress);
  
  // Institution fields
  const [legalName, setLegalName] = useState('');
  const [dba, setDba] = useState('');
  const [entityType, setEntityType] = useState('');
  const [institutionEmail, setInstitutionEmail] = useState('');
  const [institutionPhone, setInstitutionPhone] = useState('');
  const [institutionTaxId, setInstitutionTaxId] = useState('');
  const [institutionAddress, setInstitutionAddress] = useState<Address>(emptyAddress);

  const steps: Step[] = ['individual-details', 'individual-address', 'institution-details', 'institution-address', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const getStepLabel = (s: Step): string => {
    switch (s) {
      case 'individual-details': return 'Representative';
      case 'individual-address': return 'Rep. Address';
      case 'institution-details': return 'Business';
      case 'institution-address': return 'Business Address';
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
    // Create institution identity with representative info
    const data: CreateIdentityRequest = {
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

    await onSubmit(data);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'individual-details':
        return !!(firstName && lastName && email && phone && dateOfBirth && taxId);
      case 'individual-address':
        return !!(individualAddress.street_address && individualAddress.city && individualAddress.state && individualAddress.postal_code && individualAddress.country);
      case 'institution-details':
        return !!(legalName && dba && institutionEmail && institutionPhone && entityType && institutionTaxId);
      case 'institution-address':
        return !!(institutionAddress.street_address && institutionAddress.city && institutionAddress.state && institutionAddress.postal_code && institutionAddress.country);
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
            <div className="flex items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index <= currentStepIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`ml-2 text-xs hidden lg:inline whitespace-nowrap ${
                index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {getStepLabel(s)}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 min-w-[16px] transition-colors ${
                index < currentStepIndex ? 'bg-primary' : 'bg-secondary'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      {step === 'individual-details' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Authorized Representative</h3>
              <p className="text-sm text-muted-foreground">Enter details of the person authorized to act on behalf of the business.</p>
            </div>
          </div>
          
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
                placeholder="john@company.com"
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

      {step === 'individual-address' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Representative Address</h3>
              <p className="text-sm text-muted-foreground">Enter the residential address of the authorized representative.</p>
            </div>
          </div>
          
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

      {step === 'institution-details' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Business Information</h3>
              <p className="text-sm text-muted-foreground">Enter your organization's details.</p>
            </div>
          </div>
          
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
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Business Address</h3>
              <p className="text-sm text-muted-foreground">Enter your organization's physical address.</p>
            </div>
          </div>
          
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

      {step === 'review' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Review & Submit</h3>
          <p className="text-muted-foreground">Please verify all details before completing registration.</p>
          
          <div className="space-y-4 mt-6">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Authorized Representative
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="text-foreground">{firstName} {lastName}</span>
                <span className="text-muted-foreground">Email:</span>
                <span className="text-foreground">{email}</span>
                <span className="text-muted-foreground">Phone:</span>
                <span className="text-foreground">{phone}</span>
                <span className="text-muted-foreground">Address:</span>
                <span className="text-foreground">{individualAddress.city}, {individualAddress.state}</span>
              </div>
            </div>
            
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
                <span className="text-muted-foreground">Address:</span>
                <span className="text-foreground">{institutionAddress.city}, {institutionAddress.state}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-border">
        <div>
          {step !== 'individual-details' ? (
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
                  Registering...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
