import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, RefreshCw, Server, Plus, Wallet, Trash2, Palette, Building2, ArrowDownToLine, ArrowUpFromLine, UserCheck, User, Upload, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getApiConfig, saveApiConfig, ApiConfig } from '@/api';
import { useAccounts, useCreateAccount } from '@/hooks/useAccounts';
import { useIdentities, useCreateIdentity } from '@/hooks/useIdentities';
import { AccountsTable } from '@/components/shared/AccountsTable';
import { IdentitiesTable } from '@/components/shared/IdentitiesTable';
import { CreateIdentityForm } from '@/components/shared/CreateIdentityForm';
import { CreateAccountForm } from '@/components/shared/CreateAccountForm';
import { CreateIdentityRequest, CreateAccountRequest } from '@/api/types';

// Available assets based on API spec and supported icons
const AVAILABLE_ASSETS = [
  // Major Cryptocurrencies
  { id: 'BTC', name: 'Bitcoin' },
  { id: 'ETH', name: 'Ethereum' },
  { id: 'SOL', name: 'Solana' },
  { id: 'LTC', name: 'Litecoin' },
  { id: 'BCH', name: 'Bitcoin Cash' },
  { id: 'XLM', name: 'Stellar' },
  { id: 'LINK', name: 'Chainlink' },
  { id: 'UNI', name: 'Uniswap' },
  { id: 'MATIC', name: 'Polygon' },
  { id: 'ARB', name: 'Arbitrum' },
  // Stablecoins
  { id: 'USDC', name: 'USD Coin' },
  { id: 'USDT', name: 'Tether' },
  { id: 'USDP', name: 'Pax Dollar' },
  { id: 'PYUSD', name: 'PayPal USD' },
  { id: 'USDG', name: 'Global Dollar' },
  { id: 'DAI', name: 'Dai' },
  { id: 'BUSD', name: 'Binance USD' },
  { id: 'USDL', name: 'USDL' },
  { id: 'PAX', name: 'Paxos Standard' },
  // Gold & Commodities
  { id: 'PAXG', name: 'PAX Gold' },
  // Exchange Tokens
  { id: 'BNB', name: 'BNB' },
  { id: 'CRO', name: 'Cronos' },
  { id: 'OKB', name: 'OKB' },
  { id: 'KCS', name: 'KuCoin Token' },
  { id: 'GT', name: 'Gate Token' },
  { id: 'LEO', name: 'LEO Token' },
  { id: 'BGB', name: 'Bitget Token' },
  { id: 'NEXO', name: 'Nexo' },
  // DeFi & Gaming
  { id: 'AAVE', name: 'Aave' },
  { id: 'COMP', name: 'Compound' },
  { id: 'CRV', name: 'Curve' },
  { id: 'SUSHI', name: 'SushiSwap' },
  { id: 'YFI', name: 'yearn.finance' },
  { id: 'GRT', name: 'The Graph' },
  { id: 'AXS', name: 'Axie Infinity' },
  { id: 'MANA', name: 'Decentraland' },
  { id: 'SAND', name: 'The Sandbox' },
  { id: 'GALA', name: 'Gala' },
  { id: 'CHZ', name: 'Chiliz' },
  { id: 'ENJ', name: 'Enjin Coin' },
  { id: 'BAT', name: 'Basic Attention Token' },
  { id: 'LRC', name: 'Loopring' },
  // Layer 2 & Infrastructure
  { id: 'BASE', name: 'Base' },
  { id: 'INJ', name: 'Injective' },
  { id: 'QNT', name: 'Quant' },
  { id: 'RENDER', name: 'Render' },
  { id: 'FET', name: 'Fetch.ai' },
  { id: 'ONDO', name: 'Ondo' },
  { id: 'JUP', name: 'Jupiter' },
  { id: 'WLD', name: 'Worldcoin' },
  { id: 'MNT', name: 'Mantle' },
  { id: 'EGLD', name: 'MultiversX' },
  { id: 'HNT', name: 'Helium' },
  { id: 'IOTX', name: 'IoTeX' },
  { id: 'SKY', name: 'Sky' },
  { id: 'FTN', name: 'Fasttoken' },
  { id: 'ENA', name: 'Ethena' },
  { id: 'INK', name: 'Ink' },
  // Meme Coins
  { id: 'SHIB', name: 'Shiba Inu' },
  { id: 'PEPE', name: 'Pepe' },
  { id: 'BONK', name: 'Bonk' },
  { id: 'WIF', name: 'dogwifhat' },
  { id: 'FARTCOIN', name: 'Fartcoin' },
  { id: 'PENGU', name: 'Pudgy Penguins' },
  { id: 'TRUMP', name: 'Trump' },
  { id: 'SPX', name: 'SPX6900' },
  { id: 'VIRTUAL', name: 'Virtual Protocol' },
  { id: 'PUMP', name: 'Pump' },
  { id: 'APE', name: 'ApeCoin' },
  // Wrapped Assets
  { id: 'WBTC', name: 'Wrapped Bitcoin' },
  // Fiat
  { id: 'USD', name: 'US Dollar' },
  { id: 'EURO', name: 'Euro' },
  { id: 'BRL', name: 'Brazilian Real' },
  { id: 'SGD', name: 'Singapore Dollar' },
  { id: 'BMD', name: 'Bermudian Dollar' },
  // Other
  { id: 'AMP', name: 'Amp' },
  { id: 'HUSD', name: 'HUSD' },
];

