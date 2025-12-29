import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';

const TreasuryConvert: React.FC = () => {
  const [formData, setFormData] = useState({
    account: '',
    sourceAsset: '',
    destAsset: '',
    amount: '',
  });
  const [rate, setRate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const balances: Record<string, string> = {
    BTC: '2.45678',
    ETH: '15.8921',
    USDC: '50,000.00',
    USD: '25,000.00',
  };

  const rates: Record<string, Record<string, number>> = {
    BTC: { USD: 43000, USDC: 43000, ETH: 18.5 },
    ETH: { USD: 2300, USDC: 2300, BTC: 0.054 },
    USDC: { USD: 1, BTC: 0.000023, ETH: 0.00043 },
    USD: { USDC: 1, BTC: 0.000023, ETH: 0.00043 },
  };

  const getRate = () => {
    if (formData.sourceAsset && formData.destAsset && rates[formData.sourceAsset]) {
      return rates[formData.sourceAsset][formData.destAsset] || 1;
    }
    return null;
  };

  const getEstimatedOutput = () => {
    const r = getRate();
    if (r && formData.amount) {
      return (parseFloat(formData.amount.replace(/,/g, '')) * r).toFixed(6);
    }
    return null;
  };

  const handleConvert = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    toast.success('Conversion completed successfully!');
    setFormData({ account: '', sourceAsset: '', destAsset: '', amount: '' });
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
          <h2 className="text-2xl font-bold text-foreground">Asset Conversion</h2>
          <p className="text-muted-foreground">Convert between assets in your treasury</p>
        </div>
      </div>

      <div className="glass rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <Label>Account</Label>
          <Select value={formData.account} onValueChange={(v) => setFormData({...formData, account: v})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main Treasury</SelectItem>
              <SelectItem value="trading">Trading Account</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* From */}
        <div className="space-y-2">
          <Label>From</Label>
          <div className="p-4 rounded-lg bg-secondary border border-border space-y-4">
            <div className="flex items-center justify-between">
              <Select value={formData.sourceAsset} onValueChange={(v) => setFormData({...formData, sourceAsset: v})}>
                <SelectTrigger className="w-40 bg-muted border-0">
                  <SelectValue placeholder="Asset" />
                </SelectTrigger>
                <SelectContent>
                  {['BTC', 'ETH', 'USDC', 'USD'].map((asset) => (
                    <SelectItem key={asset} value={asset}>
                      <div className="flex items-center gap-2">
                        <AssetIcon asset={asset} size="sm" />
                        {asset}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="text-right text-xl font-semibold bg-transparent border-0 w-40"
              />
            </div>
            {formData.sourceAsset && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Available:</span>
                <button 
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setFormData({...formData, amount: balances[formData.sourceAsset] || ''})}
                >
                  {balances[formData.sourceAsset]} {formData.sourceAsset}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* To */}
        <div className="space-y-2">
          <Label>To</Label>
          <div className="p-4 rounded-lg bg-secondary border border-border space-y-4">
            <div className="flex items-center justify-between">
              <Select value={formData.destAsset} onValueChange={(v) => setFormData({...formData, destAsset: v})}>
                <SelectTrigger className="w-40 bg-muted border-0">
                  <SelectValue placeholder="Asset" />
                </SelectTrigger>
                <SelectContent>
                  {['BTC', 'ETH', 'USDC', 'USD'].filter(a => a !== formData.sourceAsset).map((asset) => (
                    <SelectItem key={asset} value={asset}>
                      <div className="flex items-center gap-2">
                        <AssetIcon asset={asset} size="sm" />
                        {asset}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xl font-semibold text-foreground">
                {getEstimatedOutput() || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Rate Display */}
        {formData.sourceAsset && formData.destAsset && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Exchange Rate</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                1 {formData.sourceAsset} = {getRate()} {formData.destAsset}
              </span>
              <RefreshCw className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
            </div>
          </div>
        )}

        <Button 
          onClick={handleConvert}
          disabled={loading || !formData.amount || !formData.sourceAsset || !formData.destAsset} 
          className="w-full bg-primary hover:bg-primary/90"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Converting...' : 'Convert'}
        </Button>
      </div>
    </div>
  );
};

export default TreasuryConvert;
