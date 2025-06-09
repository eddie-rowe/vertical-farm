'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Settings, TestTube, Check, X, AlertCircle, Shield } from 'lucide-react';
import { homeAssistantService } from '@/services/homeAssistantService';
import { supabase } from '@/supabaseClient';

interface HAUserConfig {
  id: string;
  name: string;
  url: string;
  local_url?: string;
  cloudflare_enabled: boolean;
  is_default: boolean;
  enabled: boolean;
  last_tested?: string;
  last_successful_connection?: string;
  test_result?: 'success' | 'failed' | 'pending';
  created_at: string;
  updated_at: string;
}

interface TestResult {
  success: boolean;
  status: string;
  message: string;
  device_count?: number;
  home_assistant_version?: string;
  error_details?: string;
}

const HomeAssistantConfigManager: React.FC = () => {
  const [configs, setConfigs] = useState<HAUserConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingConfigs, setTestingConfigs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    access_token: '',
    local_url: '',
    cloudflare_enabled: false,
    cloudflare_client_id: '',
    cloudflare_client_secret: '',
    is_default: false
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/home-assistant/config', {
        headers: await getAuthHeaders(),
      });

      if (response.ok) {
        const configData = await response.json();
        setConfigs(configData);
      } else {
        setError('Failed to load configurations');
      }
    } catch (err) {
      setError('Error loading configurations');
      console.error('Error loading configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${sessionData.session?.access_token}`,
      'Content-Type': 'application/json',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/v1/home-assistant/config', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Configuration saved successfully');
        setShowAddForm(false);
        setFormData({
          name: '',
          url: '',
          access_token: '',
          local_url: '',
          cloudflare_enabled: false,
          cloudflare_client_id: '',
          cloudflare_client_secret: '',
          is_default: false
        });
        loadConfigs();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Error saving configuration');
      console.error('Error saving config:', err);
    }
  };

  const testConnection = async (config: HAUserConfig) => {
    setTestingConfigs(prev => new Set(prev).add(config.id));
    setError(null);

    try {
      const response = await homeAssistantService.testConnection(
        config.url,
        '', // Access token is stored securely on backend
        config.cloudflare_enabled ? {
          cloudflare_client_id: '',
          cloudflare_client_secret: ''
        } : undefined
      );

      if (response.connected) {
        setSuccess(`Connection test successful! Found ${response.device_count || 0} devices.`);
      } else {
        setError(`Connection test failed: ${response.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Connection test failed: ${err}`);
      console.error('Connection test error:', err);
    } finally {
      setTestingConfigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(config.id);
        return newSet;
      });
    }
  };

  const deleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      const response = await fetch(`/api/v1/home-assistant/config/${configId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      });

      if (response.ok) {
        setSuccess('Configuration deleted successfully');
        loadConfigs();
      } else {
        setError('Failed to delete configuration');
      }
    } catch (err) {
      setError('Error deleting configuration');
      console.error('Error deleting config:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading configurations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Home Assistant Configurations</h2>
          <p className="text-gray-600">Manage your Home Assistant integrations</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Configuration
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Add Configuration Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Home Assistant Configuration</CardTitle>
            <CardDescription>
              Configure connection to your Home Assistant instance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="My Home Assistant"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="url">Home Assistant URL</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://your-ha.domain.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="access_token">Long-Lived Access Token</Label>
                  <Input
                    id="access_token"
                    name="access_token"
                    type="password"
                    value={formData.access_token}
                    onChange={handleInputChange}
                    placeholder="Your HA access token"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="local_url">Local URL (Optional)</Label>
                  <Input
                    id="local_url"
                    name="local_url"
                    value={formData.local_url}
                    onChange={handleInputChange}
                    placeholder="http://192.168.1.100:8123"
                  />
                </div>
              </div>

              <hr className="my-4" />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="cloudflare_enabled"
                    checked={formData.cloudflare_enabled}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, cloudflare_enabled: checked }))
                    }
                  />
                  <Label htmlFor="cloudflare_enabled">Cloudflare Access Protection</Label>
                </div>

                {formData.cloudflare_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div>
                      <Label htmlFor="cloudflare_client_id">Client ID</Label>
                      <Input
                        id="cloudflare_client_id"
                        name="cloudflare_client_id"
                        value={formData.cloudflare_client_id}
                        onChange={handleInputChange}
                        placeholder="Cloudflare Client ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cloudflare_client_secret">Client Secret</Label>
                      <Input
                        id="cloudflare_client_secret"
                        name="cloudflare_client_secret"
                        type="password"
                        value={formData.cloudflare_client_secret}
                        onChange={handleInputChange}
                        placeholder="Cloudflare Client Secret"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_default: checked }))
                    }
                  />
                  <Label htmlFor="is_default">Set as Default Configuration</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Save Configuration</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing Configurations */}
      <div className="grid gap-4">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Configurations Found</h3>
              <p className="text-gray-600 mb-4">
                Add your first Home Assistant configuration to get started.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                Add Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium">{config.name}</h3>
                      {config.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      {config.enabled ? (
                        <Badge variant="default">Enabled</Badge>
                      ) : (
                        <Badge variant="destructive">Disabled</Badge>
                      )}
                    </div>

                    <p className="text-gray-600 mb-2">{config.url}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {config.cloudflare_enabled && (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Cloudflare Protected
                        </span>
                      )}
                      {config.last_successful_connection && (
                        <span>
                          Last connected: {new Date(config.last_successful_connection).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(config)}
                      disabled={testingConfigs.has(config.id)}
                    >
                      {testingConfigs.has(config.id) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      Test
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteConfig(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HomeAssistantConfigManager; 