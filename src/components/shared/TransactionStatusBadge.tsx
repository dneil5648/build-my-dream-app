import React from 'react';
import { cn } from '@/lib/utils';

import { TransactionStatus } from '@/api/types';

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

const statusStyles: Record<TransactionStatus, string> = {
  pending: 'bg-warning/20 text-warning',
  processing: 'bg-primary/20 text-primary',
  completed: 'bg-success/20 text-success',
  failed: 'bg-destructive/20 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<TransactionStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const TransactionStatusBadge: React.FC<TransactionStatusBadgeProps> = ({ status, className }) => {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      statusStyles[status],
      className
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-1.5",
        status === 'pending' && "bg-warning",
        status === 'processing' && "bg-primary animate-pulse",
        status === 'completed' && "bg-success",
        status === 'failed' && "bg-destructive",
        status === 'cancelled' && "bg-muted-foreground"
      )} />
      {statusLabels[status]}
    </span>
  );
};
