import React from 'react';
import { Bitcoin, Copy, ExternalLink, ArrowRight, Building2, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CryptoAddress } from '@/api/types';
import { toast } from 'sonner';

interface DepositAddressDetailModalProps {
  address: CryptoAddress | null;
  isOpen: boolean;
  onClose: () => void;
}

const getNetworkLabel = (network: string): string => {
  const labels: Record<string, string> = {
    ETHEREUM: 'Ethereum',
    SOLANA: 'Solana',
    STELLAR: 'Stellar',
    BASE: 'Base',
    POLYGON: 'Polygon',
  };
  return labels[network] || network;
};

const getExplorerUrl = (network: string, address: string): string | null => {
  const explorers: Record<string, string> = {
    ETHEREUM: `https://etherscan.io/address/${address}`,
    SOLANA: `https://solscan.io/account/${address}`,
    STELLAR: `https://stellarchain.io/accounts/${address}`,
    BASE: `https://basescan.org/address/${address}`,
    POLYGON: `https://polygonscan.com/address/${address}`,
  };
  return explorers[network] || null;
};

const getDestinationTypeLabel = (type?: string): string => {
  if (!type) return 'Account Balance';
  const labels: Record<string, string> = {
    ACCOUNT: 'Account Balance',
    FIAT_ACCOUNT: 'Fiat Bank Account',
    CRYPTO_ADDRESS: 'External Wallet',
  };
  return labels[type] || type;
};

export const DepositAddressDetailModal: React.FC<DepositAddressDetailModalProps> = ({
  address,
  isOpen,
  onClose,
}) => {
  if (!address) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const explorerUrl = getExplorerUrl(address.network, address.wallet_address);
  const hasConversion = address.source_asset !== address.destination_asset;
  const hasDestination = address.fiat_account_id || address.crypto_destination_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-module-payins/10 flex items-center justify-center">
              <Bitcoin className="h-5 w-5 text-module-payins" />
            </div>
            <div>
              <span className="text-foreground">Deposit Address Details</span>
              <p className="text-sm text-muted-foreground font-normal">
                {getNetworkLabel(address.network)} Network
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet Address */}
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <p className="text-xs text-muted-foreground mb-2">Wallet Address</p>
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-sm text-foreground break-all">
                {address.wallet_address}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(address.wallet_address)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {explorerUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(explorerUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Flow Visualization */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground mb-4">Deposit Flow</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {/* Source */}
              <div className="text-center p-4 rounded-lg bg-background border border-border min-w-[120px]">
                <Bitcoin className="h-8 w-8 mx-auto mb-2 text-module-payins" />
                <p className="text-sm font-medium text-foreground">{address.source_asset}</p>
                <p className="text-xs text-muted-foreground">Deposit</p>
              </div>

              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />

              {/* Conversion (if applicable) */}
              {hasConversion && (
                <>
                  <div className="text-center p-4 rounded-lg bg-background border border-primary/50 min-w-[120px]">
                    <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">⇄</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{address.destination_asset}</p>
                    <p className="text-xs text-muted-foreground">Convert</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </>
              )}

              {/* Destination */}
              <div className="text-center p-4 rounded-lg bg-background border border-success/50 min-w-[120px]">
                {address.fiat_account_id ? (
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-success" />
                ) : address.crypto_destination_id ? (
                  <Wallet className="h-8 w-8 mx-auto mb-2 text-success" />
                ) : (
                  <Wallet className="h-8 w-8 mx-auto mb-2 text-success" />
                )}
                <p className="text-sm font-medium text-foreground">
                  {getDestinationTypeLabel(address.destination_type)}
                </p>
                <p className="text-xs text-muted-foreground">Destination</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">Network</p>
              <p className="text-sm font-medium text-foreground">{getNetworkLabel(address.network)}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">Status</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                address.status === 'ACTIVE' || address.status === 'APPROVED'
                  ? 'bg-success/20 text-success'
                  : 'bg-warning/20 text-warning'
              }`}>
                {address.status || 'ACTIVE'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">Source Asset</p>
              <p className="text-sm font-medium text-foreground">{address.source_asset}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">Destination Asset</p>
              <p className="text-sm font-medium text-foreground">{address.destination_asset}</p>
            </div>
            {address.paxos_account_id && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border md:col-span-2">
                <p className="text-xs text-muted-foreground">Associated Account</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-foreground truncate">
                    {address.paxos_account_id}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(address.paxos_account_id)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {address.created_at && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm text-foreground">
                  {new Date(address.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};