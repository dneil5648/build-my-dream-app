import React, { useState } from 'react';
import { User, Building, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateIdentityRequest, IdentityType } from '@/api/types';

interface CreateIdentityFormProps {
  onSubmit: (data: CreateIdentityRequest) => Promise<void>;
  isLoading?: boolean;
}

export const CreateIdentityForm: React.FC<CreateIdentityFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [identityType, setIdentityType] = useState<IdentityType>('INDIVIDUAL');
  const [formData, setFormData] = useState({
    // Individual fields
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    tax_identification_number: '',
    // Institution fields
    legal_name: '',
    doing_business_as: '',
    entity_type: 'CORPORATION',
    // Address fields
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const request: CreateIdentityRequest = {
      type: identityType,
    };

    if (identityType === 'INDIVIDUAL') {
      request.individual = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        date_of_birth: formData.date_of_birth,
        tax_identification_number: formData.tax_identification_number,
        address: {
          street_address: formData.street_address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
        },
      };
    } else {
      request.institution = {
        legal_name: formData.legal_name,
        doing_business_as: formData.doing_business_as,
        email: formData.email,
        phone_number: formData.phone_number,
        entity_type: formData.entity_type,
        tax_identification_number: formData.tax_identification_number,
        address: {
          street_address: formData.street_address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
        },
      };
    }

    await onSubmit(request);
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

      {/* Individual Fields */}
      {identityType === 'INDIVIDUAL' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              required
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_id">Tax ID (SSN) *</Label>
            <Input
              id="tax_id"
              value={formData.tax_identification_number}
              onChange={(e) => setFormData({ ...formData, tax_identification_number: e.target.value })}
              placeholder="XXX-XX-XXXX"
              required
              className="bg-secondary border-border"
            />
          </div>
        </div>
      )}

      {/* Institution Fields */}
      {identityType === 'INSTITUTION' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="legal_name">Legal Name *</Label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              required
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dba">Doing Business As</Label>
            <Input
              id="dba"
              value={formData.doing_business_as}
              onChange={(e) => setFormData({ ...formData, doing_business_as: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity_type">Entity Type *</Label>
            <Select
              value={formData.entity_type}
              onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CORPORATION">Corporation</SelectItem>
                <SelectItem value="LLC">LLC</SelectItem>
                <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inst_tax_id">Tax ID (EIN) *</Label>
            <Input
              id="inst_tax_id"
              value={formData.tax_identification_number}
              onChange={(e) => setFormData({ ...formData, tax_identification_number: e.target.value })}
              placeholder="XX-XXXXXXX"
              required
              className="bg-secondary border-border"
            />
          </div>
        </div>
      )}

      {/* Shared Contact Fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            required
            className="bg-secondary border-border"
          />
        </div>
      </div>

      {/* Address Fields */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Address</Label>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={formData.street_address}
              onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              required
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal">Postal Code *</Label>
              <Input
                id="postal"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                required
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => setFormData({ ...formData, country: value })}
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