export interface AssetMapping {
  assetId: string;
  customName: string;
  iconColor?: string;
  customIcon?: string; // Base64 encoded custom icon
}

export interface WhiteLabelConfig {
  walletName: string;
  assetMappings: AssetMapping[];
}

export interface ModuleIdentityConfig {
  payinsIdentityId: string | null; // null = force new, or identity_id
  payoutsIdentityId: string | null;
  cryptoWalletIdentityId: string | null; // For Crypto Wallet module
  whiteLabelIdentityId: string | null; // For White Label Wallet module
  // Per-module require new registration flags
  payinsRequireNew: boolean;
  payoutsRequireNew: boolean;
  cryptoWalletRequireNew: boolean;
  whiteLabelRequireNew: boolean;
  requireOnboarding: boolean; // DEPRECATED - kept for backwards compat
  idvVendor: string | null; // IDV vendor selection
}

// Available IDV Vendors
export const IDV_VENDORS = [
  'JUMIO',
  'ALLOY',
  'LEXISNEXIS',
  'MITEK',
  'SUMSUB',
  'MICROBILT',
  'ONFIDO',
  'CUSTOMER',
  'EQUIFAX',
  'ID3_AUTHENTICATE',
  'FIS',
  'PROVE',
  'PERSONA',
  'PLAID',
  'DOTFILE',
  'AIPRISE',
] as const;

export type IdvVendor = typeof IDV_VENDORS[number];

export const getWhiteLabelConfig = (): WhiteLabelConfig | null => {
  const saved = localStorage.getItem('whiteLabelConfig');
  return saved ? JSON.parse(saved) : null;
};

export const saveWhiteLabelConfig = (config: WhiteLabelConfig): void => {
  localStorage.setItem('whiteLabelConfig', JSON.stringify(config));
};

export const getModuleIdentityConfig = (): ModuleIdentityConfig => {
  const saved = localStorage.getItem('moduleIdentityConfig');
  const defaults: ModuleIdentityConfig = { 
    payinsIdentityId: null, 
    payoutsIdentityId: null, 
    cryptoWalletIdentityId: null, 
    whiteLabelIdentityId: null, 
    payinsRequireNew: false,
    payoutsRequireNew: false,
    cryptoWalletRequireNew: false,
    whiteLabelRequireNew: false,
    requireOnboarding: false, 
    idvVendor: null 
  };
  return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
};

export const saveModuleIdentityConfig = (config: ModuleIdentityConfig): void => {
  localStorage.setItem('moduleIdentityConfig', JSON.stringify(config));
};

