'use client';

import { useState, useEffect } from 'react';
import { featureFlagService, FeatureFlag } from '@/lib/feature-flags';
import { getEnvironmentConfig } from '@/lib/environment';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

export function FeatureFlagPanel() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const envConfig = getEnvironmentConfig();

  useEffect(() => {
    setFlags(featureFlagService.getAllFlags());
  }, []);

  const handleToggleFlag = (flagKey: string, enabled: boolean) => {
    featureFlagService.updateFlag(flagKey, { enabled });
    setFlags(featureFlagService.getAllFlags());
  };

  const handleRolloutChange = (flagKey: string, rolloutPercentage: number) => {
    featureFlagService.updateFlag(flagKey, { rolloutPercentage });
    setFlags(featureFlagService.getAllFlags());
  };

  const getEnvironmentBadgeColor = (environments?: string[]) => {
    if (!environments) return 'default';
    if (environments.includes('production')) return 'destructive';
    if (environments.includes('staging')) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Flags</h2>
          <p className="text-gray-600">
            Manage feature rollouts and experiments
          </p>
        </div>
        <Badge variant={envConfig.isProduction ? 'destructive' : 'secondary'}>
          {envConfig.environment.toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.key} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{flag.name}</h3>
                  <Badge variant={getEnvironmentBadgeColor(flag.environments)}>
                    {flag.environments?.join(', ') || 'All'}
                  </Badge>
                  {flag.enabled && (
                    <Badge variant={flag.rolloutPercentage === 100 ? 'default' : 'secondary'}>
                      {flag.rolloutPercentage}% rollout
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{flag.description}</p>
                
                {flag.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Rollout Percentage: {flag.rolloutPercentage}%
                      </label>
                      <Slider
                        value={[flag.rolloutPercentage]}
                        onValueChange={(value) => handleRolloutChange(flag.key, value[0])}
                        max={100}
                        step={5}
                        className="w-full max-w-xs"
                      />
                    </div>
                    
                    {flag.targetUsers && flag.targetUsers.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Target Users:</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {flag.targetUsers.map(userId => (
                            <Badge key={userId} variant="outline" className="text-xs">
                              {userId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {flag.targetRoles && flag.targetRoles.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Target Roles:</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {flag.targetRoles.map(role => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(checked) => handleToggleFlag(flag.key, checked)}
                />
                <span className="text-sm font-medium">
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Feature Flag Best Practices</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Start with 0% rollout and gradually increase</li>
          <li>• Test in development and staging before production</li>
          <li>• Monitor metrics closely during rollouts</li>
          <li>• Have rollback plans ready for each feature</li>
          <li>• Use user targeting for beta testing</li>
        </ul>
      </div>
    </div>
  );
}