'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Trash2, 
  ArrowRight, 
  Target, 
  Clock, 
  DollarSign,
  Eye,
  MousePointerClick,
  FileText,
  ShoppingCart,
  UserPlus,
  LogIn,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { 
  FunnelConfig, 
  FunnelStepConfig, 
  FunnelGoalConfig,
  FunnelEventType,
  FunnelCategory,
  OptimizationGoal,
  FunnelMetricType,
  EventCriteria
} from '../../types/funnel';

interface FunnelBuilderProps {
  onFunnelCreated: (config: FunnelConfig) => Promise<void>;
  initialConfig?: Partial<FunnelConfig>;
  teamId?: string;
  projectId?: string;
  isLoading?: boolean;
}

const eventTypeIcons = {
  [FunnelEventType.PAGE_VIEW]: Eye,
  [FunnelEventType.BUTTON_CLICK]: MousePointerClick,
  [FunnelEventType.FORM_SUBMIT]: FileText,
  [FunnelEventType.PURCHASE]: ShoppingCart,
  [FunnelEventType.SIGNUP]: UserPlus,
  [FunnelEventType.LOGIN]: LogIn,
  [FunnelEventType.CUSTOM]: Settings
};

export default function FunnelBuilder({
  onFunnelCreated,
  initialConfig,
  teamId,
  projectId,
  isLoading = false
}: FunnelBuilderProps) {
  const [config, setConfig] = useState<FunnelConfig>({
    name: initialConfig?.name || '',
    description: initialConfig?.description || '',
    category: initialConfig?.category || FunnelCategory.CUSTOM,
    steps: initialConfig?.steps || [
      {
        name: 'Landing Page Visit',
        eventType: FunnelEventType.PAGE_VIEW,
        eventCriteria: { urlPattern: '' },
        isRequired: true
      }
    ],
    goals: initialConfig?.goals || [],
    optimizationGoal: initialConfig?.optimizationGoal || OptimizationGoal.CONVERSION_RATE,
    timeWindow: initialConfig?.timeWindow || 2592000, // 30 days
    attributionWindow: initialConfig?.attributionWindow || 86400, // 24 hours
    allowParallelPaths: initialConfig?.allowParallelPaths || false,
    requireSequential: initialConfig?.requireSequential !== false
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateConfig = useCallback((updates: Partial<FunnelConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    // Clear relevant errors when field is updated
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete newErrors[key];
    });
    setErrors(newErrors);
  }, [errors]);

  const addStep = useCallback(() => {
    const newStep: FunnelStepConfig = {
      name: `Step ${config.steps.length + 1}`,
      eventType: FunnelEventType.PAGE_VIEW,
      eventCriteria: { urlPattern: '' },
      isRequired: true
    };
    updateConfig({ steps: [...config.steps, newStep] });
  }, [config.steps, updateConfig]);

  const updateStep = useCallback((index: number, updates: Partial<FunnelStepConfig>) => {
    const newSteps = [...config.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    updateConfig({ steps: newSteps });
  }, [config.steps, updateConfig]);

  const removeStep = useCallback((index: number) => {
    if (config.steps.length > 1) {
      const newSteps = config.steps.filter((_, i) => i !== index);
      updateConfig({ steps: newSteps });
    }
  }, [config.steps, updateConfig]);

  const addGoal = useCallback(() => {
    const newGoal: FunnelGoalConfig = {
      name: `Goal ${config.goals?.length || 0 + 1}`,
      targetMetric: FunnelMetricType.CONVERSION_RATE,
      targetValue: 0.1, // 10%
      comparisonType: 'greater_than',
      priority: 'medium'
    };
    updateConfig({ goals: [...(config.goals || []), newGoal] });
  }, [config.goals, updateConfig]);

  const updateGoal = useCallback((index: number, updates: Partial<FunnelGoalConfig>) => {
    const newGoals = [...(config.goals || [])];
    newGoals[index] = { ...newGoals[index], ...updates };
    updateConfig({ goals: newGoals });
  }, [config.goals, updateConfig]);

  const removeGoal = useCallback((index: number) => {
    const newGoals = (config.goals || []).filter((_, i) => i !== index);
    updateConfig({ goals: newGoals });
  }, [config.goals, updateConfig]);

  const validateConfig = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.name.trim()) {
      newErrors.name = 'Funnel name is required';
    }

    if (config.steps.length === 0) {
      newErrors.steps = 'At least one step is required';
    }

    config.steps.forEach((step, index) => {
      if (!step.name.trim()) {
        newErrors[`step-${index}-name`] = 'Step name is required';
      }

      if (step.eventType === FunnelEventType.PAGE_VIEW && !step.eventCriteria.urlPattern) {
        newErrors[`step-${index}-criteria`] = 'URL pattern is required for page view events';
      }

      if (step.eventType === FunnelEventType.BUTTON_CLICK && !step.eventCriteria.elementSelector) {
        newErrors[`step-${index}-criteria`] = 'Element selector is required for click events';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [config]);

  const handleSubmit = useCallback(async () => {
    if (!validateConfig()) {
      setActiveTab('basic'); // Switch to first tab with errors
      return;
    }

    try {
      await onFunnelCreated(config);
    } catch (error) {
      console.error('Failed to create funnel:', error);
      setErrors({ submit: 'Failed to create funnel. Please try again.' });
    }
  }, [config, validateConfig, onFunnelCreated]);

  const renderStepConfig = (step: FunnelStepConfig, index: number) => {
    const IconComponent = eventTypeIcons[step.eventType] || Settings;

    return (
      <Card key={index} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
              <CardTitle className="text-sm">
                Step {index + 1}: {step.name || 'Unnamed Step'}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {step.isRequired && <Badge variant="secondary" className="text-xs">Required</Badge>}
              {config.steps.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(index)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`step-${index}-name`}>Step Name</Label>
              <Input
                id={`step-${index}-name`}
                value={step.name}
                onChange={(e) => updateStep(index, { name: e.target.value })}
                placeholder="e.g., Landing Page Visit"
                className={errors[`step-${index}-name`] ? 'border-red-500' : ''}
              />
              {errors[`step-${index}-name`] && (
                <p className="text-sm text-red-500 mt-1">{errors[`step-${index}-name`]}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`step-${index}-type`}>Event Type</Label>
              <Select
                value={step.eventType}
                onValueChange={(value) => updateStep(index, { 
                  eventType: value as FunnelEventType,
                  eventCriteria: {} // Reset criteria when type changes
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FunnelEventType.PAGE_VIEW}>Page View</SelectItem>
                  <SelectItem value={FunnelEventType.BUTTON_CLICK}>Button Click</SelectItem>
                  <SelectItem value={FunnelEventType.FORM_SUBMIT}>Form Submit</SelectItem>
                  <SelectItem value={FunnelEventType.PURCHASE}>Purchase</SelectItem>
                  <SelectItem value={FunnelEventType.SIGNUP}>Sign Up</SelectItem>
                  <SelectItem value={FunnelEventType.LOGIN}>Login</SelectItem>
                  <SelectItem value={FunnelEventType.CUSTOM}>Custom Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor={`step-${index}-description`}>Description (Optional)</Label>
            <Textarea
              id={`step-${index}-description`}
              value={step.description || ''}
              onChange={(e) => updateStep(index, { description: e.target.value })}
              placeholder="Describe what happens in this step..."
              rows={2}
            />
          </div>

          {/* Event Criteria Configuration */}
          <div className="space-y-3">
            <Label>Event Criteria</Label>
            {step.eventType === FunnelEventType.PAGE_VIEW && (
              <div>
                <Label htmlFor={`step-${index}-url`}>URL Pattern</Label>
                <Input
                  id={`step-${index}-url`}
                  value={step.eventCriteria.urlPattern || ''}
                  onChange={(e) => updateStep(index, {
                    eventCriteria: { ...step.eventCriteria, urlPattern: e.target.value }
                  })}
                  placeholder="e.g., /landing-page or **/checkout/**"
                  className={errors[`step-${index}-criteria`] ? 'border-red-500' : ''}
                />
                {errors[`step-${index}-criteria`] && (
                  <p className="text-sm text-red-500 mt-1">{errors[`step-${index}-criteria`]}</p>
                )}
              </div>
            )}

            {step.eventType === FunnelEventType.BUTTON_CLICK && (
              <div className="space-y-2">
                <div>
                  <Label htmlFor={`step-${index}-selector`}>Element Selector</Label>
                  <Input
                    id={`step-${index}-selector`}
                    value={step.eventCriteria.elementSelector || ''}
                    onChange={(e) => updateStep(index, {
                      eventCriteria: { ...step.eventCriteria, elementSelector: e.target.value }
                    })}
                    placeholder="e.g., #signup-button or .cta-button"
                    className={errors[`step-${index}-criteria`] ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor={`step-${index}-text`}>Element Text (Optional)</Label>
                  <Input
                    id={`step-${index}-text`}
                    value={step.eventCriteria.elementText || ''}
                    onChange={(e) => updateStep(index, {
                      eventCriteria: { ...step.eventCriteria, elementText: e.target.value }
                    })}
                    placeholder="e.g., Sign Up Now"
                  />
                </div>
                {errors[`step-${index}-criteria`] && (
                  <p className="text-sm text-red-500 mt-1">{errors[`step-${index}-criteria`]}</p>
                )}
              </div>
            )}

            {step.eventType === FunnelEventType.FORM_SUBMIT && (
              <div>
                <Label htmlFor={`step-${index}-form`}>Form Selector</Label>
                <Input
                  id={`step-${index}-form`}
                  value={step.eventCriteria.formSelector || ''}
                  onChange={(e) => updateStep(index, {
                    eventCriteria: { ...step.eventCriteria, formSelector: e.target.value }
                  })}
                  placeholder="e.g., #contact-form or .signup-form"
                />
              </div>
            )}

            {step.eventType === FunnelEventType.CUSTOM && (
              <div>
                <Label htmlFor={`step-${index}-event`}>Custom Event Name</Label>
                <Input
                  id={`step-${index}-event`}
                  value={step.eventCriteria.customEventName || ''}
                  onChange={(e) => updateStep(index, {
                    eventCriteria: { ...step.eventCriteria, customEventName: e.target.value }
                  })}
                  placeholder="e.g., video_played or download_started"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`step-${index}-required`}
                checked={step.isRequired}
                onChange={(e) => updateStep(index, { isRequired: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor={`step-${index}-required`} className="text-sm">
                Required Step
              </Label>
            </div>
            <div>
              <Label htmlFor={`step-${index}-time`}>Time Limit (sec)</Label>
              <Input
                id={`step-${index}-time`}
                type="number"
                value={step.timeLimit || ''}
                onChange={(e) => updateStep(index, { 
                  timeLimit: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="300"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor={`step-${index}-revenue`}>Revenue Value</Label>
              <Input
                id={`step-${index}-revenue`}
                type="number"
                step="0.01"
                value={step.revenueValue || ''}
                onChange={(e) => updateStep(index, { 
                  revenueValue: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                placeholder="0.00"
                min="0"
              />
            </div>
          </div>
        </CardContent>
        
        {index < config.steps.length - 1 && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white border rounded-full p-1">
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </Card>
    );
  };

  const renderGoalConfig = (goal: FunnelGoalConfig, index: number) => (
    <Card key={index}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <CardTitle className="text-sm">
              Goal {index + 1}: {goal.name || 'Unnamed Goal'}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeGoal(index)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`goal-${index}-name`}>Goal Name</Label>
            <Input
              id={`goal-${index}-name`}
              value={goal.name}
              onChange={(e) => updateGoal(index, { name: e.target.value })}
              placeholder="e.g., Minimum Conversion Rate"
            />
          </div>
          <div>
            <Label htmlFor={`goal-${index}-metric`}>Target Metric</Label>
            <Select
              value={goal.targetMetric}
              onValueChange={(value) => updateGoal(index, { targetMetric: value as FunnelMetricType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FunnelMetricType.CONVERSION_RATE}>Conversion Rate</SelectItem>
                <SelectItem value={FunnelMetricType.COMPLETION_TIME}>Completion Time</SelectItem>
                <SelectItem value={FunnelMetricType.REVENUE_PER_USER}>Revenue Per User</SelectItem>
                <SelectItem value={FunnelMetricType.STEP_COMPLETION_RATE}>Step Completion Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor={`goal-${index}-description`}>Description (Optional)</Label>
          <Textarea
            id={`goal-${index}-description`}
            value={goal.description || ''}
            onChange={(e) => updateGoal(index, { description: e.target.value })}
            placeholder="Describe this goal..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor={`goal-${index}-comparison`}>Comparison</Label>
            <Select
              value={goal.comparisonType}
              onValueChange={(value) => updateGoal(index, { comparisonType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="greater_than">Greater Than</SelectItem>
                <SelectItem value="less_than">Less Than</SelectItem>
                <SelectItem value="equals">Equals</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`goal-${index}-target`}>Target Value</Label>
            <Input
              id={`goal-${index}-target`}
              type="number"
              step="0.01"
              value={goal.targetValue}
              onChange={(e) => updateGoal(index, { targetValue: parseFloat(e.target.value) || 0 })}
              placeholder="0.10"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor={`goal-${index}-priority`}>Priority</Label>
            <Select
              value={goal.priority}
              onValueChange={(value) => updateGoal(index, { priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Conversion Funnel</h1>
          <p className="text-gray-600">
            Define your user journey and track conversion optimization opportunities
          </p>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-red-700">{errors.submit}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="steps">Funnel Steps</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic settings for your conversion funnel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="funnel-name">Funnel Name *</Label>
                  <Input
                    id="funnel-name"
                    value={config.name}
                    onChange={(e) => updateConfig({ name: e.target.value })}
                    placeholder="e.g., E-commerce Purchase Funnel"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="funnel-category">Category</Label>
                  <Select
                    value={config.category}
                    onValueChange={(value) => updateConfig({ category: value as FunnelCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FunnelCategory.SIGNUP}>Sign Up</SelectItem>
                      <SelectItem value={FunnelCategory.PURCHASE}>Purchase</SelectItem>
                      <SelectItem value={FunnelCategory.ACTIVATION}>Activation</SelectItem>
                      <SelectItem value={FunnelCategory.RETENTION}>Retention</SelectItem>
                      <SelectItem value={FunnelCategory.REFERRAL}>Referral</SelectItem>
                      <SelectItem value={FunnelCategory.CUSTOM}>Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="funnel-description">Description</Label>
                <Textarea
                  id="funnel-description"
                  value={config.description || ''}
                  onChange={(e) => updateConfig({ description: e.target.value })}
                  placeholder="Describe the purpose of this funnel..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="optimization-goal">Optimization Goal</Label>
                <Select
                  value={config.optimizationGoal}
                  onValueChange={(value) => updateConfig({ optimizationGoal: value as OptimizationGoal })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OptimizationGoal.CONVERSION_RATE}>Conversion Rate</SelectItem>
                    <SelectItem value={OptimizationGoal.REVENUE}>Revenue</SelectItem>
                    <SelectItem value={OptimizationGoal.TIME_TO_CONVERT}>Time to Convert</SelectItem>
                    <SelectItem value={OptimizationGoal.USER_SATISFACTION}>User Satisfaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Funnel Steps</h3>
              <p className="text-gray-600">Define the user journey through your funnel</p>
            </div>
            <Button onClick={addStep} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Step
            </Button>
          </div>

          {errors.steps && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-red-700">{errors.steps}</p>
            </div>
          )}

          <div className="space-y-6">
            {config.steps.map((step, index) => renderStepConfig(step, index))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Funnel Goals</h3>
              <p className="text-gray-600">Set targets for measuring funnel performance</p>
            </div>
            <Button onClick={addGoal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </div>

          <div className="space-y-4">
            {(config.goals || []).map((goal, index) => renderGoalConfig(goal, index))}
            
            {(!config.goals || config.goals.length === 0) && (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Target className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-4">No goals configured yet</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Goals help you track specific performance targets for your funnel
                  </p>
                  <Button onClick={addGoal} variant="outline">
                    Add Your First Goal
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced behavior and timing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time-window">Time Window (seconds)</Label>
                  <Input
                    id="time-window"
                    type="number"
                    value={config.timeWindow}
                    onChange={(e) => updateConfig({ timeWindow: parseInt(e.target.value) || 2592000 })}
                    placeholder="2592000"
                    min="3600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long users have to complete the funnel (default: 30 days)
                  </p>
                </div>
                <div>
                  <Label htmlFor="attribution-window">Attribution Window (seconds)</Label>
                  <Input
                    id="attribution-window"
                    type="number"
                    value={config.attributionWindow}
                    onChange={(e) => updateConfig({ attributionWindow: parseInt(e.target.value) || 86400 })}
                    placeholder="86400"
                    min="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long to attribute conversions to marketing channels (default: 24 hours)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="require-sequential"
                    checked={config.requireSequential}
                    onChange={(e) => updateConfig({ requireSequential: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="require-sequential">
                    Require Sequential Completion
                  </Label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  Users must complete steps in order (recommended for most funnels)
                </p>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allow-parallel"
                    checked={config.allowParallelPaths}
                    onChange={(e) => updateConfig({ allowParallelPaths: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="allow-parallel">
                    Allow Parallel Paths
                  </Label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  Allow users to complete multiple steps simultaneously (advanced feature)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button variant="outline">
          Save as Draft
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            <>
              <Target className="h-4 w-4" />
              Create Funnel
            </>
          )}
        </Button>
      </div>
    </div>
  );
}