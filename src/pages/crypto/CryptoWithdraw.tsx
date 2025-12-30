import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpFromLine, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';

const CryptoWithdraw: React.FC = () => {
  const [formData, setFormData] = useState({
    account: '',
    asset: '',
    type: 'external',
    destination: '',
    amount: '',
    network: '',
  });
  const [fee, setFee] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        <Link to="/app/crypto">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Crypto Withdraw</h2>
          <p className="text-muted-foreground">Withdraw crypto to external wallet or internal account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
        {/* Withdrawal Type Toggle */}
        <div className="flex rounded-lg bg-secondary p-1">
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              formData.type === 'external' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => setFormData({...formData, type: 'external'})}
          >
            External Wallet
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              formData.type === 'internal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => setFormData({...formData, type: 'internal'})}
          >
            Internal Transfer
          </button>
        </div>

        <div className="space-y-2">
          <Label>Source Account</Label>
          <Select value={formData.account} onValueChange={(v) => setFormData({...formData, account: v})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main Account</SelectItem>
              <SelectItem value="trading">Trading Account</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Asset</Label>
          <Select value={formData.asset} onValueChange={(v) => { setFormData({...formData, asset: v}); handleCalculateFee(); }}>
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

        {/* Network Selection for External Wallets */}
        {formData.type === 'external' && formData.asset && (
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
          <Label>{formData.type === 'external' ? 'Destination Address' : 'Destination Account'}</Label>
          {formData.type === 'external' ? (
            <Input
              placeholder="Enter wallet address"
              value={formData.destination}
              onChange={(e) => setFormData({...formData, destination: e.target.value})}
              className="bg-secondary border-border font-mono"
            />
          ) : (
            <Select value={formData.destination} onValueChange={(v) => setFormData({...formData, destination: v})}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trading">Trading Account</SelectItem>
                <SelectItem value="reserve">Reserve Account</SelectItem>
              </SelectContent>
            </Select>
          )}
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
        {fee && formData.type === 'external' && (
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
          disabled={loading || !formData.amount || !formData.destination || (formData.type === 'external' && !formData.network)} 
          className="w-full bg-warning hover:bg-warning/90 text-warning-foreground"
        >
          <ArrowUpFromLine className="h-4 w-4 mr-2" />
          {loading ? 'Processing...' : 'Withdraw'}
        </Button>
      </form>
    </div>
  );
};

export default CryptoWithdraw;
