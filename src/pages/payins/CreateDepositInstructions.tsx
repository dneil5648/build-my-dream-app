import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreateDepositInstructions } from '@/hooks/useFiat';
import { FiatNetwork, AccountType } from '@/api/types';

const CreateDepositInstructions: React.FC = () => {
  const [formData, setFormData] = useState({
    account_id: '',
    network: '' as FiatNetwork | '',
    account_type: '' as AccountType | '',
    source_asset: 'USD',
  });
  const [instructions, setInstructions] = useState<{
    id: string;
    deposit_instructions_id: string;
    network: string;
    account_type: string;
  } | null>(null);
  const [copied, setCopied] = useState('');

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const createInstructions = useCreateDepositInstructions();
  const accounts = accountsResponse?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_id || !formData.network || !formData.account_type) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await createInstructions.mutateAsync({
        account_id: formData.account_id,
        network: formData.network as FiatNetwork,
        account_type: formData.account_type as AccountType,
        source_asset: formData.source_asset,
      });
      
      if (response.success && response.data) {
        setInstructions({
          id: response.data.id,
          deposit_instructions_id: response.data.deposit_instructions_id,
          network: response.data.network,
          account_type: response.data.account_type,
        });
        toast.success('Deposit instructions created successfully');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create deposit instructions');
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/pay-ins">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Create Deposit Instructions</h2>
          <p className="text-muted-foreground">Generate bank deposit instructions for fiat on-ramp</p>
        </div>
      </div>

      {!instructions ? (
        <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
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
            <div className="space-y-2">
              <Label>Network</Label>
              <Select value={formData.network} onValueChange={(v) => setFormData({...formData, network: v as FiatNetwork})}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WIRE">WIRE</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="CBIT">CBIT</SelectItem>
                  <SelectItem value="DBS_ACT">DBS ACT</SelectItem>
                  <SelectItem value="CUBIX">CUBIX</SelectItem>
                  <SelectItem value="SCB">SCB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select value={formData.account_type} onValueChange={(v) => setFormData({...formData, account_type: v as AccountType})}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">Checking</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source Asset</Label>
              <Select value={formData.source_asset} onValueChange={(v) => setFormData({...formData, source_asset: v})}>
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
            disabled={createInstructions.isPending} 
            className="w-full bg-primary hover:bg-primary/90"
          >
            {createInstructions.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Deposit Instructions'
            )}
          </Button>
        </form>
      ) : (
        <div className="glass rounded-xl p-8 space-y-6">
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Deposit Instructions Created</h3>
            <p className="text-muted-foreground">Use the following details for your transfer</p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Instruction ID', value: instructions.deposit_instructions_id, key: 'id' },
              { label: 'Network', value: instructions.network, key: 'network' },
              { label: 'Account Type', value: instructions.account_type, key: 'type' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-mono font-medium text-foreground">{item.value}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => copyToClipboard(item.value, item.key)}
                  className="text-muted-foreground hover:text-primary"
                >
                  {copied === item.key ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 border-border" onClick={() => setInstructions(null)}>
              Create Another
            </Button>
            <Link to="/app/pay-ins" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90">Done</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDepositInstructions;
