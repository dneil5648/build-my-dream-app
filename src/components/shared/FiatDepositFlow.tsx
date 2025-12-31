import React, { useState } from 'react';
import { Loader2, Copy, Check, Info, ArrowRight, DollarSign, Coins, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { useCreateDepositInstructions, useSandboxDeposit, useDepositInstructions } from '@/hooks/useFiat';
import { useCryptoDestinationAddresses } from '@/hooks/useCrypto';
import { 
  CreateFiatDepositInstructionsRequest, 
  FiatNetwork, 
  AccountType,
  RoutingNumberType,
  CryptoDestinationAddress,
  FiatDepositInstructions
} from '@/api/types';

// Stablecoins for conversion
const STABLECOINS = ['USDC', 'USDT', 'USDP', 'PYUSD', 'USDG', 'DAI'];

type FlowStep = 'create' | 'instructions' | 'fund';

interface FiatDepositFlowProps {
  accountId: string;
  paxosAccountId: string;
  onSuccess?: () => void;
  initialStep?: FlowStep;
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
  onSuccess,
  initialStep = 'create'
}) => {
  const [step, setStep] = useState<FlowStep>(initialStep);
  const [scenario, setScenario] = useState<DepositScenario>('hold_usd');
  const [network, setNetwork] = useState<FiatNetwork>('WIRE');
  const [accountType, setAccountType] = useState<AccountType>('CHECKING');
  const [routingNumberType, setRoutingNumberType] = useState<RoutingNumberType>('ABA');
  const [destinationAsset, setDestinationAsset] = useState('USDC');
  const [destinationAddressId, setDestinationAddressId] = useState('');
  const [instructions, setInstructions] = useState<DepositInstructionResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Fund account state
  const [selectedInstructionId, setSelectedInstructionId] = useState('');
  const [sandboxAmount, setSandboxAmount] = useState('1000.00');
  const [senderAccountNumber, setSenderAccountNumber] = useState('');
  const [senderAddress, setSenderAddress] = useState({
    country: 'US',
    address1: '',
    address2: '',
    city: '',
    province: '',
    zip_code: ''
  });
  const [routingDetails, setRoutingDetails] = useState({
    routing_number_type: 'ABA' as 'ABA' | 'SWIFT' | 'IBAN',
    routing_number: '',
    bank_name: '',
    bank_address: {
      country: 'US',
      address1: '',
      city: '',
      province: '',
      zip_code: ''
    }
  });

  // Determine if routing_number_type is required based on network
  const requiresRoutingNumberType = network === 'WIRE' || network === 'FEDWIRE';

  const createInstructions = useCreateDepositInstructions();
  const sandboxDeposit = useSandboxDeposit();
  
  // Fetch existing deposit instructions for this account
  const { data: existingInstructionsResponse, isLoading: loadingInstructions } = useDepositInstructions();
  const existingInstructions = (existingInstructionsResponse?.data || []).filter(
    (inst: FiatDepositInstructions) => inst.account_id === accountId && inst.status === 'active'
  );

  const { data: destinationsResponse, isLoading: loadingDestinations } = useCryptoDestinationAddresses(
    { account_id: accountId }
  );
  const destinations = destinationsResponse?.data || [];
  
  // Get selected instruction details (using local database id)
  const selectedInstruction = existingInstructions.find(
    (inst: FiatDepositInstructions) => inst.id === selectedInstructionId
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleCreateInstructions = async () => {
    const payload: CreateFiatDepositInstructionsRequest = {
      account_id: accountId,
      source_asset: 'USD',
      destination_asset: scenario === 'hold_usd' ? 'USD' : destinationAsset,
      fiat_network: network,
      fiat_account_type: accountType,
    };

    // Add routing_number_type for WIRE/FEDWIRE networks (required)
    if (requiresRoutingNumberType) {
      payload.routing_number_type = routingNumberType;
    }

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

  // Validate fund account form
  const isFundFormValid = () => {
    return (
      selectedInstructionId &&
      sandboxAmount &&
      senderAccountNumber &&
      senderAddress.address1 &&
      senderAddress.city &&
      senderAddress.province &&
      senderAddress.zip_code &&
      routingDetails.routing_number &&
      routingDetails.bank_name &&
      routingDetails.bank_address.address1 &&
      routingDetails.bank_address.city &&
      routingDetails.bank_address.province &&
      routingDetails.bank_address.zip_code
    );
  };

  const handleFundAccount = async () => {
    if (!selectedInstructionId) {
      toast.error('Please select a deposit instruction');
      return;
    }

    if (!isFundFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await sandboxDeposit.mutateAsync({
        deposit_instruction_id: selectedInstructionId,
        amount: sandboxAmount,
        asset: 'USD',
        account_number: senderAccountNumber,
        account_owner_address: {
          country: senderAddress.country,
          address1: senderAddress.address1,
          address2: senderAddress.address2 || undefined,
          city: senderAddress.city,
          province: senderAddress.province,
          zip_code: senderAddress.zip_code
        },
        routing_details: {
          routing_number_type: routingDetails.routing_number_type,
          routing_number: routingDetails.routing_number,
          bank_name: routingDetails.bank_name,
          bank_address: {
            country: routingDetails.bank_address.country,
            address1: routingDetails.bank_address.address1,
            city: routingDetails.bank_address.city,
            province: routingDetails.bank_address.province,
            zip_code: routingDetails.bank_address.zip_code
          }
        }
      });
      toast.success('Sandbox deposit completed! Check your balance.');
      onSuccess?.();
      // Reset state
      setStep('create');
      setSelectedInstructionId('');
      setSandboxAmount('1000.00');
      setSenderAccountNumber('');
      setSenderAddress({ country: 'US', address1: '', address2: '', city: '', province: '', zip_code: '' });
      setRoutingDetails({
        routing_number_type: 'ABA',
        routing_number: '',
        bank_name: '',
        bank_address: { country: 'US', address1: '', city: '', province: '', zip_code: '' }
      });
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
                  <SelectItem value="WIRE">Wire Transfer (Domestic)</SelectItem>
                  <SelectItem value="ACH">ACH Transfer</SelectItem>
                  <SelectItem value="FEDWIRE">Fedwire (Real-time)</SelectItem>
                  <SelectItem value="SEPA">SEPA (Europe)</SelectItem>
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

          {/* Routing Number Type - Required for WIRE/FEDWIRE */}
          {requiresRoutingNumberType && (
            <div className="space-y-2">
              <Label>Routing Number Type</Label>
              <Select value={routingNumberType} onValueChange={(v) => setRoutingNumberType(v as RoutingNumberType)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABA">ABA (US Domestic)</SelectItem>
                  <SelectItem value="SWIFT">SWIFT (International)</SelectItem>
                  <SelectItem value="IBAN">IBAN (International)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {routingNumberType === 'ABA' && 'Use for US domestic wire transfers (9-digit routing number)'}
                {routingNumberType === 'SWIFT' && 'Use for international wire transfers (BIC/SWIFT code)'}
                {routingNumberType === 'IBAN' && 'Use for IBAN-based international transfers'}
              </p>
            </div>
          )}

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
              onClick={() => setStep('fund')}
              className="flex-1 bg-success hover:bg-success/90"
            >
              Fund Account
            </Button>
          </div>
        </div>
      )}

      {step === 'fund' && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-6 w-6 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground">Fund Account (Sandbox)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select deposit instructions and simulate a deposit
            </p>
          </div>

          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-sm">
            <p className="text-warning font-medium">Sandbox Mode</p>
            <p className="text-muted-foreground mt-1">
              This simulates a bank transfer. No real money is moved.
            </p>
          </div>

          {/* Select Deposit Instructions */}
          <div className="space-y-2">
            <Label>Select Deposit Instructions</Label>
            {loadingInstructions ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading instructions...
              </div>
            ) : existingInstructions.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">No deposit instructions found.</p>
                <Button 
                  variant="link" 
                  onClick={() => setStep('create')}
                  className="text-primary mt-1"
                >
                  Create deposit instructions first
                </Button>
              </div>
            ) : (
              <Select value={selectedInstructionId} onValueChange={setSelectedInstructionId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select deposit instruction" />
                </SelectTrigger>
                <SelectContent>
                  {existingInstructions.map((inst: FiatDepositInstructions) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{inst.network} - {inst.instruction_type}</span>
                        <span className="text-xs text-muted-foreground">
                          {inst.id?.slice(0, 16)}...
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Instruction Details */}
          {selectedInstruction && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium text-foreground">{selectedInstruction.network}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground">{selectedInstruction.instruction_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-success">{selectedInstruction.status}</span>
              </div>
            </div>
          )}

          {/* Amount & Account Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount to Deposit *</Label>
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
            <div className="space-y-2">
              <Label>Your Bank Account # *</Label>
              <Input
                type="text"
                placeholder="123456789"
                value={senderAccountNumber}
                onChange={(e) => setSenderAccountNumber(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Sender Address Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Your Address</Label>
            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="space-y-2">
                <Label className="text-sm">Street Address *</Label>
                <Input
                  placeholder="123 Main Street"
                  value={senderAddress.address1}
                  onChange={(e) => setSenderAddress({ ...senderAddress, address1: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Apt/Suite (Optional)</Label>
                <Input
                  placeholder="Apt 4B"
                  value={senderAddress.address2}
                  onChange={(e) => setSenderAddress({ ...senderAddress, address2: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">City *</Label>
                  <Input
                    placeholder="New York"
                    value={senderAddress.city}
                    onChange={(e) => setSenderAddress({ ...senderAddress, city: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">State *</Label>
                  <Input
                    placeholder="NY"
                    value={senderAddress.province}
                    onChange={(e) => setSenderAddress({ ...senderAddress, province: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">ZIP *</Label>
                  <Input
                    placeholder="10001"
                    value={senderAddress.zip_code}
                    onChange={(e) => setSenderAddress({ ...senderAddress, zip_code: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Routing Details Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Bank Routing Details</Label>
            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Routing Type *</Label>
                  <Select 
                    value={routingDetails.routing_number_type} 
                    onValueChange={(v) => setRoutingDetails({ ...routingDetails, routing_number_type: v as 'ABA' | 'SWIFT' | 'IBAN' })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ABA">ABA (US)</SelectItem>
                      <SelectItem value="SWIFT">SWIFT</SelectItem>
                      <SelectItem value="IBAN">IBAN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Routing Number *</Label>
                  <Input
                    placeholder="021000021"
                    value={routingDetails.routing_number}
                    onChange={(e) => setRoutingDetails({ ...routingDetails, routing_number: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Bank Name *</Label>
                <Input
                  placeholder="Chase Bank"
                  value={routingDetails.bank_name}
                  onChange={(e) => setRoutingDetails({ ...routingDetails, bank_name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Bank Address */}
              <div className="pt-2 border-t border-border/50">
                <Label className="text-sm text-muted-foreground mb-2 block">Bank Address</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Street Address *</Label>
                    <Input
                      placeholder="270 Park Avenue"
                      value={routingDetails.bank_address.address1}
                      onChange={(e) => setRoutingDetails({ 
                        ...routingDetails, 
                        bank_address: { ...routingDetails.bank_address, address1: e.target.value }
                      })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">City *</Label>
                      <Input
                        placeholder="New York"
                        value={routingDetails.bank_address.city}
                        onChange={(e) => setRoutingDetails({ 
                          ...routingDetails, 
                          bank_address: { ...routingDetails.bank_address, city: e.target.value }
                        })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">State *</Label>
                      <Input
                        placeholder="NY"
                        value={routingDetails.bank_address.province}
                        onChange={(e) => setRoutingDetails({ 
                          ...routingDetails, 
                          bank_address: { ...routingDetails.bank_address, province: e.target.value }
                        })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">ZIP *</Label>
                      <Input
                        placeholder="10017"
                        value={routingDetails.bank_address.zip_code}
                        onChange={(e) => setRoutingDetails({ 
                          ...routingDetails, 
                          bank_address: { ...routingDetails.bank_address, zip_code: e.target.value }
                        })}
                        className="bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setStep('create')}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              onClick={handleFundAccount}
              disabled={sandboxDeposit.isPending || !isFundFormValid()}
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