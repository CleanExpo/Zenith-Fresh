/**
 * Email Node Component
 * Custom React Flow node for email sending
 */

'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Mail, Users, FileText, Paperclip } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmailNodeData {
  label: string;
  subtype: 'send';
  config: {
    to: string | string[];
    from?: string;
    subject: string;
    content: string;
    contentType?: 'text' | 'html';
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
      filename: string;
      content: string;
      contentType: string;
    }>;
  };
  isValid: boolean;
}

export default function EmailNode({ data, selected }: NodeProps<EmailNodeData>) {
  const colorClass = 'bg-cyan-50 border-cyan-200 text-cyan-700';

  const recipientCount = Array.isArray(data.config.to) 
    ? data.config.to.length 
    : data.config.to ? 1 : 0;
  
  const hasAttachments = data.config.attachments && data.config.attachments.length > 0;
  const isHTML = data.config.contentType === 'html';

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
        <Mail className="h-5 w-5" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      
      {/* Status Badges */}
      <div className="flex items-center space-x-2 mb-3">
        <Badge variant="outline" className="text-xs">
          Email
        </Badge>
        {recipientCount > 1 && (
          <Badge variant="outline" className="text-xs">
            {recipientCount} recipients
          </Badge>
        )}
        {isHTML && (
          <Badge variant="outline" className="text-xs">
            HTML
          </Badge>
        )}
        {hasAttachments && (
          <Badge variant="outline" className="text-xs">
            Attachments
          </Badge>
        )}
      </div>
      
      {/* Configuration Summary */}
      <div className="text-xs text-gray-600 space-y-1">
        {data.config.to ? (
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span className="truncate">
              To: {Array.isArray(data.config.to) 
                ? data.config.to[0] + (data.config.to.length > 1 ? ` +${data.config.to.length - 1}` : '')
                : data.config.to
              }
            </span>
          </div>
        ) : (
          <div className="text-gray-400 italic">No recipients</div>
        )}
        
        {data.config.subject && (
          <div className="truncate" title={data.config.subject}>
            Subject: {data.config.subject.substring(0, 30)}...
          </div>
        )}
        
        {data.config.content && (
          <div className="flex items-center space-x-1">
            <FileText className="h-3 w-3" />
            <span>
              {data.config.content.length} chars
            </span>
          </div>
        )}
        
        {hasAttachments && (
          <div className="flex items-center space-x-1">
            <Paperclip className="h-3 w-3" />
            <span>
              {data.config.attachments?.length} file{data.config.attachments?.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      {/* Validation Error */}
      {!data.isValid && (
        <div className="mt-2 text-xs text-red-600">
          Recipients, subject, and content required
        </div>
      )}
      
      {/* Mail Indicator */}
      <div className="absolute top-2 right-2">
        <Mail className="h-4 w-4 text-cyan-500" />
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