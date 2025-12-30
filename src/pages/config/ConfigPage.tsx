import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, RefreshCw, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getApiConfig, saveApiConfig, ApiConfig } from '@/api';

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
      // Test connection by making a simple request to the API
      const response = await fetch(`${config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setIsConnected(true);
        toast.success('Connection successful!');
      } else {
        setIsConnected(false);
        toast.error('Connection failed. Please check your settings.');
      }
    } catch (error) {
      // If health endpoint doesn't exist, try a basic connection test
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Paxos Configuration</h2>
        <p className="text-muted-foreground">Configure your Paxos API credentials and environment settings.</p>
      </div>

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
              <p className="text-xs text-muted-foreground">
                The base URL of your Paxos integration API server
              </p>
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
            <p className="text-sm text-muted-foreground">Enter your Paxos API credentials (stored locally)</p>
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
    </div>
  );
};

export default ConfigPage;
