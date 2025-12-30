import React from 'react';
import { User, Building, Loader2 } from 'lucide-react';
import { PaxosIdentity } from '@/api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Identity ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {identities.map((identity) => (
            <TableRow
              key={identity.id}
              onClick={() => onSelect?.(identity)}
              className={`cursor-pointer transition-colors ${
                selectedId === identity.id
                  ? 'bg-primary/10 hover:bg-primary/15'
                  : 'hover:bg-secondary/50'
              }`}
            >
              <TableCell className="w-12">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  identity.identity_type === 'INDIVIDUAL' 
                    ? 'bg-module-payins/10' 
                    : 'bg-module-treasury/10'
                }`}>
                  {identity.identity_type === 'INDIVIDUAL' ? (
                    <User className="h-4 w-4 text-module-payins" />
                  ) : (
                    <Building className="h-4 w-4 text-module-treasury" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {identity.name}
              </TableCell>
              <TableCell className="text-muted-foreground capitalize">
                {identity.identity_type?.toLowerCase()}
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {identity.identity_id?.slice(0, 12)}...
              </TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  identity.status === 'ACTIVE' || identity.status === 'active'
                    ? 'bg-success/20 text-success'
                    : identity.status === 'PENDING' || identity.status === 'pending'
                    ? 'bg-warning/20 text-warning'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {identity.status}
                </span>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {new Date(identity.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
