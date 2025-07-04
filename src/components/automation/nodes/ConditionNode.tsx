/**
 * Condition Node Component
 * Custom React Flow node for conditional logic
 */

'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch, HelpCircle, RotateCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConditionNodeData {
  label: string;
  subtype: 'if' | 'switch';
  config: {
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
      logic?: 'AND' | 'OR';
    }>;
    defaultPath?: 'true' | 'false';
  };
  isValid: boolean;
}

export default function ConditionNode({ data, selected }: NodeProps<ConditionNodeData>) {
  const Icon = data.subtype === 'switch' ? RotateCw : GitBranch;
  const colorClass = 'bg-amber-50 border-amber-200 text-amber-700';

  const conditionCount = data.config.conditions?.length || 0;

  return (
    <Card 
      className={`p-4 min-w-52 transition-all duration-200 ${colorClass} ${
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
        <Icon className="h-5 w-5" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      
      {/* Status Badges */}
      <div className="flex items-center space-x-2 mb-3">
        <Badge variant="outline" className="text-xs">
          Condition
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {data.subtype}
        </Badge>
        {conditionCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {conditionCount} rule{conditionCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      
      {/* Configuration Summary */}
      <div className="text-xs text-gray-600 space-y-1">
        {conditionCount > 0 ? (
          data.config.conditions.slice(0, 2).map((condition, index) => (
            <div key={index} className="truncate">
              {condition.field} {condition.operator} {String(condition.value)}
            </div>
          ))
        ) : (
          <div className="text-gray-400 italic">No conditions defined</div>
        )}
        {conditionCount > 2 && (
          <div className="text-gray-400">
            +{conditionCount - 2} more...
          </div>
        )}
      </div>
      
      {/* Validation Error */}
      {!data.isValid && (
        <div className="mt-2 text-xs text-red-600">
          At least one condition required
        </div>
      )}
      
      {/* Question Mark Indicator */}
      <div className="absolute top-2 right-2">
        <HelpCircle className="h-4 w-4 text-amber-500" />
      </div>
      
      {/* Output Handles - True/False paths */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '40%' }}
        className="w-3 h-3 bg-green-500 border-2 border-white shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '60%' }}
        className="w-3 h-3 bg-red-500 border-2 border-white shadow-md"
      />
      
      {/* Path Labels */}
      <div className="absolute -right-8 top-6 text-xs text-green-600 font-medium">
        T
      </div>
      <div className="absolute -right-8 top-12 text-xs text-red-600 font-medium">
        F
      </div>
    </Card>
  );
}