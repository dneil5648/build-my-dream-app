import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowDownToLine, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { Button } from '@/components/ui/button';
import { useDepositInstructions } from '@/hooks/useFiat';
import { useTransactions } from '@/hooks/useTransactions';
import { FiatDepositInstructions, Transaction } from '@/api/types';

const PayInsDashboard: React.FC = () => {
  const { data: instructionsResponse, isLoading: loadingInstructions } = useDepositInstructions();
  const { data: transactionsResponse, isLoading: loadingTransactions } = useTransactions({ limit: 5 });

  const instructions = instructionsResponse?.data || [];
  const transactions = (transactionsResponse?.data || []).filter(
    (tx: Transaction) => tx.type === 'deposit'
  );

  // Calculate stats from real data
  const completedDeposits = transactions.filter((t: Transaction) => t.status === 'completed');
  const pendingDeposits = transactions.filter((t: Transaction) => t.status === 'pending');

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
          value={loadingTransactions ? '...' : `$${completedDeposits.reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount || '0'), 0).toLocaleString()}`}
          change={`${completedDeposits.length} completed`}
          changeType="positive"
          icon={ArrowDownToLine}
        />
        <StatCard
          title="Pending Deposits"
          value={loadingTransactions ? '...' : pendingDeposits.length.toString()}
          change={`${pendingDeposits.length} pending transactions`}
          changeType="neutral"
          icon={Clock}
        />
        <StatCard
          title="Completed Today"
          value={loadingTransactions ? '...' : completedDeposits.length.toString()}
          change={`${completedDeposits.length} transactions`}
          changeType="positive"
          icon={CheckCircle2}
        />
        <StatCard
          title="Active Instructions"
          value={loadingInstructions ? '...' : instructions.length.toString()}
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
          
          {loadingInstructions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : instructions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No deposit instructions found.</p>
              <Link to="/app/pay-ins/create" className="text-primary hover:underline">
                Create your first instruction
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {instructions.map((instruction: FiatDepositInstructions) => (
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
                          Type: {instruction.account_type} • ID: {instruction.deposit_instructions_id?.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      instruction.status === 'active' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {instruction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Deposits */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Recent Deposits</h3>
            <Link to="/app/pay-ins/history" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          
          {loadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No deposits yet.</p>
              <p className="text-sm">Deposits will appear here once received.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((deposit: Transaction) => (
                <div 
                  key={deposit.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                      <ArrowDownToLine className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">${deposit.amount} {deposit.source_asset}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(deposit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <TransactionStatusBadge status={deposit.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayInsDashboard;
