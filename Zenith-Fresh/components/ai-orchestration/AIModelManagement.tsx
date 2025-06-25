"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Brain, 
  Plus, 
  Settings, 
  Activity, 
  DollarSign, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Code
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  version?: string;
  capabilities: string[];
  contextLength: number;
  costPer1kTokens: number;
  isAvailable: boolean;
  configuration?: any;
  averageLatency: number;
  reliability: number;
  qualityScore: number;
}

interface ModelStats {
  totalModels: number;
  activeModels: number;
  providersCount: number;
  totalCost: number;
  averageLatency: number;
  reliability: number;
}

const providerIcons: Record<string, React.ReactNode> = {
  openai: <Globe className="h-4 w-4" />,
  anthropic: <Brain className="h-4 w-4" />,
  google: <Sparkles className="h-4 w-4" />,
  local: <Shield className="h-4 w-4" />,
  custom: <Code className="h-4 w-4" />
};

const providerColors: Record<string, string> = {
  openai: "bg-green-500",
  anthropic: "bg-orange-500",
  google: "bg-blue-500",
  local: "bg-purple-500",
  custom: "bg-gray-500"
};

export default function AIModelManagement() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [stats, setStats] = useState<ModelStats>({
    totalModels: 0,
    activeModels: 0,
    providersCount: 0,
    totalCost: 0,
    averageLatency: 0,
    reliability: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [isAddingModel, setIsAddingModel] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-orchestration/models');
      const data = await response.json();
      setModels(data.models);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModel = async (modelData: any) => {
    try {
      const response = await fetch('/api/ai-orchestration/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData)
      });
      
      if (response.ok) {
        fetchModels();
        setIsAddingModel(false);
      }
    } catch (error) {
      console.error('Error adding model:', error);
    }
  };

  const handleToggleModel = async (modelId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/ai-orchestration/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable })
      });
      
      if (response.ok) {
        fetchModels();
      }
    } catch (error) {
      console.error('Error updating model:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Model Management</h1>
          <p className="text-muted-foreground">Configure and manage AI models across providers</p>
        </div>
        <Button onClick={() => setIsAddingModel(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Model
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModels}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeModels}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.providersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageLatency}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reliability</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.reliability * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Models by Provider */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Models</TabsTrigger>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="local">Local</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ModelGrid models={models} onToggle={handleToggleModel} onSelect={setSelectedModel} />
        </TabsContent>

        {['openai', 'anthropic', 'google', 'local', 'custom'].map(provider => (
          <TabsContent key={provider} value={provider} className="space-y-4">
            <ModelGrid 
              models={models.filter(m => m.provider === provider)} 
              onToggle={handleToggleModel}
              onSelect={setSelectedModel}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Model Dialog */}
      <AddModelDialog 
        isOpen={isAddingModel} 
        onClose={() => setIsAddingModel(false)}
        onAdd={handleAddModel}
      />

      {/* Model Details Dialog */}
      {selectedModel && (
        <ModelDetailsDialog
          model={selectedModel}
          isOpen={!!selectedModel}
          onClose={() => setSelectedModel(null)}
        />
      )}
    </div>
  );
}

function ModelGrid({ models, onToggle, onSelect }: {
  models: AIModel[];
  onToggle: (id: string, available: boolean) => void;
  onSelect: (model: AIModel) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {models.map((model) => (
        <motion.div
          key={model.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onSelect(model)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`h-8 w-8 rounded-full ${providerColors[model.provider]} flex items-center justify-center text-white`}>
                    {providerIcons[model.provider]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <CardDescription>{model.provider} • {model.modelId}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={model.isAvailable}
                  onCheckedChange={(checked) => {
                    onToggle(model.id, checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Capabilities */}
                <div className="flex flex-wrap gap-1">
                  {model.capabilities.slice(0, 3).map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                  {model.capabilities.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{model.capabilities.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Latency:</span>
                    <span className="font-medium">{model.averageLatency}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-medium">${model.costPer1kTokens}/1k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quality:</span>
                    <span className="font-medium">{(model.qualityScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Context:</span>
                    <span className="font-medium">{model.contextLength.toLocaleString()}</span>
                  </div>
                </div>

                {/* Reliability Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reliability</span>
                    <span className="font-medium">{(model.reliability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${model.reliability * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function AddModelDialog({ isOpen, onClose, onAdd }: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (model: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    modelId: '',
    version: '',
    capabilities: [],
    contextLength: 4096,
    costPer1kTokens: 0.002,
    apiKey: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add AI Model</DialogTitle>
          <DialogDescription>
            Configure a new AI model for your orchestration system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Model Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="GPT-4 Turbo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelId">Model ID</Label>
              <Input
                id="modelId"
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                placeholder="gpt-4-turbo-preview"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version (Optional)</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="2024-01-25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contextLength">Context Length</Label>
              <Input
                id="contextLength"
                type="number"
                value={formData.contextLength}
                onChange={(e) => setFormData({ ...formData, contextLength: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPer1kTokens">Cost per 1k Tokens ($)</Label>
              <Input
                id="costPer1kTokens"
                type="number"
                step="0.001"
                value={formData.costPer1kTokens}
                onChange={(e) => setFormData({ ...formData, costPer1kTokens: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capabilities</Label>
            <div className="grid grid-cols-3 gap-2">
              {['text', 'code', 'image', 'reasoning', 'function-calling', 'streaming'].map((cap) => (
                <label key={cap} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.capabilities.includes(cap)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, capabilities: [...formData.capabilities, cap] });
                      } else {
                        setFormData({ ...formData, capabilities: formData.capabilities.filter(c => c !== cap) });
                      }
                    }}
                  />
                  <span className="text-sm capitalize">{cap}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key (Optional)</Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="Leave empty to use environment variable"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Model
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ModelDetailsDialog({ model, isOpen, onClose }: {
  model: AIModel;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className={`h-8 w-8 rounded-full ${providerColors[model.provider]} flex items-center justify-center text-white`}>
              {providerIcons[model.provider]}
            </div>
            <span>{model.name}</span>
          </DialogTitle>
          <DialogDescription>
            {model.provider} • {model.modelId} {model.version && `• ${model.version}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Average Latency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{model.averageLatency}ms</div>
                  <p className="text-xs text-muted-foreground">Response time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Reliability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(model.reliability * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Success rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quality Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(model.qualityScore * 100).toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">Output quality</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {model.capabilities.map((cap) => (
                <Badge key={cap} variant="outline">
                  {cap}
                </Badge>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Configuration</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Context Length</span>
                <span className="font-medium">{model.contextLength.toLocaleString()} tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost per 1k Tokens</span>
                <span className="font-medium">${model.costPer1kTokens}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={model.isAvailable ? "default" : "secondary"}>
                  {model.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Usage Statistics</h3>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Detailed usage statistics and cost analysis will be available after the model has been used in deployments.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}