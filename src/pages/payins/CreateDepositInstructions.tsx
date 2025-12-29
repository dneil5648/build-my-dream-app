import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CreateDepositInstructions: React.FC = () => {
  const [formData, setFormData] = useState({
    account: '',
    network: '',
    accountType: '',
    sourceAsset: 'USD',
    destAsset: 'USD',
  });
  const [instructions, setInstructions] = useState<{
    routingNumber: string;
    accountNumber: string;
    memoId: string;
    bankName: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setInstructions({
      routingNumber: '021000021',
      accountNumber: '9876543210',
      memoId: 'PAX-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      bankName: 'JPMorgan Chase Bank, N.A.',
    });
    setLoading(false);
    toast.success('Deposit instructions created successfully');
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
              <Select value={formData.account} onValueChange={(v) => setFormData({...formData, account: v})}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Account ($50,000)</SelectItem>
                  <SelectItem value="trading">Trading Account ($25,000)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Network</Label>
              <Select value={formData.network} onValueChange={(v) => setFormData({...formData, network: v})}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wire">WIRE</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="sepa">SEPA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select value={formData.accountType} onValueChange={(v) => setFormData({...formData, accountType: v})}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source Asset</Label>
              <Select value={formData.sourceAsset} onValueChange={(v) => setFormData({...formData, sourceAsset: v})}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
            {loading ? 'Creating...' : 'Create Deposit Instructions'}
          </Button>
        </form>
      ) : (
        <div className="glass rounded-xl p-8 space-y-6">
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Deposit Instructions Created</h3>
            <p className="text-muted-foreground">Use the following details for your wire transfer</p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Bank Name', value: instructions.bankName, key: 'bank' },
              { label: 'Routing Number', value: instructions.routingNumber, key: 'routing' },
              { label: 'Account Number', value: instructions.accountNumber, key: 'account' },
              { label: 'Memo/Reference ID', value: instructions.memoId, key: 'memo' },
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
