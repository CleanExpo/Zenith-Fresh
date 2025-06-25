/**
 * Delay Node Component
 * Custom React Flow node for time delays
 */

'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Clock, Timer, Pause } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DelayNodeData {
  label: string;
  subtype: 'wait';
  config: {
    duration: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
    description?: string;
  };
  isValid: boolean;
}

const unitAbbreviations = {
  seconds: 's',
  minutes: 'm',
  hours: 'h',
  days: 'd'
};

export default function DelayNode({ data, selected }: NodeProps<DelayNodeData>) {
  const colorClass = 'bg-slate-50 border-slate-200 text-slate-700';

  const formatDuration = () => {
    const { duration, unit } = data.config;
    if (!duration || !unit) return 'No delay';
    
    const abbrev = unitAbbreviations[unit] || unit;
    return `${duration}${abbrev}`;
  };

  const getTotalSeconds = () => {
    const { duration, unit } = data.config;
    if (!duration || !unit) return 0;
    
    const multipliers = {
      seconds: 1,
      minutes: 60,
      hours: 3600,
      days: 86400
    };
    
    return duration * multipliers[unit];
  };

  const isLongDelay = getTotalSeconds() > 3600; // More than 1 hour

  return (
    <Card 
      className={`p-4 min-w-48 transition-all duration-200 ${colorClass} ${
        selected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md hover:shadow-lg'
      } ${!data.isValid ? 'border-red-300 bg-red-50' : ''}`}
    >
      {/* Drag Handle */}
      <div className="drag-handle absolute inset-0 cursor-move" />
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-green-500 border-2 border-white shadow-md"
      />
      
      {/* Header */}
      <div className="flex items-center space-x-2 mb-2">
        <Clock className="h-5 w-5" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      
      {/* Status Badges */}
      <div className="flex items-center space-x-2 mb-3">
        <Badge variant="outline" className="text-xs">
          Delay
        </Badge>
        <Badge variant="outline" className="text-xs">
          {formatDuration()}
        </Badge>
        {isLongDelay && (
          <Badge variant="outline" className="text-xs text-orange-600">
            Long
          </Badge>
        )}
      </div>
      
      {/* Configuration Summary */}
      <div className="text-xs text-gray-600 space-y-1">
        {data.config.duration && data.config.unit ? (
          <div className="flex items-center space-x-2">
            <Timer className="h-3 w-3" />
            <span>
              Wait {data.config.duration} {data.config.unit}
            </span>
          </div>
        ) : (
          <div className="text-gray-400 italic">No duration set</div>
        )}
        
        {data.config.description && (
          <div className="truncate" title={data.config.description}>
            Note: {data.config.description.substring(0, 30)}...
          </div>
        )}
        
        {getTotalSeconds() > 0 && (
          <div className="text-gray-400">
            Total: {getTotalSeconds().toLocaleString()}s
          </div>
        )}
      </div>
      
      {/* Validation Error */}
      {!data.isValid && (
        <div className="mt-2 text-xs text-red-600">
          Duration and unit required
        </div>
      )}
      
      {/* Clock Indicator with Animation */}
      <div className="absolute top-2 right-2">
        <Pause className="h-4 w-4 text-slate-500 animate-pulse" />
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-blue-500 border-2 border-white shadow-md"
      />
      
      {/* Visual Duration Indicator */}
      <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-slate-400 rounded-full transition-all duration-1000"
          style={{ 
            width: isLongDelay ? '100%' : `${Math.min(100, (getTotalSeconds() / 300) * 100)}%` 
          }}
        />
      </div>
    </Card>
  );
}