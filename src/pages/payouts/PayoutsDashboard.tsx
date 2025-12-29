import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpFromLine, Building2, Clock, Plus, CheckCircle2 } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { Button } from '@/components/ui/button';

const mockBankAccounts = [
  { id: '1', name: 'Chase Business', network: 'WIRE', lastFour: '1234', status: 'verified' },
  { id: '2', name: 'Bank of America', network: 'ACH', lastFour: '5678', status: 'verified' },
];

const mockPayouts = [
  { id: '1', amount: '$15,000.00', bankAccount: 'Chase ****1234', status: 'completed' as const, date: '2024-01-15 09:30' },
  { id: '2', amount: '$8,500.00', bankAccount: 'BoA ****5678', status: 'processing' as const, date: '2024-01-14 16:45' },
  { id: '3', amount: '$22,000.00', bankAccount: 'Chase ****1234', status: 'completed' as const, date: '2024-01-12 11:20' },
];

const PayoutsDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pay-outs Dashboard</h2>
          <p className="text-muted-foreground">Manage fiat withdrawals and bank accounts</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/payouts/bank-accounts">
            <Button variant="outline" className="border-border">
              <Building2 className="h-4 w-4 mr-2" />
              Manage Banks
            </Button>
          </Link>
          <Link to="/app/payouts/create">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Payout
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Payouts"
          value="$245,500"
          change="+18.2% from last month"
          changeType="positive"
          icon={ArrowUpFromLine}
        />
        <StatCard
          title="Pending"
          value="$8,500"
          change="1 in progress"
          changeType="neutral"
          icon={Clock}
        />
        <StatCard
          title="Completed (30d)"
          value="$237,000"
          change="15 transactions"
          changeType="positive"
          icon={CheckCircle2}
        />
        <StatCard
          title="Bank Accounts"
          value="2"
          change="All verified"
          changeType="neutral"
          icon={Building2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bank Accounts */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Registered Bank Accounts</h3>
            <Link to="/app/payouts/bank-accounts/new" className="text-sm text-primary hover:underline">
              Add New
            </Link>
          </div>
          <div className="space-y-3">
            {mockBankAccounts.map((account) => (
              <div 
                key={account.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{account.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.network} • ****{account.lastFour}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success capitalize">
                  {account.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payouts */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Recent Payouts</h3>
            <Link to="/app/payouts/history" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {mockPayouts.map((payout) => (
              <div 
                key={payout.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                    <ArrowUpFromLine className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{payout.amount}</p>
                    <p className="text-sm text-muted-foreground">
                      {payout.bankAccount} • {payout.date}
                    </p>
                  </div>
                </div>
                <TransactionStatusBadge status={payout.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutsDashboard;
