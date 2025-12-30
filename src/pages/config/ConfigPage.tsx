import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, RefreshCw, Server, Plus } from 'lucide-react';
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

  // API hooks
  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts();
  const { data: identitiesResponse, isLoading: loadingIdentities } = useIdentities();
  const createIdentityMutation = useCreateIdentity();
  const createAccountMutation = useCreateAccount();

  const accounts = accountsResponse?.data || [];
  const identities = identitiesResponse?.data || [];

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = getApiConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      setIsConnected(true);
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Configuration</h2>
        <p className="text-muted-foreground">Manage API settings, identities, and accounts.</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="api">API Settings</TabsTrigger>
          <TabsTrigger value="identities">Identities ({identities.length})</TabsTrigger>
          <TabsTrigger value="accounts">Accounts ({accounts.length})</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default ConfigPage;
