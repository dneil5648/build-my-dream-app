import React from 'react';
import { Wallet, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CryptoDestinationAddress } from '@/api/types';
import { toast } from 'sonner';

interface DestinationAddressListProps {
  addresses: CryptoDestinationAddress[];
  isLoading?: boolean;
  emptyMessage?: string;
  onSelect?: (address: CryptoDestinationAddress) => void;
}

const getNetworkLabel = (network: string): string => {
  const labels: Record<string, string> = {
    BITCOIN: 'Bitcoin',
    ETHEREUM: 'Ethereum',
    POLYGON: 'Polygon',
    SOLANA: 'Solana',
    LITECOIN: 'Litecoin',
    TRON: 'Tron',
  };
  return labels[network] || network;
};

const getNetworkColor = (network: string): string => {
  const colors: Record<string, string> = {
    BITCOIN: 'bg-orange-500/20 text-orange-400',
    ETHEREUM: 'bg-blue-500/20 text-blue-400',
    POLYGON: 'bg-purple-500/20 text-purple-400',
    SOLANA: 'bg-green-500/20 text-green-400',
    LITECOIN: 'bg-gray-500/20 text-gray-400',
    TRON: 'bg-red-500/20 text-red-400',
  };
  return colors[network] || 'bg-muted text-muted-foreground';
};

const getExplorerUrl = (network: string, address: string): string | null => {
  const explorers: Record<string, string> = {
    BITCOIN: `https://blockstream.info/address/${address}`,
    ETHEREUM: `https://etherscan.io/address/${address}`,
    POLYGON: `https://polygonscan.com/address/${address}`,
    SOLANA: `https://solscan.io/account/${address}`,
    LITECOIN: `https://blockchair.com/litecoin/address/${address}`,
    TRON: `https://tronscan.org/#/address/${address}`,
  };
  return explorers[network] || null;
};

export const DestinationAddressList: React.FC<DestinationAddressListProps> = ({
  addresses,
  isLoading,
  emptyMessage = 'No destination addresses found',
  onSelect,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((addr) => {
        const explorerUrl = getExplorerUrl(addr.crypto_network, addr.address);
        
        return (
          <div
            key={addr.id}
            onClick={() => onSelect?.(addr)}
            className={`p-4 rounded-lg border border-border bg-secondary/50 hover:border-module-payins/50 transition-colors ${onSelect ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-module-payins/10 flex items-center justify-center shrink-0">
                  <Wallet className="h-5 w-5 text-module-payins" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getNetworkColor(addr.crypto_network)}`}>
                      {getNetworkLabel(addr.crypto_network)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      addr.status === 'APPROVED' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                    }`}>
                      {addr.status}
                    </span>
                  </div>
                  {addr.label && (
                    <p className="font-medium text-foreground">{addr.label}</p>
                  )}
                  <p className="text-sm text-muted-foreground font-mono truncate max-w-[300px]">
                    {addr.address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(addr.address);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {explorerUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(explorerUrl, '_blank');
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};