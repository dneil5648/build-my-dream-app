import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowDownToLine, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { Button } from '@/components/ui/button';

const mockDeposits = [
  { id: '1', amount: '$10,000.00', asset: 'USD', network: 'WIRE', status: 'completed' as const, date: '2024-01-15 14:30' },
  { id: '2', amount: '$5,500.00', asset: 'USD', network: 'ACH', status: 'pending' as const, date: '2024-01-15 12:15' },
  { id: '3', amount: '$25,000.00', asset: 'USD', network: 'WIRE', status: 'processing' as const, date: '2024-01-14 09:45' },
  { id: '4', amount: '$2,000.00', asset: 'USD', network: 'ACH', status: 'completed' as const, date: '2024-01-13 16:20' },
];

const mockInstructions = [
  { id: '1', network: 'WIRE', accountNumber: '****1234', memoId: 'PAX-001', status: 'active' },
  { id: '2', network: 'ACH', accountNumber: '****5678', memoId: 'PAX-002', status: 'active' },
];

const PayInsDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pay-ins Dashboard</h2>
          <p className="text-muted-foreground">Manage fiat deposits and deposit instructions</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/pay-ins/sandbox">
            <Button variant="outline" className="border-border">
              Sandbox Deposit
            </Button>
          </Link>
          <Link to="/app/pay-ins/create">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Instructions
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Deposits"
          value="$142,500"
          change="+12.5% from last month"
          changeType="positive"
          icon={ArrowDownToLine}
        />
        <StatCard
          title="Pending Deposits"
          value="$5,500"
          change="2 pending transactions"
          changeType="neutral"
          icon={Clock}
        />
        <StatCard
          title="Completed Today"
          value="$35,000"
          change="5 transactions"
          changeType="positive"
          icon={CheckCircle2}
        />
        <StatCard
          title="Active Instructions"
          value="2"
          change="All networks active"
          changeType="neutral"
          icon={AlertCircle}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Deposit Instructions */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Active Deposit Instructions</h3>
            <Link to="/app/pay-ins/create" className="text-sm text-primary hover:underline">
              Create New
            </Link>
          </div>
          <div className="space-y-4">
            {mockInstructions.map((instruction) => (
              <div 
                key={instruction.id}
                className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ArrowDownToLine className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{instruction.network}</p>
                      <p className="text-sm text-muted-foreground">
                        Account: {instruction.accountNumber} • Memo: {instruction.memoId}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">
                    {instruction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Recent Deposits</h3>
            <Link to="/app/pay-ins/history" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {mockDeposits.map((deposit) => (
              <div 
                key={deposit.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                    <ArrowDownToLine className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{deposit.amount}</p>
                    <p className="text-sm text-muted-foreground">
                      {deposit.network} • {deposit.date}
                    </p>
                  </div>
                </div>
                <TransactionStatusBadge status={deposit.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayInsDashboard;
