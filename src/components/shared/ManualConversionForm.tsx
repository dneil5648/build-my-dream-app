import React, { useState, useMemo } from 'react';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { 
  ConvertAssetRequest,
  AccountBalanceItem 
} from '@/api/types';

interface ManualConversionFormProps {
  balances: AccountBalanceItem[];
  selectedAccountId: string | null;
  onSubmit: (data: ConvertAssetRequest) => Promise<void>;
  isLoading: boolean;
  onCancel?: () => void;
}

// All supported assets for conversion
const SUPPORTED_ASSETS = ['USDG', 'PYUSD', 'USDP', 'USDC', 'USD', 'BTC', 'ETH', 'SOL'];

export const ManualConversionForm: React.FC<ManualConversionFormProps> = ({
  balances,
  selectedAccountId,
  onSubmit,
  isLoading,
  onCancel
}) => {
  const [sourceAsset, setSourceAsset] = useState<string>('');
  const [destinationAsset, setDestinationAsset] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  // Get available balance for selected source asset
  const availableBalance = useMemo(() => {
    const balance = balances.find(b => b.asset === sourceAsset);
    return balance ? parseFloat(balance.available) : 0;
  }, [balances, sourceAsset]);

  // Filter destination assets to exclude source asset
  const availableDestinationAssets = useMemo(() => {
    return SUPPORTED_ASSETS.filter(asset => asset !== sourceAsset);
  }, [sourceAsset]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountId || !sourceAsset || !destinationAsset || !amount) {
      return;
    }

    const request: ConvertAssetRequest = {
      account_id: selectedAccountId,
      source_asset: sourceAsset,
      destination_asset: destinationAsset,
      amount: amount,
    };

    await onSubmit(request);
    
    // Reset form on success
    setAmount('');
  };

  // Set max amount
  const handleSetMax = () => {
    setAmount(availableBalance.toString());
  };

  // Swap source and destination assets
  const handleSwap = () => {
    const temp = sourceAsset;
    setSourceAsset(destinationAsset);
    setDestinationAsset(temp);
    setAmount('');
  };

  const isValid = sourceAsset && destinationAsset && amount && parseFloat(amount) > 0 && parseFloat(amount) <= availableBalance;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Source Asset */}
      <div className="space-y-2">
        <Label htmlFor="source-asset">From</Label>
        <Select value={sourceAsset} onValueChange={(value) => {
          setSourceAsset(value);
          // Clear destination if it's the same as the new source
          if (destinationAsset === value) {
            setDestinationAsset('');
          }
        }}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Select asset to convert" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {SUPPORTED_ASSETS.map((asset) => {
              const balance = balances.find(b => b.asset === asset);
              return (
                <SelectItem key={asset} value={asset}>
                  <div className="flex items-center gap-2">
                    <AssetIcon asset={asset} size="sm" />
                    <span>{asset}</span>
                    {balance && (
                      <span className="text-muted-foreground text-xs ml-2">
                        ({parseFloat(balance.available).toLocaleString()} available)
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Swap Button */}
      {sourceAsset && destinationAsset && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSwap}
            className="rounded-full border-border hover:border-module-payins hover:bg-module-payins/5"
          >
            <ArrowRightLeft className="h-4 w-4 rotate-90" />
          </Button>
        </div>
      )}

      {/* Destination Asset */}
      <div className="space-y-2">
        <Label htmlFor="destination-asset">To</Label>
        <Select value={destinationAsset} onValueChange={setDestinationAsset}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Select destination asset" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {availableDestinationAssets.map((asset) => (
              <SelectItem key={asset} value={asset}>
                <div className="flex items-center gap-2">
                  <AssetIcon asset={asset} size="sm" />
                  <span>{asset}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="amount">Amount</Label>
          {sourceAsset && availableBalance > 0 && (
            <button 
              type="button"
              onClick={handleSetMax}
              className="text-xs text-module-payins hover:underline"
            >
              Max: {availableBalance.toLocaleString()} {sourceAsset}
            </button>
          )}
        </div>
        <Input
          id="amount"
          type="number"
          step="any"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-background border-border"
        />
        {parseFloat(amount) > availableBalance && availableBalance > 0 && (
          <p className="text-xs text-destructive">
            Amount exceeds available balance
          </p>
        )}
      </div>

      {/* Conversion Summary */}
      {isValid && (
        <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
          <h4 className="font-medium text-sm text-foreground">Conversion Summary</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AssetIcon asset={sourceAsset} size="sm" />
              <div>
                <p className="font-medium text-foreground">{amount} {sourceAsset}</p>
                <p className="text-xs text-muted-foreground">You pay</p>
              </div>
            </div>
            <ArrowRightLeft className="h-5 w-5 text-module-payins" />
            <div className="flex items-center gap-2">
              <AssetIcon asset={destinationAsset} size="sm" />
              <div className="text-right">
                <p className="font-medium text-foreground">{destinationAsset}</p>
                <p className="text-xs text-muted-foreground">You receive</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Final amount will be determined at execution
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={!isValid || isLoading}
          className="bg-module-payins hover:bg-module-payins/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Convert
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
