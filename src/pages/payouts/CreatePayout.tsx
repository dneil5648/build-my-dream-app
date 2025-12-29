import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpFromLine, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';

const CreatePayout: React.FC = () => {
  const [formData, setFormData] = useState({
    sourceAccount: '',
    sourceAsset: '',
    bankAccount: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);

  const balances: Record<string, string> = {
    USDC: '50,000.00',
    USD: '25,000.00',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    toast.success('Payout initiated successfully');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/payouts">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Create Payout</h2>
          <p className="text-muted-foreground">Withdraw fiat to your registered bank account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <Label>Source Account</Label>
          <Select value={formData.sourceAccount} onValueChange={(v) => setFormData({...formData, sourceAccount: v})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main Treasury ($75,000)</SelectItem>
              <SelectItem value="trading">Trading Account ($25,000)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Source Asset</Label>
          <Select value={formData.sourceAsset} onValueChange={(v) => setFormData({...formData, sourceAsset: v})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2">
                    <AssetIcon asset="USD" size="sm" />
                    USD
                  </div>
                  <span className="text-muted-foreground">{balances.USD}</span>
                </div>
              </SelectItem>
              <SelectItem value="USDC">
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2">
                    <AssetIcon asset="USDC" size="sm" />
                    USDC (auto-convert)
                  </div>
                  <span className="text-muted-foreground">{balances.USDC}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Destination Bank Account</Label>
          <Select value={formData.bankAccount} onValueChange={(v) => setFormData({...formData, bankAccount: v})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select bank account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chase">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Chase Business ****1234 (WIRE)
                </div>
              </SelectItem>
              <SelectItem value="boa">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bank of America ****5678 (ACH)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount</Label>
            {formData.sourceAsset && (
              <button 
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setFormData({...formData, amount: balances[formData.sourceAsset]?.replace(/,/g, '') || ''})}
              >
                Max: ${balances[formData.sourceAsset]}
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="text"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="pl-8 bg-secondary border-border"
            />
          </div>
        </div>

        {/* Summary */}
        {formData.amount && formData.bankAccount && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-foreground">${formData.amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee</span>
              <span className="text-foreground">$25.00</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-medium text-foreground">You'll receive</span>
              <span className="font-semibold text-foreground">
                ${(parseFloat(formData.amount.replace(/,/g, '') || '0') - 25).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={loading || !formData.amount || !formData.bankAccount} 
          className="w-full bg-primary hover:bg-primary/90"
        >
          <ArrowUpFromLine className="h-4 w-4 mr-2" />
          {loading ? 'Processing...' : 'Create Payout'}
        </Button>
      </form>
    </div>
  );
};

export default CreatePayout;
