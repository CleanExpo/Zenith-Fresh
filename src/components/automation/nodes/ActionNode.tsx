/**
 * Action Node Component
 * Custom React Flow node for workflow actions
 */

'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Settings, FileText, Package, Calculator, Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActionNodeData {
  label: string;
  subtype: 'log' | 'set_variable' | 'calculate' | 'format';
  config: {
    action: string;
    parameters: any;
  };
  isValid: boolean;
}

const actionIcons = {
  log: FileText,
  set_variable: Package,
  calculate: Calculator,
  format: Palette
};

const actionColors = {
  log: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  set_variable: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  calculate: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  format: 'bg-pink-50 border-pink-200 text-pink-700'
};

export default function ActionNode({ data, selected }: NodeProps<ActionNodeData>) {
  const Icon = actionIcons[data.subtype] || Settings;
  const colorClass = actionColors[data.subtype] || 'bg-gray-50 border-gray-200 text-gray-700';

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
        <Icon className="h-5 w-5" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      
      {/* Status Badges */}
      <div className="flex items-center space-x-2 mb-3">
        <Badge variant="outline" className="text-xs">
          Action
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {data.subtype.replace('_', ' ')}
        </Badge>
      </div>
      
      {/* Configuration Summary */}
      <div className="text-xs text-gray-600 space-y-1">
        {data.subtype === 'log' && data.config.parameters?.message && (
          <div className="truncate" title={data.config.parameters.message}>
            Message: {data.config.parameters.message.substring(0, 30)}...
          </div>
        )}
        {data.subtype === 'set_variable' && (
          <div>
            Variable: {data.config.parameters?.name || 'undefined'}
          </div>
        )}
        {data.subtype === 'calculate' && data.config.parameters?.expression && (
          <div className="truncate" title={data.config.parameters.expression}>
            Expression: {data.config.parameters.expression.substring(0, 25)}...
          </div>
        )}
        {data.subtype === 'format' && data.config.parameters?.template && (
          <div className="truncate" title={data.config.parameters.template}>
            Template: {data.config.parameters.template.substring(0, 25)}...
          </div>
        )}
      </div>
      
      {/* Validation Error */}
      {!data.isValid && (
        <div className="mt-2 text-xs text-red-600">
          Action parameters required
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