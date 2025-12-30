import React, { useState } from 'react';
import { User, Building2, ArrowRight, ArrowLeft, Loader2, Check, DollarSign, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreateIdentityRequest, PaxosAddress, PersonDetails, InstitutionDetails, CustomerDueDiligence, TaxDetails } from '@/api/types';

interface InstitutionOnboardingWizardProps {
  onSubmit: (data: CreateIdentityRequest) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

type Step = 'rep-basic' | 'rep-cip' | 'rep-address' | 'rep-financial' | 'rep-tax' |
  'biz-basic' | 'biz-type' | 'biz-address' | 'biz-regulatory' | 'biz-financial' | 'biz-tax' | 'review';

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
  const [step, setStep] = useState<Step>('rep-basic');

  // Representative (Person) Fields
  const [repFirstName, setRepFirstName] = useState('');
  const [repLastName, setRepLastName] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repDateOfBirth, setRepDateOfBirth] = useState('');
  const [repCipId, setRepCipId] = useState('');
  const [repCipIdType, setRepCipIdType] = useState<'SSN' | 'ITIN' | 'PASSPORT' | 'ID_CARD' | 'DRIVING_LICENSE' | 'VISA'>('SSN');
  const [repCipIdCountry, setRepCipIdCountry] = useState('USA');
  const [repProfession, setRepProfession] = useState('');
  const [repNationality, setRepNationality] = useState('USA');
  const [repAddress, setRepAddress] = useState<PaxosAddress>(emptyAddress);

  // Representative Financial Info
  const [repNetWorth, setRepNetWorth] = useState('');
  const [repIncome, setRepIncome] = useState('');
  const [repTransferValue, setRepTransferValue] = useState('');
  const [repSourceWealth, setRepSourceWealth] = useState('');
  const [repSourceFunds, setRepSourceFunds] = useState('');
  const [repPurpose, setRepPurpose] = useState('');
  const [repEmploymentStatus, setRepEmploymentStatus] = useState('');
  const [repIndustry, setRepIndustry] = useState('');

  // Representative Tax
  const [repTaxId, setRepTaxId] = useState('');
  const [repTaxCountry, setRepTaxCountry] = useState('USA');

  // Business (Institution) Fields
  const [bizName, setBizName] = useState('');
  const [bizDBA, setBizDBA] = useState('');
  const [bizDescription, setBizDescription] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizType, setBizType] = useState<'CORPORATION' | 'LLC' | 'PARTNERSHIP' | 'TRUST'>('CORPORATION');
  const [bizSubType, setBizSubType] = useState('');
  const [bizCipId, setBizCipId] = useState('');
  const [bizCipIdType, setBizCipIdType] = useState<'EIN' | 'REGISTRATION_NUMBER'>('EIN');
  const [bizCipIdCountry, setBizCipIdCountry] = useState('USA');
  const [bizGovtRegDate, setBizGovtRegDate] = useState('');
  const [bizAddress, setBizAddress] = useState<PaxosAddress>(emptyAddress);
  const [bizIncorpAddress, setBizIncorpAddress] = useState<PaxosAddress | null>(null);
  const [useSameAddress, setUseSameAddress] = useState(true);

  // Business Regulatory
  const [bizRegulationStatus, setBizRegulationStatus] = useState<'US_REGULATED' | 'INTL_REGULATED' | 'NON_REGULATED'>('NON_REGULATED');
  const [bizRegulatorName, setBizRegulatorName] = useState('');
  const [bizRegulatorJurisdiction, setBizRegulatorJurisdiction] = useState('');
  const [bizRegulatorNumber, setBizRegulatorNumber] = useState('');
  const [bizTradingType, setBizTradingType] = useState<'PRIVATE' | 'PUBLIC' | 'PUBLICLY_TRADED_SUBSIDIARY'>('PRIVATE');
  const [bizExchange, setBizExchange] = useState('');
  const [bizTicker, setBizTicker] = useState('');

  // Business Financial
  const [bizIndustrySector, setBizIndustrySector] = useState('');
  const [bizSourceWealth, setBizSourceWealth] = useState('');
  const [bizSourceFunds, setBizSourceFunds] = useState('');
  const [bizPurpose, setBizPurpose] = useState('');
  const [bizTransferValue, setBizTransferValue] = useState('');
  const [bizHasTrust, setBizHasTrust] = useState(false);
  const [bizHasNominees, setBizHasNominees] = useState(false);

  // Business Tax
  const [bizTaxId, setBizTaxId] = useState('');
  const [bizTaxCountry, setBizTaxCountry] = useState('USA');

  const steps: Step[] = ['rep-basic', 'rep-cip', 'rep-address', 'rep-financial', 'rep-tax',
    'biz-basic', 'biz-type', 'biz-address', 'biz-regulatory', 'biz-financial', 'biz-tax', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const getStepLabel = (s: Step): string => {
    const labels: Record<Step, string> = {
      'rep-basic': 'Rep Info',
      'rep-cip': 'Rep ID',
      'rep-address': 'Rep Address',
      'rep-financial': 'Rep Finances',
      'rep-tax': 'Rep Tax',
      'biz-basic': 'Business Info',
      'biz-type': 'Business Type',
      'biz-address': 'Business Addr',
      'biz-regulatory': 'Regulatory',
      'biz-financial': 'Biz Finances',
      'biz-tax': 'Biz Tax',
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
    // Build representative person_details
    const representativeData: CreateIdentityRequest = {
      person_details: {
        verifier_type: 'PAXOS',
        last_name: repLastName,
        first_name: repFirstName || undefined,
        email: repEmail || undefined,
        phone_number: repPhone || undefined,
        date_of_birth: repDateOfBirth || undefined,
        cip_id: repCipId || undefined,
        cip_id_type: repCipIdType,
        cip_id_country: repCipIdCountry,
        profession: repProfession || undefined,
        nationality: repNationality,
        address: repAddress,
      },
      customer_due_diligence: {
        estimated_net_worth: repNetWorth as any || undefined,
        estimated_yearly_income: repIncome as any || undefined,
        expected_transfer_value: repTransferValue as any || undefined,
        source_of_wealth: repSourceWealth as any || undefined,
        source_of_funds: repSourceFunds as any || undefined,
        purpose_of_account: repPurpose as any || undefined,
        employment_status: repEmploymentStatus as any || undefined,
        employment_industry_sector: repIndustry || undefined,
      },
      tax_details: repTaxId ? [{
        tax_payer_id: repTaxId,
        tax_payer_country: repTaxCountry,
      }] : undefined,
    };

    // Create representative identity first
    await onSubmit(representativeData);

    // Note: We can't get the identity_id here because onSubmit doesn't return it
    // In a real scenario, we'd need to either:
    // 1. Modify onSubmit to return the created identity
    // 2. Or have a separate callback to get existing person identities
    // For now, we'll create the institution without the institution_members
    // This will need to be fixed for production use

    // Build institution_details
    const institutionData: CreateIdentityRequest = {
      institution_details: {
        name: bizName,
        doing_business_as: bizDBA || undefined,
        business_description: bizDescription || undefined,
        email: bizEmail,
        phone_number: bizPhone,
        institution_type: bizType,
        institution_sub_type: bizSubType,
        cip_id: bizCipId,
        cip_id_type: bizCipIdType,
        cip_id_country: bizCipIdCountry,
        govt_registration_date: bizGovtRegDate ? `${bizGovtRegDate}T00:00:00Z` : '',
        business_address: bizAddress,
        incorporation_address: useSameAddress ? undefined : bizIncorpAddress || undefined,
        regulation_status: bizRegulationStatus,
        regulator_name: bizRegulationStatus === 'US_REGULATED' ? bizRegulatorName : undefined,
        regulator_jurisdiction: bizRegulationStatus === 'US_REGULATED' ? bizRegulatorJurisdiction : undefined,
        regulator_register_number: bizRegulationStatus === 'US_REGULATED' ? bizRegulatorNumber : undefined,
        trading_type: bizTradingType,
        listed_exchange: bizTradingType !== 'PRIVATE' ? bizExchange : undefined,
        ticker_symbol: bizTradingType !== 'PRIVATE' ? bizTicker : undefined,
      },
      institution_members: [],  // TODO: This needs the person identity_id created above
      customer_due_diligence: {
        industry_sector: bizIndustrySector,
        source_of_wealth: bizSourceWealth as any || undefined,
        source_of_funds: bizSourceFunds as any || undefined,
        purpose_of_account: bizPurpose as any || undefined,
        expected_transfer_value: bizTransferValue as any || undefined,
        has_underlying_trust_structure: bizHasTrust,
        has_nominee_shareholders: bizHasNominees,
      },
      tax_details: bizTaxId ? [{
        tax_payer_id: bizTaxId,
        tax_payer_country: bizTaxCountry,
      }] : undefined,
    };

    await onSubmit(institutionData);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'rep-basic':
        return !!(repLastName && repEmail && repPhone && repDateOfBirth);
      case 'rep-cip':
        return !!(repCipId && repCipIdType && repNationality);
      case 'rep-address':
        return !!(repAddress.address1 && repAddress.city && repAddress.province && repAddress.zip_code);
      case 'rep-financial':
        return true;  // All optional
      case 'rep-tax':
        return true;  // Optional
      case 'biz-basic':
        return !!(bizName && bizEmail && bizPhone);
      case 'biz-type':
        return !!(bizType && bizSubType && bizCipId && bizGovtRegDate);
      case 'biz-address':
        return !!(bizAddress.address1 && bizAddress.city && bizAddress.province && bizAddress.zip_code);
      case 'biz-regulatory':
        if (bizRegulationStatus === 'US_REGULATED') {
          return !!(bizRegulatorName && bizRegulatorJurisdiction && bizRegulatorNumber);
        }
        return true;
      case 'biz-financial':
        return !!bizIndustrySector;  // Required for institutions
      case 'biz-tax':
        return true;  // Optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col max-h-[75vh]">
      {/* Progress Steps - Fixed at top */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4 overflow-x-auto pb-2">
        {steps.map((s, index) => (
          <React.Fragment key={s}>
            <div className="flex items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                index <= currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {index < currentStepIndex ? <Check className="h-3 w-3" /> : index + 1}
              </div>
              <span className={`ml-1 text-xs hidden xl:inline whitespace-nowrap ${
                index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {getStepLabel(s)}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 min-w-[12px] transition-colors ${
                index < currentStepIndex ? 'bg-primary' : 'bg-secondary'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2">
        {/* REPRESENTATIVE BASIC INFO */}
        {step === 'rep-basic' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Authorized Representative</h3>
                <p className="text-sm text-muted-foreground">Basic information about the person authorized to act for the business</p>
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
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
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
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                value={repDateOfBirth}
                onChange={(e) => setRepDateOfBirth(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        )}

        {/* REPRESENTATIVE CIP & IDENTITY */}
        {step === 'rep-cip' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Identity Verification</h3>
                <p className="text-sm text-muted-foreground">Government-issued identification details</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tax ID / SSN / ITIN *</Label>
              <Input
                value={repCipId}
                onChange={(e) => setRepCipId(e.target.value)}
                placeholder="XXX-XX-XXXX"
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">For USA citizens, must be SSN or ITIN</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Type *</Label>
                <Select value={repCipIdType} onValueChange={(v: any) => setRepCipIdType(v)}>
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
                <Label>ID Country *</Label>
                <Input
                  value={repCipIdCountry}
                  onChange={(e) => setRepCipIdCountry(e.target.value)}
                  placeholder="USA"
                  maxLength={3}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Profession</Label>
                <Input
                  value={repProfession}
                  onChange={(e) => setRepProfession(e.target.value)}
                  placeholder="e.g., CEO, Accountant"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Nationality *</Label>
                <Input
                  value={repNationality}
                  onChange={(e) => setRepNationality(e.target.value)}
                  placeholder="USA"
                  maxLength={3}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </div>
        )}

        {/* REPRESENTATIVE ADDRESS */}
        {step === 'rep-address' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Representative Address</h3>
            <p className="text-sm text-muted-foreground">Residential address of the authorized representative</p>

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
                placeholder="Apt, Suite, Unit, etc."
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
                <Label>State/Province *</Label>
                <Input
                  value={repAddress.province}
                  onChange={(e) => setRepAddress({ ...repAddress, province: e.target.value })}
                  placeholder="NY"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP Code *</Label>
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
                onChange={(e) => setRepAddress({ ...repAddress, country: e.target.value })}
                placeholder="USA"
                maxLength={3}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        )}

        {/* REPRESENTATIVE FINANCIAL INFO */}
        {step === 'rep-financial' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Financial Information</h3>
                <p className="text-sm text-muted-foreground">Customer due diligence details (all optional)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Net Worth</Label>
                <Select value={repNetWorth} onValueChange={setRepNetWorth}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NET_WORTH_0_TO_100K">$0 - $100K</SelectItem>
                    <SelectItem value="NET_WORTH_100K_TO_500K">$100K - $500K</SelectItem>
                    <SelectItem value="NET_WORTH_500K_TO_1M">$500K - $1M</SelectItem>
                    <SelectItem value="NET_WORTH_1M_TO_2_5M">$1M - $2.5M</SelectItem>
                    <SelectItem value="NET_WORTH_2_5M_TO_5M">$2.5M - $5M</SelectItem>
                    <SelectItem value="NET_WORTH_5M_TO_7_5M">$5M - $7.5M</SelectItem>
                    <SelectItem value="NET_WORTH_7_5M_TO_10M">$7.5M - $10M</SelectItem>
                    <SelectItem value="NET_WORTH_10M_TO_25M">$10M - $25M</SelectItem>
                    <SelectItem value="NET_WORTH_OVER_50M">Over $50M</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Yearly Income</Label>
                <Select value={repIncome} onValueChange={setRepIncome}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME_0_TO_50K">$0 - $50K</SelectItem>
                    <SelectItem value="INCOME_50K_TO_100K">$50K - $100K</SelectItem>
                    <SelectItem value="INCOME_100K_TO_250K">$100K - $250K</SelectItem>
                    <SelectItem value="INCOME_250K_TO_500K">$250K - $500K</SelectItem>
                    <SelectItem value="INCOME_500K_TO_750K">$500K - $750K</SelectItem>
                    <SelectItem value="INCOME_750K_TO_1M">$750K - $1M</SelectItem>
                    <SelectItem value="INCOME_ABOVE_1M">Above $1M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source of Wealth</Label>
                <Select value={repSourceWealth} onValueChange={setRepSourceWealth}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYMENT_INCOME">Employment Income</SelectItem>
                    <SelectItem value="BUSINESS_OWNERSHIP_DIVIDENDS">Business Ownership</SelectItem>
                    <SelectItem value="INVESTMENT_GAINS">Investment Gains</SelectItem>
                    <SelectItem value="INHERITANCE">Inheritance</SelectItem>
                    <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                    <SelectItem value="OTHER_SOURCE_OF_WEALTH">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Source of Funds</Label>
                <Select value={repSourceFunds} onValueChange={setRepSourceFunds}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALARY_DISBURSEMENT">Salary</SelectItem>
                    <SelectItem value="BUSINESS_DIVIDENDS_PROFITS">Business Profits</SelectItem>
                    <SelectItem value="INVESTMENT_RETURNS">Investment Returns</SelectItem>
                    <SelectItem value="INHERITANCE_DISTRIBUTION">Inheritance</SelectItem>
                    <SelectItem value="PROPERTY_SALE">Property Sale</SelectItem>
                    <SelectItem value="SAVINGS_ACCOUNT_WITHDRAWAL">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Status</Label>
                <Select value={repEmploymentStatus} onValueChange={setRepEmploymentStatus}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="SELF_EMPLOYED">Self Employed</SelectItem>
                    <SelectItem value="RETIRED">Retired</SelectItem>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="UNEMPLOYED">Unemployed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Purpose of Account</Label>
                <Select value={repPurpose} onValueChange={setRepPurpose}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVESTMENT_TRADING">Investment & Trading</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="STABLECOIN_PURCHASE_REDEMPTION">Stablecoin Purchase/Redemption</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* REPRESENTATIVE TAX */}
        {step === 'rep-tax' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Tax Details</h3>
                <p className="text-sm text-muted-foreground">Tax identification information (optional)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tax ID</Label>
              <Input
                value={repTaxId}
                onChange={(e) => setRepTaxId(e.target.value)}
                placeholder="Same as SSN/ITIN if USA"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Tax Country</Label>
              <Input
                value={repTaxCountry}
                onChange={(e) => setRepTaxCountry(e.target.value)}
                placeholder="USA"
                maxLength={3}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        )}

        {/* BUSINESS BASIC INFO */}
        {step === 'biz-basic' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-module-payouts/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-module-payouts" />
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

            <div className="space-y-2">
              <Label>Doing Business As (DBA)</Label>
              <Input
                value={bizDBA}
                onChange={(e) => setBizDBA(e.target.value)}
                placeholder="Optional trade name"
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
          </div>
        )}

        {/* BUSINESS TYPE & REGISTRATION */}
        {step === 'biz-type' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-module-payouts/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-module-payouts" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Business Type & Registration</h3>
                <p className="text-sm text-muted-foreground">Legal structure and registration details</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Institution Type *</Label>
                <Select value={bizType} onValueChange={(v: any) => setBizType(v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORPORATION">Corporation</SelectItem>
                    <SelectItem value="LLC">LLC</SelectItem>
                    <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                    <SelectItem value="TRUST">Trust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Industry Sector *</Label>
                <Input
                  value={bizSubType}
                  onChange={(e) => setBizSubType(e.target.value)}
                  placeholder="e.g., Technology, Finance"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CIP ID Type *</Label>
                <Select value={bizCipIdType} onValueChange={(v: any) => setBizCipIdType(v)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EIN">EIN (USA)</SelectItem>
                    <SelectItem value="REGISTRATION_NUMBER">Registration Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CIP ID *</Label>
                <Input
                  value={bizCipId}
                  onChange={(e) => setBizCipId(e.target.value)}
                  placeholder={bizCipIdType === 'EIN' ? 'XX-XXXXXXX' : 'Registration number'}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CIP ID Country *</Label>
                <Input
                  value={bizCipIdCountry}
                  onChange={(e) => setBizCipIdCountry(e.target.value)}
                  placeholder="USA"
                  maxLength={3}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Government Registration Date *</Label>
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
        {step === 'biz-address' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Business Address</h3>
            <p className="text-sm text-muted-foreground">Primary business location</p>

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
                placeholder="Suite, Floor, etc."
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
                <Label>State/Province *</Label>
                <Input
                  value={bizAddress.province}
                  onChange={(e) => setBizAddress({ ...bizAddress, province: e.target.value })}
                  placeholder="NY"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP Code *</Label>
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

            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameAddress"
                  checked={useSameAddress}
                  onChange={(e) => {
                    setUseSameAddress(e.target.checked);
                    if (e.target.checked) {
                      setBizIncorpAddress(null);
                    } else {
                      setBizIncorpAddress(emptyAddress);
                    }
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="sameAddress" className="cursor-pointer">
                  Incorporation address is the same as business address
                </Label>
              </div>

              {!useSameAddress && bizIncorpAddress && (
                <>
                  <h4 className="font-medium text-foreground">Incorporation Address</h4>
                  <div className="space-y-2">
                    <Label>Address Line 1</Label>
                    <Input
                      value={bizIncorpAddress.address1}
                      onChange={(e) => setBizIncorpAddress({ ...bizIncorpAddress, address1: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={bizIncorpAddress.city}
                        onChange={(e) => setBizIncorpAddress({ ...bizIncorpAddress, city: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={bizIncorpAddress.province}
                        onChange={(e) => setBizIncorpAddress({ ...bizIncorpAddress, province: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ZIP</Label>
                      <Input
                        value={bizIncorpAddress.zip_code}
                        onChange={(e) => setBizIncorpAddress({ ...bizIncorpAddress, zip_code: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* BUSINESS REGULATORY */}
        {step === 'biz-regulatory' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-module-payouts/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-module-payouts" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Regulatory Information</h3>
                <p className="text-sm text-muted-foreground">Compliance and regulatory status</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Regulation Status *</Label>
              <Select value={bizRegulationStatus} onValueChange={(v: any) => setBizRegulationStatus(v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US_REGULATED">US Regulated</SelectItem>
                  <SelectItem value="INTL_REGULATED">Internationally Regulated</SelectItem>
                  <SelectItem value="NON_REGULATED">Non-Regulated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bizRegulationStatus === 'US_REGULATED' && (
              <>
                <div className="space-y-2">
                  <Label>Regulator Name *</Label>
                  <Input
                    value={bizRegulatorName}
                    onChange={(e) => setBizRegulatorName(e.target.value)}
                    placeholder="e.g., SEC, FINRA"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Regulator Jurisdiction *</Label>
                  <Input
                    value={bizRegulatorJurisdiction}
                    onChange={(e) => setBizRegulatorJurisdiction(e.target.value)}
                    placeholder="e.g., Federal, New York"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Regulator Register Number *</Label>
                  <Input
                    value={bizRegulatorNumber}
                    onChange={(e) => setBizRegulatorNumber(e.target.value)}
                    placeholder="Registration number"
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Trading Type *</Label>
              <Select value={bizTradingType} onValueChange={(v: any) => setBizTradingType(v)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="PUBLICLY_TRADED_SUBSIDIARY">Publicly Traded Subsidiary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bizTradingType !== 'PRIVATE' && (
              <>
                <div className="space-y-2">
                  <Label>Exchange</Label>
                  <Input
                    value={bizExchange}
                    onChange={(e) => setBizExchange(e.target.value)}
                    placeholder="e.g., NYSE, NASDAQ"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ticker Symbol</Label>
                  <Input
                    value={bizTicker}
                    onChange={(e) => setBizTicker(e.target.value)}
                    placeholder="e.g., ACME"
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* BUSINESS FINANCIAL */}
        {step === 'biz-financial' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-module-payouts/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-module-payouts" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Business Financial Information</h3>
                <p className="text-sm text-muted-foreground">Customer due diligence for the business</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Industry Sector * (Required for institutions)</Label>
              <Input
                value={bizIndustrySector}
                onChange={(e) => setBizIndustrySector(e.target.value)}
                placeholder="e.g., Technology, Financial Services"
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source of Wealth</Label>
                <Select value={bizSourceWealth} onValueChange={setBizSourceWealth}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUSINESS_OWNERSHIP_DIVIDENDS">Business Ownership</SelectItem>
                    <SelectItem value="INVESTMENT_GAINS">Investment Gains</SelectItem>
                    <SelectItem value="INHERITANCE">Inheritance</SelectItem>
                    <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                    <SelectItem value="OTHER_SOURCE_OF_WEALTH">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Source of Funds</Label>
                <Select value={bizSourceFunds} onValueChange={setBizSourceFunds}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUSINESS_DIVIDENDS_PROFITS">Business Profits</SelectItem>
                    <SelectItem value="INVESTMENT_RETURNS">Investment Returns</SelectItem>
                    <SelectItem value="PROPERTY_SALE">Property Sale</SelectItem>
                    <SelectItem value="LOAN_DISBURSEMENT">Loan Disbursement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purpose of Account</Label>
                <Select value={bizPurpose} onValueChange={setBizPurpose}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVESTMENT_TRADING">Investment & Trading</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="STABLECOIN_PURCHASE_REDEMPTION">Stablecoin Purchase/Redemption</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expected Transfer Value</Label>
                <Select value={bizTransferValue} onValueChange={setBizTransferValue}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRANSFER_VALUE_0_TO_25K">$0 - $25K</SelectItem>
                    <SelectItem value="TRANSFER_VALUE_25K_TO_50K">$25K - $50K</SelectItem>
                    <SelectItem value="TRANSFER_VALUE_50K_TO_100K">$50K - $100K</SelectItem>
                    <SelectItem value="TRANSFER_VALUE_100K_TO_250K">$100K - $250K</SelectItem>
                    <SelectItem value="TRANSFER_VALUE_250K_TO_500K">$250K - $500K</SelectItem>
                    <SelectItem value="TRANSFER_VALUE_ABOVE_5M">Above $5M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasTrust"
                  checked={bizHasTrust}
                  onChange={(e) => setBizHasTrust(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="hasTrust" className="cursor-pointer">
                  Has underlying trust structure
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasNominees"
                  checked={bizHasNominees}
                  onChange={(e) => setBizHasNominees(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="hasNominees" className="cursor-pointer">
                  Has nominee shareholders
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* BUSINESS TAX */}
        {step === 'biz-tax' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-module-payouts/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-module-payouts" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Business Tax Details</h3>
                <p className="text-sm text-muted-foreground">Tax identification for the business (optional)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Tax ID</Label>
              <Input
                value={bizTaxId}
                onChange={(e) => setBizTaxId(e.target.value)}
                placeholder="Same as EIN if USA"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Tax Country</Label>
              <Input
                value={bizTaxCountry}
                onChange={(e) => setBizTaxCountry(e.target.value)}
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
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Review & Submit</h3>
                <p className="text-sm text-muted-foreground">Please review all information before submitting</p>
              </div>
            </div>

            {/* Representative Summary */}
            <div className="glass rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Authorized Representative
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 text-foreground">{repFirstName} {repLastName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2 text-foreground">{repEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-2 text-foreground">{repPhone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="ml-2 text-foreground">{repDateOfBirth}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ID Type:</span>
                  <span className="ml-2 text-foreground">{repCipIdType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nationality:</span>
                  <span className="ml-2 text-foreground">{repNationality}</span>
                </div>
              </div>
            </div>

            {/* Business Summary */}
            <div className="glass rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Legal Name:</span>
                  <span className="ml-2 text-foreground">{bizName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2 text-foreground">{bizType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2 text-foreground">{bizEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-2 text-foreground">{bizPhone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">CIP ID:</span>
                  <span className="ml-2 text-foreground">{bizCipId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Industry:</span>
                  <span className="ml-2 text-foreground">{bizSubType}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="ml-2 text-foreground">
                    {bizAddress.address1}, {bizAddress.city}, {bizAddress.province} {bizAddress.zip_code}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>Note:</strong> By submitting this form, you confirm that all information provided is accurate and complete.
                This will create both a representative identity and a business institution identity in the system.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons - Fixed at bottom */}
      <div className="flex-shrink-0 flex justify-between pt-4 border-t border-border mt-4">
          <div>
            {step !== 'rep-basic' ? (
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
