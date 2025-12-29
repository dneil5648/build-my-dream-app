import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';

const SandboxDeposit: React.FC = () => {
  const [formData, setFormData] = useState({
    instruction: '',
    amount: '',
    asset: 'USD',
    bankAccount: '',
  });
  const [transaction, setTransaction] = useState<{
    id: string;
    amount: string;
    status: 'pending' | 'processing' | 'completed';
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTransaction({ id: 'TXN-' + Date.now(), amount: formData.amount, status: 'pending' });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setTransaction(prev => prev ? {...prev, status: 'processing'} : null);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTransaction(prev => prev ? {...prev, status: 'completed'} : null);
    
    setLoading(false);
    toast.success('Sandbox deposit completed!');
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
          <Label>Deposit Instruction</Label>
          <Select value={formData.instruction} onValueChange={(v) => setFormData({...formData, instruction: v})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select deposit instruction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instr1">WIRE - ****1234 (PAX-001)</SelectItem>
              <SelectItem value="instr2">ACH - ****5678 (PAX-002)</SelectItem>
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
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Mock Bank Account Number</Label>
          <Input
            placeholder="Enter mock bank account"
            value={formData.bankAccount}
            onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
            className="bg-secondary border-border"
          />
        </div>

        <Button type="submit" disabled={loading || !formData.amount} className="w-full bg-success hover:bg-success/90">
          <ArrowDownToLine className="h-4 w-4 mr-2" />
          {loading ? 'Processing...' : 'Simulate Deposit'}
        </Button>
      </form>

      {/* Transaction Status */}
      {transaction && (
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Transaction Status</h3>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border">
            <div>
              <p className="font-mono text-sm text-muted-foreground">{transaction.id}</p>
              <p className="font-semibold text-foreground">${transaction.amount} USD</p>
            </div>
            <TransactionStatusBadge status={transaction.status} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SandboxDeposit;
