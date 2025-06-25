/**
 * Transform Node Component
 * Custom React Flow node for data transformation
 */

'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Shuffle, Filter, Map, RotateCw, FileText, Merge } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TransformNodeData {
  label: string;
  subtype: 'map' | 'filter' | 'reduce' | 'sort' | 'format' | 'extract' | 'merge';
  config: {
    operation: string;
    sourceField?: string;
    targetField?: string;
    template?: string;
    script?: string;
    parameters?: Record<string, any>;
  };
  isValid: boolean;
}

const transformIcons = {
  map: Map,
  filter: Filter,
  reduce: RotateCw,
  sort: RotateCw,
  format: FileText,
  extract: RotateCw,
  merge: Merge
};

const transformColors = {
  map: 'bg-teal-50 border-teal-200 text-teal-700',
  filter: 'bg-orange-50 border-orange-200 text-orange-700',
  reduce: 'bg-purple-50 border-purple-200 text-purple-700',
  sort: 'bg-blue-50 border-blue-200 text-blue-700',
  format: 'bg-green-50 border-green-200 text-green-700',
  extract: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  merge: 'bg-pink-50 border-pink-200 text-pink-700'
};

export default function TransformNode({ data, selected }: NodeProps<TransformNodeData>) {
  const Icon = transformIcons[data.subtype] || Shuffle;
  const colorClass = transformColors[data.subtype] || transformColors.map;

  const hasScript = data.config.script && data.config.script.trim().length > 0;
  const hasTemplate = data.config.template && data.config.template.trim().length > 0;

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
          Transform
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {data.subtype}
        </Badge>
        {hasScript && (
          <Badge variant="outline" className="text-xs text-purple-600">
            Script
          </Badge>
        )}
        {hasTemplate && (
          <Badge variant="outline" className="text-xs text-blue-600">
            Template
          </Badge>
        )}
      </div>
      
      {/* Configuration Summary */}
      <div className="text-xs text-gray-600 space-y-1">
        {data.config.sourceField && (
          <div>
            Source: {data.config.sourceField}
          </div>
        )}
        
        {data.config.targetField && (
          <div>
            Target: {data.config.targetField}
          </div>
        )}
        
        {data.subtype === 'format' && data.config.parameters?.format && (
          <div>
            Format: {data.config.parameters.format}
          </div>
        )}
        
        {data.subtype === 'sort' && data.config.parameters?.field && (
          <div>
            Sort by: {data.config.parameters.field} ({data.config.parameters.order || 'asc'})
          </div>
        )}
        
        {data.subtype === 'merge' && data.config.parameters?.mergeWith && (
          <div>
            Merge with: {data.config.parameters.mergeWith}
          </div>
        )}
        
        {hasScript && (
          <div className="truncate" title={data.config.script}>
            Script: {data.config.script!.substring(0, 25)}...
          </div>
        )}
        
        {hasTemplate && (
          <div className="truncate" title={data.config.template}>
            Template: {data.config.template!.substring(0, 20)}...
          </div>
        )}
        
        {!data.config.sourceField && !hasScript && !hasTemplate && (
          <div className="text-gray-400 italic">
            No transformation configured
          </div>
        )}
      </div>
      
      {/* Validation Error */}
      {!data.isValid && (
        <div className="mt-2 text-xs text-red-600">
          Transform operation required
        </div>
      )}
      
      {/* Transform Indicator */}
      <div className="absolute top-2 right-2">
        <Shuffle className="h-4 w-4 text-teal-500" />
      </div>
      
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