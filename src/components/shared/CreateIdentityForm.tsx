import React, { useState } from 'react';
import { User, Building, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateIdentityRequest, IdentityType, PaxosAddress } from '@/api/types';

interface CreateIdentityFormProps {
  onSubmit: (data: CreateIdentityRequest) => Promise<void>;
  isLoading?: boolean;
}

export const CreateIdentityForm: React.FC<CreateIdentityFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [identityType, setIdentityType] = useState<IdentityType>('INDIVIDUAL');

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
  const [address, setAddress] = useState<PaxosAddress>({
    country: 'USA',
    address1: '',
    address2: '',
    city: '',
    province: '',
    zip_code: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (identityType === 'INDIVIDUAL') {
      const request: CreateIdentityRequest = {
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
      await onSubmit(request);
    } else {
      const request: CreateIdentityRequest = {
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
        institution_members: [], // Note: Institution requires person identities as members
        customer_due_diligence: {
          industry_sector: bizSubType,
          purpose_of_account: 'INVESTMENT_TRADING',
        },
      };
      await onSubmit(request);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identity Type Selection */}
      <div className="space-y-2">
        <Label>Identity Type</Label>
        <div className="flex gap-3">
          <Button
            type="button"
            variant={identityType === 'INDIVIDUAL' ? 'default' : 'outline'}
            onClick={() => setIdentityType('INDIVIDUAL')}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            Individual
          </Button>
          <Button
            type="button"
            variant={identityType === 'INSTITUTION' ? 'default' : 'outline'}
            onClick={() => setIdentityType('INSTITUTION')}
            className="flex-1"
          >
            <Building className="h-4 w-4 mr-2" />
            Institution
          </Button>
        </div>
      </div>

      {/* Institution Warning */}
      {identityType === 'INSTITUTION' && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Note: Institution members required</p>
              <p className="text-muted-foreground">
                Institutions require authorized representatives. You'll need to add members after creation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Individual Fields */}
      {identityType === 'INDIVIDUAL' && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cip_id">Tax ID / SSN / ITIN *</Label>
              <Input
                id="cip_id"
                value={cipId}
                onChange={(e) => setCipId(e.target.value)}
                placeholder="XXX-XX-XXXX"
                required
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cip_id_type">ID Type *</Label>
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
              <Label htmlFor="nationality">Nationality *</Label>
              <Input
                id="nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="USA"
                maxLength={3}
                required
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </>
      )}

      {/* Institution Fields */}
      {identityType === 'INSTITUTION' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="biz_name">Legal Business Name *</Label>
            <Input
              id="biz_name"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              required
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="biz_email">Business Email *</Label>
              <Input
                id="biz_email"
                type="email"
                value={bizEmail}
                onChange={(e) => setBizEmail(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz_phone">Business Phone *</Label>
              <Input
                id="biz_phone"
                type="tel"
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="biz_type">Business Type *</Label>
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
              <Label htmlFor="biz_industry">Industry *</Label>
              <Input
                id="biz_industry"
                value={bizSubType}
                onChange={(e) => setBizSubType(e.target.value)}
                placeholder="e.g., Technology, Retail"
                required
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="biz_tax_id">Tax ID (EIN) *</Label>
              <Input
                id="biz_tax_id"
                value={bizCipId}
                onChange={(e) => setBizCipId(e.target.value)}
                placeholder="XX-XXXXXXX"
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz_reg_date">Registration Date *</Label>
              <Input
                id="biz_reg_date"
                type="date"
                value={bizGovtRegDate}
                onChange={(e) => setBizGovtRegDate(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </>
      )}

      {/* Address Fields */}
      <div className="space-y-4">
        <Label className="text-base font-medium">
          {identityType === 'INDIVIDUAL' ? 'Residential Address' : 'Business Address'}
        </Label>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="address1">Address Line 1 *</Label>
            <Input
              id="address1"
              value={address.address1}
              onChange={(e) => setAddress({ ...address, address1: e.target.value })}
              placeholder="123 Main Street"
              required
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address2">Address Line 2</Label>
            <Input
              id="address2"
              value={address.address2}
              onChange={(e) => setAddress({ ...address, address2: e.target.value })}
              placeholder="Apt, Suite, Unit"
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">State *</Label>
              <Input
                id="province"
                value={address.province}
                onChange={(e) => setAddress({ ...address, province: e.target.value })}
                placeholder="NY"
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code *</Label>
              <Input
                id="zip_code"
                value={address.zip_code}
                onChange={(e) => setAddress({ ...address, zip_code: e.target.value })}
                required
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select
              value={address.country}
              onValueChange={(value) => setAddress({ ...address, country: value })}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USA">United States</SelectItem>
                <SelectItem value="CAN">Canada</SelectItem>
                <SelectItem value="GBR">United Kingdom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Identity'
        )}
      </Button>
    </form>
  );
};
