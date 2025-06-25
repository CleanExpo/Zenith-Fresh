/**
 * API Call Node Component
 * Custom React Flow node for HTTP API calls
 */

'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Globe, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface APICallNodeData {
  label: string;
  subtype: 'get' | 'post' | 'put' | 'patch' | 'delete';
  config: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
  };
  isValid: boolean;
}

const methodIcons = {
  get: ArrowDown,
  post: ArrowUp,
  put: RefreshCw,
  patch: RefreshCw,
  delete: RefreshCw
};

const methodColors = {
  get: 'bg-blue-50 border-blue-200 text-blue-700',
  post: 'bg-green-50 border-green-200 text-green-700',
  put: 'bg-orange-50 border-orange-200 text-orange-700',
  patch: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  delete: 'bg-red-50 border-red-200 text-red-700'
};

export default function APICallNode({ data, selected }: NodeProps<APICallNodeData>) {
  const MethodIcon = methodIcons[data.subtype] || Globe;
  const colorClass = methodColors[data.subtype] || methodColors.get;

  const hasAuth = data.config.headers && (
    data.config.headers['Authorization'] || 
    data.config.headers['X-API-Key'] ||
    Object.keys(data.config.headers).some(key => key.toLowerCase().includes('auth'))
  );

  return (
    <Card 
      className={`p-4 min-w-56 transition-all duration-200 ${colorClass} ${
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
        <MethodIcon className="h-5 w-5" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      
      {/* Status Badges */}
      <div className="flex items-center space-x-2 mb-3">
        <Badge variant="outline" className="text-xs">
          API Call
        </Badge>
        <Badge variant="outline" className="text-xs uppercase">
          {data.config.method || data.subtype}
        </Badge>
        {hasAuth && (
          <Badge variant="outline" className="text-xs text-green-600">
            Auth
          </Badge>
        )}
      </div>
      
      {/* Configuration Summary */}
      <div className="text-xs text-gray-600 space-y-1">
        {data.config.url ? (
          <div className="truncate" title={data.config.url}>
            URL: {data.config.url.substring(0, 35)}...
          </div>
        ) : (
          <div className="text-gray-400 italic">No URL configured</div>
        )}
        
        {data.config.timeout && (
          <div>Timeout: {data.config.timeout}ms</div>
        )}
        
        {data.config.headers && Object.keys(data.config.headers).length > 0 && (
          <div>Headers: {Object.keys(data.config.headers).length} items</div>
        )}
        
        {data.config.body && data.subtype !== 'get' && (
          <div>Body: {typeof data.config.body === 'object' ? 'JSON' : 'Text'}</div>
        )}
      </div>
      
      {/* Validation Error */}
      {!data.isValid && (
        <div className="mt-2 text-xs text-red-600">
          URL is required
        </div>
      )}
      
      {/* Globe Indicator */}
      <div className="absolute top-2 right-2">
        <Globe className="h-4 w-4 text-blue-500" />
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-blue-500 border-2 border-white shadow-md"
      />
      
      {/* Error Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="error"
        className="w-3 h-3 bg-red-500 border-2 border-white shadow-md"
      />
      
      {/* Error Label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium">
        Error
      </div>
    </Card>
  );
}