import React from 'react';
import { User, Building, Loader2 } from 'lucide-react';
import { PaxosIdentity } from '@/api/types';

interface IdentitiesTableProps {
  identities: PaxosIdentity[];
  isLoading?: boolean;
  onSelect?: (identity: PaxosIdentity) => void;
  selectedId?: string;
}

export const IdentitiesTable: React.FC<IdentitiesTableProps> = ({
  identities,
  isLoading,
  onSelect,
  selectedId,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (identities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No identities found</p>
        <p className="text-sm">Create your first identity to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {identities.map((identity) => (
        <div
          key={identity.id}
          onClick={() => onSelect?.(identity)}
          className={`p-4 rounded-lg border transition-colors cursor-pointer ${
            selectedId === identity.id
              ? 'bg-primary/10 border-primary'
              : 'bg-secondary/50 border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                identity.identity_type === 'INDIVIDUAL' 
                  ? 'bg-module-payins/10' 
                  : 'bg-module-treasury/10'
              }`}>
                {identity.identity_type === 'INDIVIDUAL' ? (
                  <User className="h-5 w-5 text-module-payins" />
                ) : (
                  <Building className="h-5 w-5 text-module-treasury" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{identity.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {identity.identity_type?.toLowerCase()} • ID: {identity.identity_id?.slice(0, 8)}...
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${
                identity.status === 'ACTIVE' || identity.status === 'active'
                  ? 'bg-success/20 text-success'
                  : identity.status === 'PENDING' || identity.status === 'pending'
                  ? 'bg-warning/20 text-warning'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {identity.status}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(identity.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
