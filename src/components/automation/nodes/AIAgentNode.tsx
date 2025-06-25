/**
 * AI Agent Node Component
 * Custom React Flow node for AI agent tasks
 */

'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bot, Brain, MessageCircle, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AIAgentNodeData {
  label: string;
  subtype: 'content' | 'analysis' | 'support' | 'custom';
  config: {
    agentId?: string;
    task?: string;
    model?: string;
    temperature?: number;
    input?: any;
  };
  isValid: boolean;
}

const agentIcons = {
  content: MessageCircle,
  analysis: Search,
  support: MessageCircle,
  custom: Bot
};

const agentColors = {
  content: 'bg-purple-50 border-purple-200 text-purple-700',
  analysis: 'bg-blue-50 border-blue-200 text-blue-700',
  support: 'bg-green-50 border-green-200 text-green-700',
  custom: 'bg-gray-50 border-gray-200 text-gray-700'
};

export default function AIAgentNode({ data, selected }: NodeProps<AIAgentNodeData>) {
  const Icon = agentIcons[data.subtype] || Bot;
  const colorClass = agentColors[data.subtype] || agentColors.custom;

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
        <Icon className="h-5 w-5" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      
      {/* Status Badges */}
      <div className="flex items-center space-x-2 mb-3">
        <Badge variant="outline" className="text-xs">
          AI Agent
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {data.subtype}
        </Badge>
      </div>
      
      {/* Configuration Summary */}
      <div className="text-xs text-gray-600 space-y-1">
        {data.config.agentId && (
          <div>Agent: {data.config.agentId.substring(0, 8)}...</div>
        )}
        {data.config.model && (
          <div>Model: {data.config.model}</div>
        )}
        {data.config.temperature !== undefined && (
          <div>Temperature: {data.config.temperature}</div>
        )}
        {data.config.task && (
          <div className="truncate" title={data.config.task}>
            Task: {data.config.task.substring(0, 40)}...
          </div>
        )}
      </div>
      
      {/* Validation Error */}
      {!data.isValid && (
        <div className="mt-2 text-xs text-red-600">
          Agent configuration required
        </div>
      )}
      
      {/* Special AI Indicator */}
      <div className="absolute top-2 right-2">
        <Brain className="h-4 w-4 text-purple-500 animate-pulse" />
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