const ConfigPage: React.FC = () => {
  const [config, setConfig] = useState<ApiConfig>({
    baseUrl: 'http://localhost:8080',
    clientId: '',
    clientSecret: '',
    customerId: '',
    scope: 'funding:read_write custody:read_write',
    environment: 'sandbox',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  // White Label config state
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>({
    walletName: 'My Wallet',
    assetMappings: [],
  });
  const [newAssetId, setNewAssetId] = useState('');
  const [newCustomName, setNewCustomName] = useState('');
  const [newIconColor, setNewIconColor] = useState('#6366f1');
  const [newCustomIcon, setNewCustomIcon] = useState<string | null>(null);

  // Module Identity config state
  const [moduleIdentityConfig, setModuleIdentityConfig] = useState<ModuleIdentityConfig>({
    payinsIdentityId: null,
    payoutsIdentityId: null,
    cryptoWalletIdentityId: null,
    whiteLabelIdentityId: null,
    payinsRequireNew: false,
    payoutsRequireNew: false,
    cryptoWalletRequireNew: false,
    whiteLabelRequireNew: false,
    requireOnboarding: false,
    idvVendor: null,
  });

  // API hooks
  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities();
  // Fetch module-specific identities
  const { data: payinsIdentitiesResponse } = useIdentities({ module: 'PAY_INS' });
  const { data: payoutsIdentitiesResponse } = useIdentities({ module: 'PAY_OUTS' });
  const { data: cryptoWalletIdentitiesResponse } = useIdentities({ module: 'CRYPTO_WALLET' });
  const { data: whiteLabelIdentitiesResponse } = useIdentities({ module: 'WHITE_LABEL' });
  const createIdentityMutation = useCreateIdentity();
  const createAccountMutation = useCreateAccount();

  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];
  const institutionIdentities = identities.filter(i => i.identity_type?.toUpperCase() === 'INSTITUTION');
  const personIdentities = identities.filter(i => i.identity_type?.toUpperCase() === 'INDIVIDUAL');
  const allValidIdentities = identities.filter(i => i.identity_id && i.identity_id.trim() !== '');
  
  // Module-specific identities
  const payinsIdentities = (payinsIdentitiesResponse?.data || []).filter(i => i.identity_id && i.identity_id.trim() !== '');
  const payoutsIdentities = (payoutsIdentitiesResponse?.data || []).filter(i => i.identity_id && i.identity_id.trim() !== '');
  const cryptoWalletIdentities = (cryptoWalletIdentitiesResponse?.data || []).filter(i => i.identity_id && i.identity_id.trim() !== '');
  const whiteLabelIdentities = (whiteLabelIdentitiesResponse?.data || []).filter(i => i.identity_id && i.identity_id.trim() !== '');
  
  // Filter by institution type for Pay-ins/Pay-outs
  const payinsInstitutionIdentities = payinsIdentities.filter(i => i.identity_type?.toUpperCase() === 'INSTITUTION');
  const payoutsInstitutionIdentities = payoutsIdentities.filter(i => i.identity_type?.toUpperCase() === 'INSTITUTION');

  // Load saved configs on mount
  useEffect(() => {
    const savedConfig = getApiConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      setIsConnected(true);
    }
    const savedWhiteLabel = getWhiteLabelConfig();
    if (savedWhiteLabel) {
      setWhiteLabelConfig(savedWhiteLabel);
    }
    const savedModuleIdentity = getModuleIdentityConfig();
    if (savedModuleIdentity) {
      setModuleIdentityConfig(savedModuleIdentity);
    }
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch(`${config.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setIsConnected(true);
        toast.success('Connection successful!');
      } else {
        setIsConnected(false);
        toast.error('Connection failed. Please check your settings.');
      }
    } catch (error) {
      try {
        await fetch(`${config.baseUrl}`, { method: 'HEAD', mode: 'no-cors' });
        setIsConnected(true);
        toast.success('Server is reachable. Save configuration to proceed.');
      } catch {
        setIsConnected(false);
        toast.error('Unable to reach server. Please check the Base URL.');
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      saveApiConfig(config);
      setIsConnected(true);
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateIdentity = async (data: CreateIdentityRequest) => {
    try {
      await createIdentityMutation.mutateAsync(data);
      setIdentityDialogOpen(false);
      toast.success('Identity created successfully');
    } catch (error) {
      toast.error('Failed to create identity');
    }
  };

  const handleCreateAccount = async (data: CreateAccountRequest) => {
    try {
      await createAccountMutation.mutateAsync(data);
      setAccountDialogOpen(false);
      toast.success('Account created successfully');
    } catch (error) {
      toast.error('Failed to create account');
    }
  };

  // White Label handlers
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 100 * 1024) { // 100KB limit for icons
      toast.error('Icon must be less than 100KB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewCustomIcon(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddAssetMapping = () => {
    if (!newAssetId || !newCustomName.trim()) {
      toast.error('Please select an asset and provide a custom name');
      return;
    }
    if (whiteLabelConfig.assetMappings.some(m => m.assetId === newAssetId)) {
      toast.error('This asset is already mapped');
      return;
    }
    setWhiteLabelConfig(prev => ({
      ...prev,
      assetMappings: [...prev.assetMappings, { 
        assetId: newAssetId, 
        customName: newCustomName.trim(),
        iconColor: newIconColor,
        customIcon: newCustomIcon || undefined
      }]
    }));
    setNewAssetId('');
    setNewCustomName('');
    setNewIconColor('#6366f1');
    setNewCustomIcon(null);
  };

  const handleRemoveAssetMapping = (assetId: string) => {
    setWhiteLabelConfig(prev => ({
      ...prev,
      assetMappings: prev.assetMappings.filter(m => m.assetId !== assetId)
    }));
  };

  const handleSaveWhiteLabelConfig = () => {
    saveWhiteLabelConfig(whiteLabelConfig);
    toast.success('White Label configuration saved');
  };

  const handleSaveModuleIdentityConfig = () => {
    saveModuleIdentityConfig(moduleIdentityConfig);
    toast.success('Module settings saved');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Configuration</h2>
        <p className="text-muted-foreground">Manage API settings, identities, accounts, and module settings.</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="api">API Settings</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="identities">Identities ({identities.length})</TabsTrigger>
          <TabsTrigger value="accounts">Accounts ({accounts.length})</TabsTrigger>
          <TabsTrigger value="whitelabel">White Label</TabsTrigger>
        </TabsList>

        {/* API Settings Tab */}
        <TabsContent value="api" className="space-y-6">
          {/* Connection Status */}
          <div className="glass rounded-xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-success/20' : 'bg-muted'}`}>
                {isConnected ? (
                  <CheckCircle className="h-6 w-6 text-success" />
                ) : (
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {isConnected ? 'Connected to API' : 'Not Connected'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Your API configuration is saved' : 'Configure your credentials below'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testing || !config.baseUrl}
              className="border-border"
            >
              {testing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>

          {/* Server Configuration */}
          <div className="glass rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Server Configuration</h3>
                <p className="text-sm text-muted-foreground">Configure the API server endpoint</p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    placeholder="http://localhost:8080"
                    value={config.baseUrl}
                    onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select 
                    value={config.environment} 
                    onValueChange={(value: 'sandbox' | 'production') => setConfig({ ...config, environment: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* API Credentials */}
          <div className="glass rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">API Credentials</h3>
                <p className="text-sm text-muted-foreground">Enter your Paxos API credentials</p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="Enter client ID"
                    value={config.clientId}
                    onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    placeholder="Enter client secret"
                    value={config.clientSecret}
                    onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer ID</Label>
                  <Input
                    id="customerId"
                    placeholder="Enter customer ID"
                    value={config.customerId}
                    onChange={(e) => setConfig({ ...config, customerId: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scope">API Scope</Label>
                  <Input
                    id="scope"
                    placeholder="API scopes (space-separated)"
                    value={config.scope}
                    onChange={(e) => setConfig({ ...config, scope: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>

          {/* Environment Indicator */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Current Environment</h3>
                <p className="text-sm text-muted-foreground">Your application is running in:</p>
              </div>
              <div className={`px-4 py-2 rounded-full ${config.environment === 'sandbox' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                <span className="font-medium capitalize">{config.environment}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          {/* Pay-ins Settings */}
          <div className="glass rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-module-payins/10 flex items-center justify-center">
                <ArrowDownToLine className="h-5 w-5 text-module-payins" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pay-ins Module</h3>
                <p className="text-sm text-muted-foreground">Configure identity settings for fiat deposits</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Require New Registration Toggle */}
              <label className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:border-module-payins/50 transition-colors">
                <input
                  type="checkbox"
                  checked={moduleIdentityConfig.payinsRequireNew}
                  onChange={(e) => setModuleIdentityConfig(prev => ({ 
                    ...prev, 
                    payinsRequireNew: e.target.checked,
                    payinsIdentityId: e.target.checked ? null : prev.payinsIdentityId
                  }))}
                  className="w-4 h-4 rounded border-border accent-module-payins"
                />
                <div>
                  <p className="font-medium text-foreground">Require new registration</p>
                  <p className="text-sm text-muted-foreground">Force users to create a new identity for this module</p>
                </div>
              </label>

              {/* Identity Selection - only show if not requiring new */}
              {!moduleIdentityConfig.payinsRequireNew && (
                <div className="space-y-2">
                  <Label>Use Existing Identity (from Pay-ins module)</Label>
                  <Select 
                    value={moduleIdentityConfig.payinsIdentityId || 'none'} 
                    onValueChange={(value) => setModuleIdentityConfig(prev => ({ 
                      ...prev, 
                      payinsIdentityId: value === 'none' ? null : value 
                    }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select identity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No identity selected (show onboarding)</span>
                      </SelectItem>
                      {payinsInstitutionIdentities.length > 0 ? (
                        payinsInstitutionIdentities.map((identity) => (
                          <SelectItem key={identity.identity_id} value={identity.identity_id}>
                            <span className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {identity.name}
                            </span>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                          No identities in Pay-ins module yet
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {moduleIdentityConfig.payinsIdentityId 
                      ? 'Users will use this identity by default' 
                      : 'Users must complete business registration to use Pay-ins'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pay-outs Settings */}
          <div className="glass rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-module-payouts/10 flex items-center justify-center">
                <ArrowUpFromLine className="h-5 w-5 text-module-payouts" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pay-outs Module</h3>
                <p className="text-sm text-muted-foreground">Configure identity settings for stablecoin payouts</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Require New Registration Toggle */}
              <label className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:border-module-payouts/50 transition-colors">
                <input
                  type="checkbox"
                  checked={moduleIdentityConfig.payoutsRequireNew}
                  onChange={(e) => setModuleIdentityConfig(prev => ({ 
                    ...prev, 
                    payoutsRequireNew: e.target.checked,
                    payoutsIdentityId: e.target.checked ? null : prev.payoutsIdentityId
                  }))}
                  className="w-4 h-4 rounded border-border accent-module-payouts"
                />
                <div>
                  <p className="font-medium text-foreground">Require new registration</p>
                  <p className="text-sm text-muted-foreground">Force users to create a new identity for this module</p>
                </div>
              </label>

              {/* Identity Selection - only show if not requiring new */}
              {!moduleIdentityConfig.payoutsRequireNew && (
                <div className="space-y-2">
                  <Label>Use Existing Identity (from Pay-outs module)</Label>
                  <Select 
                    value={moduleIdentityConfig.payoutsIdentityId || 'none'} 
                    onValueChange={(value) => setModuleIdentityConfig(prev => ({ 
                      ...prev, 
                      payoutsIdentityId: value === 'none' ? null : value 
                    }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select identity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No identity selected (show onboarding)</span>
                      </SelectItem>
                      {payoutsInstitutionIdentities.length > 0 ? (
                        payoutsInstitutionIdentities.map((identity) => (
                          <SelectItem key={identity.identity_id} value={identity.identity_id}>
                            <span className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {identity.name}
                            </span>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                          No identities in Pay-outs module yet
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {moduleIdentityConfig.payoutsIdentityId 
                      ? 'Users will use this identity by default' 
                      : 'Users must complete business registration to use Pay-outs'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* IDV Vendor Settings */}
          <div className="glass rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Identity Verification (IDV)</h3>
                <p className="text-sm text-muted-foreground">Select the vendor for identity verification</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>IDV Vendor</Label>
                <Select 
                  value={moduleIdentityConfig.idvVendor || 'none'} 
                  onValueChange={(value) => setModuleIdentityConfig(prev => ({ 
                    ...prev, 
                    idvVendor: value === 'none' ? null : value 
                  }))}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select IDV vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">No vendor selected</span>
                    </SelectItem>
                    {IDV_VENDORS.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>
                        {vendor.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {moduleIdentityConfig.idvVendor 
                    ? `Using ${moduleIdentityConfig.idvVendor.replace(/_/g, ' ')} for identity verification` 
                    : 'Select a vendor to enable identity verification'}
                </p>
              </div>
            </div>
          </div>

          {/* Crypto Wallet Settings */}
          <div className="glass rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-module-crypto/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-module-crypto" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Crypto Wallet Module</h3>
                <p className="text-sm text-muted-foreground">Configure identity settings for crypto wallet users</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Require New Registration Toggle */}
              <label className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:border-module-crypto/50 transition-colors">
                <input
                  type="checkbox"
                  checked={moduleIdentityConfig.cryptoWalletRequireNew}
                  onChange={(e) => setModuleIdentityConfig(prev => ({ 
                    ...prev, 
                    cryptoWalletRequireNew: e.target.checked,
                    cryptoWalletIdentityId: e.target.checked ? null : prev.cryptoWalletIdentityId
                  }))}
                  className="w-4 h-4 rounded border-border accent-module-crypto"
                />
                <div>
                  <p className="font-medium text-foreground">Require new registration</p>
                  <p className="text-sm text-muted-foreground">Force users to create a new identity for this module</p>
                </div>
              </label>

              {/* Identity Selection - only show if not requiring new */}
              {!moduleIdentityConfig.cryptoWalletRequireNew && (
                <div className="space-y-2">
                  <Label>Use Existing Identity (from Crypto Wallet module)</Label>
                  <Select 
                    value={moduleIdentityConfig.cryptoWalletIdentityId || 'none'} 
                    onValueChange={(value) => setModuleIdentityConfig(prev => ({ 
                      ...prev, 
                      cryptoWalletIdentityId: value === 'none' ? null : value 
                    }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select identity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No identity selected (show onboarding)</span>
                      </SelectItem>
                      {cryptoWalletIdentities.length > 0 ? (
                        cryptoWalletIdentities.map((identity) => (
                          <SelectItem key={identity.identity_id} value={identity.identity_id}>
                            <span className="flex items-center gap-2">
                              {identity.identity_type?.toUpperCase() === 'INSTITUTION' ? (
                                <Building2 className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                              {identity.name}
                            </span>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                          No identities in Crypto Wallet module yet
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {moduleIdentityConfig.cryptoWalletIdentityId 
                      ? 'Users will use this identity by default' 
                      : 'Users must complete registration to use Crypto Wallet'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* White Label Wallet Settings */}
          <div className="glass rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-module-whitelabel/10 flex items-center justify-center">
                <Palette className="h-5 w-5 text-module-whitelabel" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">White Label Wallet Module</h3>
                <p className="text-sm text-muted-foreground">Configure identity settings for white label wallet users</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Require New Registration Toggle */}
              <label className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:border-module-whitelabel/50 transition-colors">
                <input
                  type="checkbox"
                  checked={moduleIdentityConfig.whiteLabelRequireNew}
                  onChange={(e) => setModuleIdentityConfig(prev => ({ 
                    ...prev, 
                    whiteLabelRequireNew: e.target.checked,
                    whiteLabelIdentityId: e.target.checked ? null : prev.whiteLabelIdentityId
                  }))}
                  className="w-4 h-4 rounded border-border accent-module-whitelabel"
                />
                <div>
                  <p className="font-medium text-foreground">Require new registration</p>
                  <p className="text-sm text-muted-foreground">Force users to create a new identity for this module</p>
                </div>
              </label>

              {/* Identity Selection - only show if not requiring new */}
              {!moduleIdentityConfig.whiteLabelRequireNew && (
                <div className="space-y-2">
                  <Label>Use Existing Identity (from White Label module)</Label>
                  <Select 
                    value={moduleIdentityConfig.whiteLabelIdentityId || 'none'} 
                    onValueChange={(value) => setModuleIdentityConfig(prev => ({ 
                      ...prev, 
                      whiteLabelIdentityId: value === 'none' ? null : value 
                    }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select identity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No identity selected (show onboarding)</span>
                      </SelectItem>
                      {whiteLabelIdentities.length > 0 ? (
                        whiteLabelIdentities.map((identity) => (
                          <SelectItem key={identity.identity_id} value={identity.identity_id}>
                            <span className="flex items-center gap-2">
                              {identity.identity_type?.toUpperCase() === 'INSTITUTION' ? (
                                <Building2 className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                              {identity.name}
                            </span>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                          No identities in White Label module yet
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {moduleIdentityConfig.whiteLabelIdentityId 
                      ? 'Users will use this identity by default' 
                      : 'Users must complete registration to use White Label Wallet'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveModuleIdentityConfig}
              className="bg-primary hover:bg-primary/90"
            >
              Save Module Settings
            </Button>
          </div>
        </TabsContent>

        {/* Identities Tab */}
        <TabsContent value="identities" className="space-y-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Identities</h3>
                <p className="text-sm text-muted-foreground">Manage individuals and institutions</p>
              </div>
              <Dialog open={identityDialogOpen} onOpenChange={setIdentityDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Identity
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Identity</DialogTitle>
                  </DialogHeader>
                  <CreateIdentityForm
                    onSubmit={handleCreateIdentity}
                    isLoading={createIdentityMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <IdentitiesTable
              identities={identities}
              isLoading={loadingIdentities}
            />
          </div>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Accounts</h3>
                <p className="text-sm text-muted-foreground">Manage Paxos accounts linked to identities</p>
              </div>
              <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Account</DialogTitle>
                  </DialogHeader>
                  <CreateAccountForm
                    identities={identities}
                    onSubmit={handleCreateAccount}
                    isLoading={createAccountMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <AccountsTable
              accounts={accounts}
              isLoading={loadingAccounts}
            />
          </div>
        </TabsContent>

        {/* White Label Tab */}
        <TabsContent value="whitelabel" className="space-y-6">
          {/* Wallet Branding */}
          <div className="glass rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Wallet Branding</h3>
                <p className="text-sm text-muted-foreground">Customize your white label wallet appearance</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletName">Wallet Display Name</Label>
                <Input
                  id="walletName"
                  placeholder="My Custom Wallet"
                  value={whiteLabelConfig.walletName}
                  onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, walletName: e.target.value }))}
                  className="bg-secondary border-border max-w-md"
                />
                <p className="text-xs text-muted-foreground">This name will be displayed in the wallet header</p>
              </div>
            </div>
          </div>

          {/* Asset Mapping */}
          <div className="glass rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Palette className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Asset Mapping</h3>
                <p className="text-sm text-muted-foreground">Map tokens to custom names for your wallet interface</p>
              </div>
            </div>

            {/* Add New Mapping */}
            <div className="grid md:grid-cols-5 gap-4 mb-6 p-4 bg-secondary/50 rounded-lg">
              <div className="space-y-2">
                <Label>Asset</Label>
                <Select value={newAssetId} onValueChange={setNewAssetId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {AVAILABLE_ASSETS.filter(a => !whiteLabelConfig.assetMappings.some(m => m.assetId === a.id)).map(asset => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.id} - {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Custom Name</Label>
                <Input
                  placeholder="e.g., Digital Gold"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newIconColor}
                    onChange={(e) => setNewIconColor(e.target.value)}
                    className="w-12 h-10 p-1 bg-secondary border-border cursor-pointer"
                  />
                  <Input
                    value={newIconColor}
                    onChange={(e) => setNewIconColor(e.target.value)}
                    className="bg-secondary border-border flex-1"
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Custom Icon</Label>
                <div className="flex gap-2 items-center">
                  <label className="flex-1 h-10 px-3 bg-secondary border border-border rounded-md flex items-center justify-center gap-2 cursor-pointer hover:bg-secondary/80 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      className="hidden"
                    />
                    {newCustomIcon ? (
                      <img src={newCustomIcon} alt="Custom icon" className="h-6 w-6 rounded object-cover" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload</span>
                      </>
                    )}
                  </label>
                  {newCustomIcon && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setNewCustomIcon(null)}
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Optional. Max 100KB.</p>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddAssetMapping} className="w-full bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {/* Existing Mappings */}
            {whiteLabelConfig.assetMappings.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Configured Asset Mappings</Label>
                <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {whiteLabelConfig.assetMappings.map((mapping) => {
                    const originalAsset = AVAILABLE_ASSETS.find(a => a.id === mapping.assetId);
                    return (
                      <div key={mapping.assetId} className="flex items-center justify-between p-4 bg-secondary/30">
                        <div className="flex items-center gap-4">
                          {mapping.customIcon ? (
                            <img 
                              src={mapping.customIcon} 
                              alt={mapping.customName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div 
                              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: mapping.iconColor || '#6366f1' }}
                            >
                              {mapping.customName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{mapping.customName}</p>
                            <p className="text-sm text-muted-foreground">
                              {mapping.assetId} ({originalAsset?.name})
                              {mapping.customIcon && <span className="ml-2 text-xs text-primary">• Custom icon</span>}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveAssetMapping(mapping.assetId)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No asset mappings configured yet</p>
                <p className="text-sm">Add mappings above to customize asset names in the wallet</p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <Button 
                onClick={handleSaveWhiteLabelConfig}
                className="bg-primary hover:bg-primary/90"
              >
                Save White Label Configuration
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigPage;
