/**
 * Trigger Node Component
 * Custom React Flow node for workflow triggers
 */

'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap, Webhook, Clock, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TriggerNodeData {
  label: string;
  subtype: 'manual' | 'webhook' | 'schedule' | 'api_call';
  config: any;
  isValid: boolean;
}

const triggerIcons = {
  manual: Zap,
  webhook: Webhook,
  schedule: Clock,
  api_call: Globe
};

const triggerColors = {
  manual: 'bg-blue-50 border-blue-200 text-blue-700',
  webhook: 'bg-green-50 border-green-200 text-green-700',
  schedule: 'bg-purple-50 border-purple-200 text-purple-700',
  api_call: 'bg-orange-50 border-orange-200 text-orange-700'
};

export default function TriggerNode({ data, selected }: NodeProps<TriggerNodeData>) {
  const Icon = triggerIcons[data.subtype] || Zap;
  const colorClass = triggerColors[data.subtype] || triggerColors.manual;

  return (
    <Card 
      className={`p-4 min-w-48 transition-all duration-200 ${colorClass} ${
        selected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md hover:shadow-lg'
      } ${!data.isValid ? 'border-red-300 bg-red-50' : ''}`}
    >
      {/* Drag Handle */}
      <div className="drag-handle absolute inset-0 cursor-move" />
      
      {/* Header */}
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="h-5 w-5" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      
      {/* Status Badges */}
      <div className="flex items-center space-x-2 mb-3">
        <Badge variant="outline" className="text-xs">
          Trigger
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {data.subtype.replace('_', ' ')}
        </Badge>
      </div>
      
      {/* Configuration Summary */}
      <div className="text-xs text-gray-600 space-y-1">
        {data.subtype === 'webhook' && data.config.url && (
          <div>URL: {data.config.url.substring(0, 30)}...</div>
        )}
        {data.subtype === 'schedule' && data.config.cron && (
          <div>Schedule: {data.config.cron}</div>
        )}
        {data.subtype === 'api_call' && data.config.interval && (
          <div>Interval: {data.config.interval}s</div>
        )}
        {data.subtype === 'manual' && (
          <div>Manual execution</div>
        )}
      </div>
      
      {/* Validation Error */}
      {!data.isValid && (
        <div className="mt-2 text-xs text-red-600">
          Configuration incomplete
        </div>
      )}
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-blue-500 border-2 border-white shadow-md"
      />
    </Card>
  );
}