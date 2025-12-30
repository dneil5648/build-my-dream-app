import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpFromLine, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { useAccounts } from '@/hooks/useAccounts';

const TreasuryWithdraw: React.FC = () => {
  const [formData, setFormData] = useState({
    account: '',
    asset: '',
    destination: '',
    amount: '',
    network: '',
  });
  const [fee, setFee] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: accountsResponse } = useAccounts();
  const accounts = accountsResponse?.data || [];

  const balances: Record<string, string> = {
    BTC: '2.45678',
    ETH: '15.8921',
    USDC: '50,000.00',
  };

  const handleCalculateFee = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setFee('0.0005');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    toast.success('Withdrawal initiated successfully');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/treasury">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Payout to External Wallet</h2>
          <p className="text-muted-foreground">Withdraw crypto to an external wallet address</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <Label>Source Account</Label>
          <Select value={formData.account} onValueChange={(v) => setFormData({...formData, account: v})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.paxos_account_id}>
                  {account.paxos_account_id}
                </SelectItem>
              ))}
              {accounts.length === 0 && (
                <SelectItem value="" disabled>No accounts available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Asset</Label>
          <Select value={formData.asset} onValueChange={(v) => { setFormData({...formData, asset: v, network: ''}); handleCalculateFee(); }}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BTC">
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2">
                    <AssetIcon asset="BTC" size="sm" />
                    Bitcoin (BTC)
                  </div>
                  <span className="text-muted-foreground">{balances.BTC}</span>
                </div>
              </SelectItem>
              <SelectItem value="ETH">
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2">
                    <AssetIcon asset="ETH" size="sm" />
                    Ethereum (ETH)
                  </div>
                  <span className="text-muted-foreground">{balances.ETH}</span>
                </div>
              </SelectItem>
              <SelectItem value="USDC">
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2">
                    <AssetIcon asset="USDC" size="sm" />
                    USD Coin (USDC)
                  </div>
                  <span className="text-muted-foreground">{balances.USDC}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Network Selection */}
        {formData.asset && (
          <div className="space-y-2">
            <Label>Network</Label>
            <Select value={formData.network} onValueChange={(v) => { setFormData({...formData, network: v}); handleCalculateFee(); }}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {formData.asset === 'BTC' && (
                  <>
                    <SelectItem value="BITCOIN">Bitcoin Network</SelectItem>
                    <SelectItem value="LIGHTNING">Lightning Network</SelectItem>
                  </>
                )}
                {formData.asset === 'ETH' && (
                  <>
                    <SelectItem value="ETHEREUM">Ethereum Network</SelectItem>
                    <SelectItem value="ARBITRUM">Arbitrum</SelectItem>
                    <SelectItem value="OPTIMISM">Optimism</SelectItem>
                  </>
                )}
                {formData.asset === 'USDC' && (
                  <>
                    <SelectItem value="ETHEREUM">Ethereum Network</SelectItem>
                    <SelectItem value="POLYGON">Polygon Network</SelectItem>
                    <SelectItem value="SOLANA">Solana</SelectItem>
                    <SelectItem value="ARBITRUM">Arbitrum</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Destination Address</Label>
          <Input
            placeholder="Enter wallet address"
            value={formData.destination}
            onChange={(e) => setFormData({...formData, destination: e.target.value})}
            className="bg-secondary border-border font-mono"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount</Label>
            {formData.asset && (
              <button 
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setFormData({...formData, amount: balances[formData.asset] || ''})}
              >
                Max: {balances[formData.asset]}
              </button>
            )}
          </div>
          <Input
            type="text"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="bg-secondary border-border"
          />
        </div>

        {/* Fee Estimate */}
        {fee && formData.network && (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Network Fee</p>
                <p className="text-sm text-muted-foreground">
                  Estimated fee: {fee} {formData.asset}
                </p>
              </div>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={loading || !formData.amount || !formData.destination || !formData.network} 
          className="w-full bg-warning hover:bg-warning/90 text-warning-foreground"
        >
          <ArrowUpFromLine className="h-4 w-4 mr-2" />
          {loading ? 'Processing...' : 'Withdraw'}
        </Button>
      </form>
    </div>
  );
};

export default TreasuryWithdraw;
