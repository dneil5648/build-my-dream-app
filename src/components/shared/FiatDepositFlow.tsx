import React, { useState } from 'react';
import { Loader2, Copy, Check, Info, ArrowRight, DollarSign, Coins, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { useCreateDepositInstructions, useSandboxDeposit } from '@/hooks/useFiat';
import { useCryptoDestinationAddresses } from '@/hooks/useCrypto';
import { 
  CreateFiatDepositInstructionsRequest, 
  FiatNetwork, 
  AccountType,
  CryptoDestinationAddress 
} from '@/api/types';

// Stablecoins for conversion
const STABLECOINS = ['USDC', 'USDT', 'USDP', 'PYUSD', 'USDG', 'DAI'];

interface FiatDepositFlowProps {
  accountId: string;
  paxosAccountId: string;
  onSuccess?: () => void;
}

type DepositScenario = 'hold_usd' | 'convert_hold' | 'convert_send';

interface DepositInstructionResult {
  id: string;
  deposit_instructions_id: string;
  memo_id?: string;
  network: string;
  status: string;
  fiat_network_details?: {
    wire?: {
      account_number: string;
      routing_number: string;
      bank_name: string;
      beneficiary_name?: string;
    };
  };
}

export const FiatDepositFlow: React.FC<FiatDepositFlowProps> = ({
  accountId,
  paxosAccountId,
  onSuccess
}) => {
  const [step, setStep] = useState<'create' | 'instructions' | 'sandbox'>('create');
  const [scenario, setScenario] = useState<DepositScenario>('hold_usd');
  const [network, setNetwork] = useState<FiatNetwork>('WIRE');
  const [accountType, setAccountType] = useState<AccountType>('CHECKING');
  const [destinationAsset, setDestinationAsset] = useState('USDC');
  const [destinationAddressId, setDestinationAddressId] = useState('');
  const [instructions, setInstructions] = useState<DepositInstructionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [sandboxAmount, setSandboxAmount] = useState('1000.00');

  const createInstructions = useCreateDepositInstructions();
  const sandboxDeposit = useSandboxDeposit();
  const { data: destinationsResponse, isLoading: loadingDestinations } = useCryptoDestinationAddresses(
    { account_id: accountId }
  );
  const destinations = destinationsResponse?.data || [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleCreateInstructions = async () => {
    const payload: CreateFiatDepositInstructionsRequest = {
      account_id: paxosAccountId,
      source_asset: 'USD',
      destination_asset: scenario === 'hold_usd' ? 'USD' : destinationAsset,
      fiat_network: network,
      fiat_account_type: accountType,
    };

    // Add crypto address for auto-send scenario
    if (scenario === 'convert_send' && destinationAddressId) {
      payload.crypto_address_id = destinationAddressId;
    }

    try {
      const result = await createInstructions.mutateAsync(payload);
      if (result?.data) {
        setInstructions(result.data as DepositInstructionResult);
        setStep('instructions');
        toast.success('Deposit instructions created');
      }
    } catch (error) {
      toast.error('Failed to create deposit instructions');
    }
  };

  const handleSandboxDeposit = async () => {
    if (!instructions?.id) return;

    try {
      await sandboxDeposit.mutateAsync({
        deposit_instruction_id: instructions.id,
        amount: sandboxAmount,
        asset: 'USD',
        account_number: '9876543210',
        account_owner_address: {
          country: 'US',
          address1: '123 Main Street',
          city: 'New York',
          province: 'NY',
          zip_code: '10001'
        },
        routing_details: {
          routing_number_type: 'ABA',
          routing_number: '123456789',
          bank_name: 'Test Bank',
          bank_address: {
            country: 'US',
            address1: '456 Bank Street',
            city: 'New York',
            province: 'NY',
            zip_code: '10002'
          }
        }
      });
      toast.success('Sandbox deposit completed! Check your balance.');
      onSuccess?.();
      // Reset to start
      setStep('create');
      setInstructions(null);
    } catch (error) {
      toast.error('Failed to simulate deposit');
    }
  };

  return (
    <div className="space-y-6">
      {step === 'create' && (
        <>
          {/* Scenario Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">What would you like to do?</Label>
            <Tabs value={scenario} onValueChange={(v) => setScenario(v as DepositScenario)}>
              <TabsList className="grid grid-cols-3 h-auto p-1">
                <TabsTrigger value="hold_usd" className="flex flex-col py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <DollarSign className="h-5 w-5 mb-1" />
                  <span className="text-xs">Hold USD</span>
                </TabsTrigger>
                <TabsTrigger value="convert_hold" className="flex flex-col py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Coins className="h-5 w-5 mb-1" />
                  <span className="text-xs">Convert & Hold</span>
                </TabsTrigger>
                <TabsTrigger value="convert_send" className="flex flex-col py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ArrowRight className="h-5 w-5 mb-1" />
                  <span className="text-xs">Convert & Send</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hold_usd" className="mt-4">
                <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  Deposit USD and keep it as USD in your account. You can manually convert or withdraw later.
                </div>
              </TabsContent>

              <TabsContent value="convert_hold" className="mt-4 space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  Deposit USD and automatically convert to a stablecoin. Hold the stablecoin in your account.
                </div>
                <div className="space-y-2">
                  <Label>Convert to Stablecoin</Label>
                  <Select value={destinationAsset} onValueChange={setDestinationAsset}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STABLECOINS.map(coin => (
                        <SelectItem key={coin} value={coin}>
                          <div className="flex items-center gap-2">
                            <AssetIcon asset={coin} size="sm" />
                            {coin}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="convert_send" className="mt-4 space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  Deposit USD, automatically convert to a stablecoin, and send to an external wallet.
                </div>
                <div className="space-y-2">
                  <Label>Convert to Stablecoin</Label>
                  <Select value={destinationAsset} onValueChange={setDestinationAsset}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STABLECOINS.map(coin => (
                        <SelectItem key={coin} value={coin}>
                          <div className="flex items-center gap-2">
                            <AssetIcon asset={coin} size="sm" />
                            {coin}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Destination Wallet</Label>
                  <Select 
                    value={destinationAddressId} 
                    onValueChange={setDestinationAddressId}
                    disabled={loadingDestinations}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder={loadingDestinations ? 'Loading...' : 'Select destination wallet'} />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.length > 0 ? (
                        destinations.map((dest: CryptoDestinationAddress) => (
                          <SelectItem key={dest.id} value={dest.paxos_crypto_destination_id || dest.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{dest.nickname || 'Unnamed'}</span>
                              <span className="text-muted-foreground text-xs">
                                {dest.address?.slice(0, 10)}...
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          No destination wallets registered
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {destinations.length === 0 && !loadingDestinations && (
                    <p className="text-xs text-muted-foreground">
                      Register a destination wallet first from the Destinations tab.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Network & Account Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transfer Method</Label>
              <Select value={network} onValueChange={(v) => setNetwork(v as FiatNetwork)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WIRE">Wire Transfer</SelectItem>
                  <SelectItem value="ACH">ACH Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">Checking</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">USD</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">
                {scenario === 'hold_usd' ? 'USD' : destinationAsset}
              </span>
              {scenario === 'convert_send' && (
                <>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">External Wallet</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {scenario === 'hold_usd' && 'Deposit will be held as USD in your account'}
              {scenario === 'convert_hold' && `Deposit will be auto-converted to ${destinationAsset} and held`}
              {scenario === 'convert_send' && `Deposit will be auto-converted to ${destinationAsset} and sent to external wallet`}
            </p>
          </div>

          <Button 
            onClick={handleCreateInstructions}
            disabled={createInstructions.isPending || (scenario === 'convert_send' && !destinationAddressId)}
            className="w-full"
          >
            {createInstructions.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Deposit Instructions'
            )}
          </Button>
        </>
      )}

      {step === 'instructions' && instructions && (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
              <Check className="h-6 w-6 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">Deposit Instructions Ready</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use these details to send a {network} transfer
            </p>
          </div>

          {/* Wire Details */}
          {instructions.fiat_network_details?.wire && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Important: Include Memo ID</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You must include the memo ID in your wire transfer reference for the deposit to be credited.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Memo ID / Reference</p>
                    <p className="font-mono font-bold text-lg text-primary">
                      {instructions.memo_id || instructions.deposit_instructions_id?.slice(0, 12)}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(instructions.memo_id || instructions.deposit_instructions_id)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bank Name</span>
                  <span className="font-medium text-foreground">{instructions.fiat_network_details.wire.bank_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground">{instructions.fiat_network_details.wire.account_number}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopy(instructions.fiat_network_details!.wire!.account_number)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Routing Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground">{instructions.fiat_network_details.wire.routing_number}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopy(instructions.fiat_network_details!.wire!.routing_number)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {instructions.fiat_network_details.wire.beneficiary_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Beneficiary</span>
                    <span className="font-medium text-foreground">{instructions.fiat_network_details.wire.beneficiary_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setStep('create')}
              className="flex-1"
            >
              Create Another
            </Button>
            <Button 
              onClick={() => setStep('sandbox')}
              className="flex-1 bg-success hover:bg-success/90"
            >
              Test with Sandbox
            </Button>
          </div>
        </div>
      )}

      {step === 'sandbox' && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-6 w-6 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground">Sandbox Deposit</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Simulate a wire transfer for testing
            </p>
          </div>

          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-sm">
            <p className="text-warning font-medium">⚠️ Sandbox Mode</p>
            <p className="text-muted-foreground mt-1">
              This simulates a bank transfer. No real money is moved.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Amount to Deposit</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="text"
                placeholder="1000.00"
                value={sandboxAmount}
                onChange={(e) => setSandboxAmount(e.target.value)}
                className="pl-8 bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setStep('instructions')}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              onClick={handleSandboxDeposit}
              disabled={sandboxDeposit.isPending || !sandboxAmount}
              className="flex-1 bg-success hover:bg-success/90"
            >
              {sandboxDeposit.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Simulate Deposit'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiatDepositFlow;