import React from 'react';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { CryptoAddress } from '@/api/types';
import { toast } from 'sonner';

interface CryptoAddressListProps {
  addresses: CryptoAddress[];
  isLoading?: boolean;
  emptyMessage?: string;
  onSelect?: (address: CryptoAddress) => void;
}

export const CryptoAddressList: React.FC<CryptoAddressListProps> = ({
  addresses,
  isLoading,
  emptyMessage = 'No deposit addresses found',
  onSelect,
}) => {
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const getNetworkLabel = (network: string) => {
    const labels: Record<string, string> = {
      BITCOIN: 'Bitcoin',
      ETHEREUM: 'Ethereum',
      POLYGON: 'Polygon',
      SOLANA: 'Solana',
      TRON: 'Tron',
    };
    return labels[network] || network;
  };

  const getAssetFromNetwork = (network: string): string => {
    const mapping: Record<string, string> = {
      BITCOIN: 'BTC',
      ETHEREUM: 'ETH',
      POLYGON: 'USDC',
      SOLANA: 'USDC',
      TRON: 'USDT',
    };
    return mapping[network] || 'CRYPTO';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <div
          key={address.id}
          onClick={() => onSelect?.(address)}
          className={`p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors ${onSelect ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <AssetIcon asset={address.source_asset || getAssetFromNetwork(address.network)} size="sm" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{getNetworkLabel(address.network)}</span>
                  {address.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      address.status === 'active' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {address.status}
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-muted-foreground break-all">
                  {address.wallet_address}
                </p>
                {address.destination_asset && (
                  <p className="text-xs text-primary mt-1">
                    Auto-converts to {address.destination_asset}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyAddress(address.wallet_address)}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
