import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowDownToLine, Loader2, Copy, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { useAccounts } from '@/hooks/useAccounts';
import { useDepositInstructions, useSandboxDeposit } from '@/hooks/useFiat';
import { FiatDepositInstructions } from '@/api/types';

const SandboxDeposit: React.FC = () => {
  const [selectedInstructionId, setSelectedInstructionId] = useState('');
  const [amount, setAmount] = useState('1000.00');
  const [asset, setAsset] = useState('USD');
  const [copied, setCopied] = useState(false);
  const [transaction, setTransaction] = useState<{
    id: string;
    amount: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
  } | null>(null);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'PAY_INS' });
  const { data: instructionsResponse, isLoading: loadingInstructions } = useDepositInstructions();
  const sandboxDeposit = useSandboxDeposit();
  
  const accounts = accountsResponse?.data || [];
  const instructions = instructionsResponse?.data || [];
  const selectedInstruction = instructions.find((i: FiatDepositInstructions) => i.id === selectedInstructionId);

  const handleCopyMemo = (memo: string) => {
    navigator.clipboard.writeText(memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Memo ID copied to clipboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInstructionId || !amount) {
      toast.error('Please select deposit instructions and enter an amount');
      return;
    }

    // Show pending state
    setTransaction({ id: 'TXN-' + Date.now(), amount, status: 'PENDING' });
    
    try {
      // Update to processing
      setTimeout(() => {
        setTransaction(prev => prev ? {...prev, status: 'PROCESSING'} : null);
      }, 500);

      await sandboxDeposit.mutateAsync({
        deposit_instruction_id: selectedInstructionId,
        amount,
        asset,
        account_number: '9876543210',
        account_owner_address: {
          country: 'US',
          address1: '123 Main Street',
          city: 'New York',
          province: 'NY',
          zip_code: '10001'
        },
        routing_details: {
          routing_number_type: 'ABA',
          routing_number: '123456789',
          bank_name: 'Test Bank of America',
          bank_address: {
            country: 'US',
            address1: '456 Bank Street',
            city: 'New York',
            province: 'NY',
            zip_code: '10002'
          }
        }
      });
      
      // Update to completed
      setTransaction(prev => prev ? {...prev, status: 'COMPLETED'} : null);
      toast.success('Sandbox deposit completed! Check your balance.');
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

      {/* Info Banner */}
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex gap-3">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">How it works:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>First, create deposit instructions from the Pay-ins dashboard</li>
            <li>Select the deposit instruction below</li>
            <li>Enter an amount and simulate the deposit</li>
            <li>Funds will appear in your account balance</li>
          </ol>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <Label>Deposit Instructions</Label>
          <Select 
            value={selectedInstructionId} 
            onValueChange={setSelectedInstructionId}
            disabled={loadingInstructions}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={loadingInstructions ? 'Loading...' : 'Select deposit instructions'} />
            </SelectTrigger>
            <SelectContent>
              {instructions.length > 0 ? (
                instructions.map((instruction: FiatDepositInstructions) => (
                  <SelectItem key={instruction.id} value={instruction.id}>
                    {instruction.network} • {instruction.instruction_type} • {instruction.deposit_instructions_id?.slice(0, 12)}...
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No deposit instructions found. Create one from the Pay-ins dashboard first.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Instruction Details */}
        {selectedInstruction && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <span className="font-medium text-foreground">{selectedInstruction.network}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="font-medium text-foreground capitalize">{selectedInstruction.instruction_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success capitalize">{selectedInstruction.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Instruction ID</span>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={() => handleCopyMemo(selectedInstruction.deposit_instructions_id)}
                className="h-auto py-1 px-2 gap-1.5"
              >
                <span className="font-mono text-xs">{selectedInstruction.deposit_instructions_id?.slice(0, 16)}...</span>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="text"
              placeholder="1000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select value={asset} onValueChange={setAsset}>
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
          disabled={sandboxDeposit.isPending || !amount || !selectedInstructionId} 
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
              <p className="font-semibold text-foreground">${transaction.amount} {asset}</p>
            </div>
            <TransactionStatusBadge status={transaction.status} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SandboxDeposit;