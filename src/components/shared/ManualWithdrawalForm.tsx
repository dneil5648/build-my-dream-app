import React, { useState, useMemo } from 'react';
import { Loader2, ArrowUpFromLine, Wallet, Building2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { 
  PaxosAccount, 
  CryptoDestinationAddress, 
  FiatAccount,
  WithdrawAssetRequest,
  AccountBalanceItem 
} from '@/api/types';

type WithdrawalType = 'crypto' | 'fiat' | 'internal';

interface ManualWithdrawalFormProps {
  accounts: PaxosAccount[];
  destinationAddresses: CryptoDestinationAddress[];
  fiatAccounts: FiatAccount[];
  balances: AccountBalanceItem[];
  selectedAccountId: string | null;
  onSubmit: (data: WithdrawAssetRequest) => Promise<void>;
  isLoading: boolean;
  onCancel?: () => void;
}

const SUPPORTED_ASSETS = ['USDG', 'PYUSD', 'USDP', 'USDC', 'USD', 'BTC', 'ETH', 'SOL'];

const CRYPTO_NETWORKS: Record<string, string[]> = {
  'ETHEREUM': ['USDG', 'PYUSD', 'USDP', 'USDC', 'ETH'],
  'SOLANA': ['USDG', 'PYUSD', 'USDC', 'SOL'],
  'STELLAR': ['USDG', 'USDC'],
  'BASE': ['USDG', 'USDC'],
  'POLYGON': ['USDG', 'USDC'],
  'BITCOIN': ['BTC'],
};

export const ManualWithdrawalForm: React.FC<ManualWithdrawalFormProps> = ({
  accounts,
  destinationAddresses,
  fiatAccounts,
  balances,
  selectedAccountId,
  onSubmit,
  isLoading,
  onCancel
}) => {
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>('crypto');
  const [sourceAsset, setSourceAsset] = useState<string>('');
  const [destinationAsset, setDestinationAsset] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedDestinationAddress, setSelectedDestinationAddress] = useState<string>('');
  const [selectedFiatAccount, setSelectedFiatAccount] = useState<string>('');
  const [selectedDestinationAccount, setSelectedDestinationAccount] = useState<string>('');
  const [network, setNetwork] = useState<string>('');

  // Get available balance for selected source asset
  const availableBalance = useMemo(() => {
    const balance = balances.find(b => b.asset === sourceAsset);
    return balance ? parseFloat(balance.available) : 0;
  }, [balances, sourceAsset]);

  // Filter destination addresses by network
  const filteredDestinations = useMemo(() => {
    if (!network) return destinationAddresses;
    return destinationAddresses.filter(addr => addr.crypto_network === network);
  }, [destinationAddresses, network]);

  // Get networks available for the selected destination asset
  const availableNetworks = useMemo(() => {
    if (!destinationAsset) return Object.keys(CRYPTO_NETWORKS);
    return Object.entries(CRYPTO_NETWORKS)
      .filter(([_, assets]) => assets.includes(destinationAsset))
      .map(([network]) => network);
  }, [destinationAsset]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountId || !sourceAsset || !destinationAsset || !amount) {
      return;
    }

    const request: WithdrawAssetRequest = {
      account_id: selectedAccountId,
      source_asset: sourceAsset,
      destination_asset: destinationAsset,
      amount: amount,
    };

    // Add destination based on type
    if (withdrawalType === 'crypto' && selectedDestinationAddress) {
      const destAddr = destinationAddresses.find(a => a.id === selectedDestinationAddress);
      if (destAddr) {
        request.destination_address = destAddr.address;
        request.network = network as any;
      }
    } else if (withdrawalType === 'fiat' && selectedFiatAccount) {
      const fiatAcc = fiatAccounts.find(a => a.id === selectedFiatAccount);
      if (fiatAcc?.paxos_fiat_account_id) {
        request.fiat_account_id = fiatAcc.paxos_fiat_account_id;
      }
    } else if (withdrawalType === 'internal' && selectedDestinationAccount) {
      request.destination_account_id = selectedDestinationAccount;
    }

    await onSubmit(request);
  };

  // Reset form fields when withdrawal type changes
  const handleTypeChange = (type: WithdrawalType) => {
    setWithdrawalType(type);
    setSelectedDestinationAddress('');
    setSelectedFiatAccount('');
    setSelectedDestinationAccount('');
    
    // Set default assets based on type
    if (type === 'fiat') {
      setDestinationAsset('USD');
    }
  };

  // Set max amount
  const handleSetMax = () => {
    setAmount(availableBalance.toString());
  };

  const isValid = sourceAsset && destinationAsset && amount && parseFloat(amount) > 0 && (
    (withdrawalType === 'crypto' && selectedDestinationAddress && network) ||
    (withdrawalType === 'fiat' && selectedFiatAccount) ||
    (withdrawalType === 'internal' && selectedDestinationAccount)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Withdrawal Type Selector */}
      <div className="space-y-2">
        <Label>Withdrawal Type</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={withdrawalType === 'crypto' ? 'default' : 'outline'}
            className={withdrawalType === 'crypto' 
              ? 'bg-module-payins hover:bg-module-payins/90' 
              : 'border-border hover:border-module-payins hover:bg-module-payins/5'}
            onClick={() => handleTypeChange('crypto')}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Crypto
          </Button>
          <Button
            type="button"
            variant={withdrawalType === 'fiat' ? 'default' : 'outline'}
            className={withdrawalType === 'fiat' 
              ? 'bg-module-payins hover:bg-module-payins/90' 
              : 'border-border hover:border-module-payins hover:bg-module-payins/5'}
            onClick={() => handleTypeChange('fiat')}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Fiat
          </Button>
          <Button
            type="button"
            variant={withdrawalType === 'internal' ? 'default' : 'outline'}
            className={withdrawalType === 'internal' 
              ? 'bg-module-payins hover:bg-module-payins/90' 
              : 'border-border hover:border-module-payins hover:bg-module-payins/5'}
            onClick={() => handleTypeChange('internal')}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Internal
          </Button>
        </div>
      </div>

      {/* Source Asset */}
      <div className="space-y-2">
        <Label htmlFor="source-asset">Source Asset</Label>
        <Select value={sourceAsset} onValueChange={setSourceAsset}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Select asset to withdraw" />
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

      {/* Destination Asset */}
      <div className="space-y-2">
        <Label htmlFor="destination-asset">Destination Asset</Label>
        <Select value={destinationAsset} onValueChange={setDestinationAsset}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Select destination asset" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {(withdrawalType === 'fiat' ? ['USD'] : SUPPORTED_ASSETS).map((asset) => (
              <SelectItem key={asset} value={asset}>
                <div className="flex items-center gap-2">
                  <AssetIcon asset={asset} size="sm" />
                  <span>{asset}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {sourceAsset && destinationAsset && sourceAsset !== destinationAsset && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Conversion will be performed: {sourceAsset} → {destinationAsset}
          </p>
        )}
      </div>

      {/* Network Selection (Crypto Only) */}
      {withdrawalType === 'crypto' && (
        <div className="space-y-2">
          <Label htmlFor="network">Network</Label>
          <Select value={network} onValueChange={setNetwork}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {availableNetworks.map((net) => (
                <SelectItem key={net} value={net}>
                  {net}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Destination Selection */}
      {withdrawalType === 'crypto' && (
        <div className="space-y-2">
          <Label htmlFor="destination-address">Destination Address</Label>
          <Select value={selectedDestinationAddress} onValueChange={setSelectedDestinationAddress}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Select destination wallet" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {filteredDestinations.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No destinations registered{network ? ` for ${network}` : ''}
                </div>
              ) : (
                filteredDestinations.map((addr) => (
                  <SelectItem key={addr.id} value={addr.id}>
                    <div className="flex flex-col">
                      <span>{addr.nickname || addr.label || 'Unnamed'}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {addr.address.slice(0, 10)}...{addr.address.slice(-8)}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {withdrawalType === 'fiat' && (
        <div className="space-y-2">
          <Label htmlFor="fiat-account">Bank Account</Label>
          <Select value={selectedFiatAccount} onValueChange={setSelectedFiatAccount}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Select bank account" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {fiatAccounts.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No fiat accounts registered
                </div>
              ) : (
                fiatAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex flex-col">
                      <span>{account.description || account.bank_name || 'Bank Account'}</span>
                      <span className="text-xs text-muted-foreground">
                        {account.network} • {account.wire_account_number ? `****${account.wire_account_number.slice(-4)}` : 'Pending'}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {withdrawalType === 'internal' && (
        <div className="space-y-2">
          <Label htmlFor="destination-account">Destination Account</Label>
          <Select value={selectedDestinationAccount} onValueChange={setSelectedDestinationAccount}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Select destination account" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {accounts.filter(a => a.id !== selectedAccountId).length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No other accounts available
                </div>
              ) : (
                accounts
                  .filter(a => a.id !== selectedAccountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex flex-col">
                        <span>{account.nickname || account.description || 'Unnamed Account'}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {account.paxos_account_id?.slice(0, 12)}...
                        </span>
                      </div>
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

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

      {/* Summary */}
      {isValid && (
        <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
          <h4 className="font-medium text-sm text-foreground">Withdrawal Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Type:</span>
            <span className="text-foreground capitalize">{withdrawalType}</span>
            <span className="text-muted-foreground">Amount:</span>
            <span className="text-foreground">{amount} {sourceAsset}</span>
            {sourceAsset !== destinationAsset && (
              <>
                <span className="text-muted-foreground">Convert to:</span>
                <span className="text-foreground">{destinationAsset}</span>
              </>
            )}
            {withdrawalType === 'crypto' && network && (
              <>
                <span className="text-muted-foreground">Network:</span>
                <span className="text-foreground">{network}</span>
              </>
            )}
          </div>
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
              Processing...
            </>
          ) : (
            <>
              <ArrowUpFromLine className="h-4 w-4 mr-2" />
              Withdraw
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
