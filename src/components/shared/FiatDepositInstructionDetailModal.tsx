import React from 'react';
import { Copy, Check, ExternalLink, ArrowRight, DollarSign, Coins, Clock, Building2, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { toast } from 'sonner';
import { FiatDepositInstructions } from '@/api/types';

interface FiatDepositInstructionDetailModalProps {
  instruction: FiatDepositInstructions | null;
  isOpen: boolean;
  onClose: () => void;
}

const getNetworkLabel = (network: string): string => {
  const networks: Record<string, string> = {
    'WIRE': 'Wire Transfer',
    'ACH': 'ACH Transfer',
    'FEDWIRE': 'Fedwire (Real-time)',
    'SEPA': 'SEPA (Europe)',
    'CBIT': 'CBIT',
    'DBS_ACT': 'DBS ACT',
    'CUBIX': 'Cubix',
    'SCB': 'SCB',
  };
  return networks[network] || network;
};

const getCryptoNetworkLabel = (network: string): string => {
  const networks: Record<string, string> = {
    'BITCOIN': 'Bitcoin',
    'ETHEREUM': 'Ethereum',
    'POLYGON': 'Polygon',
    'SOLANA': 'Solana',
    'LITECOIN': 'Litecoin',
    'STELLAR': 'Stellar',
    'BASE': 'Base',
  };
  return networks[network] || network;
};

const getInstructionTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    'DEPOSIT_ONLY': 'Deposit Only (Hold USD)',
    'DEPOSIT_CONVERSION': 'Deposit & Convert (Hold Crypto)',
    'DEPOSIT_CONVERT_SEND': 'Deposit, Convert & Send',
  };
  return types[type] || type;
};

export const FiatDepositInstructionDetailModal: React.FC<FiatDepositInstructionDetailModalProps> = ({
  instruction,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState<string | null>(null);

  if (!instruction) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${label} copied to clipboard`);
  };

  const sourceAsset = instruction.source_asset || 'USD';
  const destinationAsset = instruction.destination_asset || 'USD';
  const isConversion = sourceAsset !== destinationAsset;
  const isAutoSend = instruction.instruction_type === 'DEPOSIT_CONVERT_SEND';
  const hasDestination = instruction.destination_address || instruction.destination_crypto_address_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            Fiat Deposit Instructions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Flow Visualization */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-center gap-4 py-2">
              {/* Source Asset */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center border-2 border-primary/30 shadow-lg">
                  <AssetIcon asset={sourceAsset} size="md" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{sourceAsset}</p>
                  <p className="text-xs text-muted-foreground">Source</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center">
                <ArrowRight className="h-6 w-6 text-primary" />
                {isConversion && (
                  <span className="text-xs text-primary mt-1">Auto-converts</span>
                )}
              </div>

              {/* Destination Asset */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-14 w-14 rounded-full bg-background flex items-center justify-center border-2 ${isConversion ? 'border-success/50' : 'border-primary/30'} shadow-lg`}>
                  <AssetIcon asset={destinationAsset} size="md" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{destinationAsset}</p>
                  <p className="text-xs text-muted-foreground">Destination</p>
                </div>
              </div>

              {/* Auto-send indicator */}
              {isAutoSend && (
                <>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="h-6 w-6 text-warning" />
                    <span className="text-xs text-warning mt-1">Auto-sends</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center border-2 border-warning/50 shadow-lg">
                      <Wallet className="h-6 w-6 text-warning" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">External</p>
                      <p className="text-xs text-muted-foreground">Wallet</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Flow Description */}
            <div className="mt-4 text-center">
              <Badge variant="outline" className="bg-background/50">
                {getInstructionTypeLabel(instruction.instruction_type)}
              </Badge>
            </div>
          </div>

          {/* Destination Wallet Details (for auto-send) */}
          {isAutoSend && hasDestination && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-warning" />
                <h4 className="font-medium text-foreground">Destination Wallet</h4>
              </div>
              
              <div className="space-y-2">
                {instruction.destination_nickname && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="font-medium text-foreground">{instruction.destination_nickname}</span>
                  </div>
                )}
                
                {instruction.destination_network && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network</span>
                    <span className="font-medium text-foreground">{getCryptoNetworkLabel(instruction.destination_network)}</span>
                  </div>
                )}
                
                {instruction.destination_address && (
                  <div className="p-3 rounded-lg bg-background/50 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-mono text-sm text-foreground truncate">{instruction.destination_address}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(instruction.destination_address!, 'Address')}
                    >
                      {copied === 'Address' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instruction Details */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs text-muted-foreground">Network</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {getNetworkLabel(instruction.network)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs text-muted-foreground">Account Type</p>
                <p className="font-medium text-foreground capitalize">{instruction.account_type?.toLowerCase() || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={instruction.status === 'active' ? 'default' : 'secondary'} className={instruction.status === 'active' ? 'bg-success/20 text-success border-success/30' : ''}>
                  {instruction.status}
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {instruction.created_at ? new Date(instruction.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* IDs Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Identifiers</h4>
            
            <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Instruction ID</p>
                <p className="font-mono text-sm text-foreground truncate">{instruction.deposit_instructions_id}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(instruction.deposit_instructions_id, 'Instruction ID')}
              >
                {copied === 'Instruction ID' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {instruction.orchestration_rule_id && (
              <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Orchestration Rule ID</p>
                  <p className="font-mono text-sm text-foreground truncate">{instruction.orchestration_rule_id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(instruction.orchestration_rule_id!, 'Rule ID')}
                >
                  {copied === 'Rule ID' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Account ID</p>
              <p className="font-mono text-sm text-foreground truncate">{instruction.paxos_account_id || instruction.account_id}</p>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
