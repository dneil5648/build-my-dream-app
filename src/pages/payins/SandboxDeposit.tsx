import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowDownToLine, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { useAccounts } from '@/hooks/useAccounts';
import { useSandboxDeposit } from '@/hooks/useFiat';

const SandboxDeposit: React.FC = () => {
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    asset: 'USD',
  });
  const [transaction, setTransaction] = useState<{
    id: string;
    amount: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
  } | null>(null);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const sandboxDeposit = useSandboxDeposit();
  const accounts = accountsResponse?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_id || !formData.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    // Show pending state
    setTransaction({ id: 'TXN-' + Date.now(), amount: formData.amount, status: 'PENDING' });
    
    try {
      // Update to processing
      setTimeout(() => {
        setTransaction(prev => prev ? {...prev, status: 'PROCESSING'} : null);
      }, 500);

      await sandboxDeposit.mutateAsync({
        account_id: formData.account_id,
        amount: formData.amount,
        asset: formData.asset,
      });
      
      // Update to completed
      setTransaction(prev => prev ? {...prev, status: 'COMPLETED'} : null);
      toast.success('Sandbox deposit completed!');
    } catch (error) {
      setTransaction(null);
      toast.error(error instanceof Error ? error.message : 'Failed to create sandbox deposit');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/pay-ins">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sandbox Deposit</h2>
          <p className="text-muted-foreground">Simulate a fiat deposit for testing</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="rounded-xl bg-warning/10 border border-warning/20 p-4">
        <p className="text-sm text-warning font-medium">
          ⚠️ This is a sandbox environment. Deposits are simulated and no real funds are moved.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <Label>Account</Label>
          <Select 
            value={formData.account_id} 
            onValueChange={(v) => setFormData({...formData, account_id: v})}
            disabled={loadingAccounts}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={loadingAccounts ? 'Loading...' : 'Select account'} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.paxos_account_id}>
                  Account {account.paxos_account_id.slice(0, 8)}...
                </SelectItem>
              ))}
              {accounts.length === 0 && !loadingAccounts && (
                <SelectItem value="" disabled>No accounts found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select value={formData.asset} onValueChange={(v) => setFormData({...formData, asset: v})}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="SGD">SGD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={sandboxDeposit.isPending || !formData.amount || !formData.account_id} 
          className="w-full bg-success hover:bg-success/90"
        >
          {sandboxDeposit.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Simulate Deposit
            </>
          )}
        </Button>
      </form>

      {/* Transaction Status */}
      {transaction && (
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Transaction Status</h3>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border">
            <div>
              <p className="font-mono text-sm text-muted-foreground">{transaction.id}</p>
              <p className="font-semibold text-foreground">${transaction.amount} {formData.asset}</p>
            </div>
            <TransactionStatusBadge status={transaction.status} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SandboxDeposit;
