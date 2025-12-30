import React, { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaxosIdentity, CreateAccountRequest, ModuleName } from '@/api/types';

interface CreateAccountFormProps {
  identities: PaxosIdentity[];
  onSubmit: (data: CreateAccountRequest) => Promise<void>;
  isLoading?: boolean;
  module?: ModuleName;
}

export const CreateAccountForm: React.FC<CreateAccountFormProps> = ({
  identities,
  onSubmit,
  isLoading,
  module = 'TREASURY',
}) => {
  const [identityId, setIdentityId] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identityId) return;

    await onSubmit({
      account_request: {
        identity_id: identityId,
        description: description || undefined,
      },
      module,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Select Identity *</Label>
        {identities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-secondary/50 rounded-lg">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No identities available</p>
            <p className="text-sm">Create an identity first</p>
          </div>
        ) : (
          <Select value={identityId} onValueChange={setIdentityId}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select an identity" />
            </SelectTrigger>
            <SelectContent>
              {identities.map((identity) => (
                <SelectItem key={identity.id} value={identity.identity_id}>
                  <div className="flex items-center gap-2">
                    <span>{identity.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({identity.identity_type})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Enter account description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-secondary border-border resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          A brief description to help identify this account
        </p>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading || !identityId} 
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
};
