import React from 'react';
import { cn } from '@/lib/utils';

import { TransactionStatus } from '@/api/types';

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

const statusStyles: Record<TransactionStatus, string> = {
  PENDING: 'bg-warning/20 text-warning',
  PROCESSING: 'bg-primary/20 text-primary',
  COMPLETED: 'bg-success/20 text-success',
  FAILED: 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<TransactionStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
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
        status === 'PENDING' && "bg-warning",
        status === 'PROCESSING' && "bg-primary animate-pulse",
        status === 'COMPLETED' && "bg-success",
        status === 'FAILED' && "bg-destructive"
      )} />
      {statusLabels[status]}
    </span>
  );
};
