/**
 * Visual Workflow Builder
 * React Flow based drag-and-drop workflow editor
 */

'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Connection,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  ReactFlowInstance,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Save, Download, Upload, Settings, Zap, Database, Mail, Globe, Clock, Bot } from 'lucide-react';

// Import custom node components
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import AIAgentNode from './nodes/AIAgentNode';
import APICallNode from './nodes/APICallNode';
import EmailNode from './nodes/EmailNode';
import DelayNode from './nodes/DelayNode';
import TransformNode from './nodes/TransformNode';

// Node Types Registry
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  aiAgent: AIAgentNode,
  apiCall: APICallNode,
  email: EmailNode,
  delay: DelayNode,
  transform: TransformNode
};

// Custom Edge Component
const customEdgeTypes: EdgeTypes = {
  // Add custom edge types if needed
};

// Node Categories for the Palette
const nodeCategories = [
  {
    name: 'Triggers',
    icon: Zap,
    nodes: [
      { type: 'trigger', subtype: 'manual', label: 'Manual Trigger', icon: '🚀' },
      { type: 'trigger', subtype: 'webhook', label: 'Webhook', icon: '🔗' },
      { type: 'trigger', subtype: 'schedule', label: 'Schedule', icon: '⏰' },
      { type: 'trigger', subtype: 'api_call', label: 'API Call', icon: '📡' }
    ]
  },
  {
    name: 'AI & ML',
    icon: Bot,
    nodes: [
      { type: 'aiAgent', subtype: 'content', label: 'Content Agent', icon: '✍️' },
      { type: 'aiAgent', subtype: 'analysis', label: 'Analysis Agent', icon: '🔍' },
      { type: 'aiAgent', subtype: 'support', label: 'Support Agent', icon: '🎧' },
      { type: 'aiAgent', subtype: 'custom', label: 'Custom Agent', icon: '🤖' }
    ]
  },
  {
    name: 'Actions',
    icon: Settings,
    nodes: [
      { type: 'action', subtype: 'log', label: 'Log Message', icon: '📝' },
      { type: 'action', subtype: 'set_variable', label: 'Set Variable', icon: '📦' },
      { type: 'action', subtype: 'calculate', label: 'Calculate', icon: '🧮' },
      { type: 'action', subtype: 'format', label: 'Format Data', icon: '🎨' }
    ]
  },
  {
    name: 'Logic',
    icon: Database,
    nodes: [
      { type: 'condition', subtype: 'if', label: 'If Condition', icon: '❓' },
      { type: 'condition', subtype: 'switch', label: 'Switch', icon: '🔀' },
      { type: 'transform', subtype: 'map', label: 'Map Data', icon: '🗺️' },
      { type: 'transform', subtype: 'filter', label: 'Filter Data', icon: '🔍' }
    ]
  },
  {
    name: 'Integration',
    icon: Globe,
    nodes: [
      { type: 'apiCall', subtype: 'get', label: 'API GET', icon: '⬇️' },
      { type: 'apiCall', subtype: 'post', label: 'API POST', icon: '⬆️' },
      { type: 'email', subtype: 'send', label: 'Send Email', icon: '📧' },
      { type: 'webhook', subtype: 'send', label: 'Send Webhook', icon: '📡' }
    ]
  },
  {
    name: 'Utility',
    icon: Clock,
    nodes: [
      { type: 'delay', subtype: 'wait', label: 'Delay', icon: '⏱️' },
      { type: 'transform', subtype: 'format', label: 'Format', icon: '🔧' },
      { type: 'action', subtype: 'notification', label: 'Notification', icon: '🔔' }
    ]
  }
];

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (workflow: { nodes: Node[]; edges: Edge[]; config: any }) => void;
  onExecute?: (workflow: { nodes: Node[]; edges: Edge[] }) => void;
  readonly?: boolean;
}

export default function WorkflowBuilder({
  workflowId,
  onSave,
  onExecute,
  readonly = false
}: WorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);

  // Load workflow if workflowId is provided
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId]);

  const loadWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/automation/workflows/${id}`);
      const workflow = await response.json();
      
      setNodes(workflow.nodes || []);
      setEdges(workflow.edges || []);
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeData = event.dataTransfer.getData('application/reactflow');

      if (!nodeData || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      const { type, subtype, label } = JSON.parse(nodeData);
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label,
          subtype,
          config: getDefaultNodeConfig(type, subtype),
          isValid: true
        },
        dragHandle: '.drag-handle'
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const getDefaultNodeConfig = (type: string, subtype: string) => {
    const defaults: Record<string, any> = {
      trigger: {
        manual: { type: 'manual', data: {} },
        webhook: { type: 'webhook', url: '', secret: '' },
        schedule: { type: 'schedule', cron: '0 9 * * *', timezone: 'UTC' },
        api_call: { type: 'api_call', interval: 300 }
      },
      aiAgent: {
        content: { agentId: '', task: 'Create content based on input', input: {} },
        analysis: { agentId: '', task: 'Analyze the provided data', input: {} },
        support: { agentId: '', task: 'Provide customer support response', input: {} },
        custom: { agentId: '', task: '', input: {} }
      },
      action: {
        log: { action: 'log', parameters: { message: 'Action executed', level: 'info' } },
        set_variable: { action: 'set_variable', parameters: { name: 'variable', value: '' } },
        calculate: { action: 'calculate', parameters: { expression: '1 + 1' } },
        format: { action: 'format_string', parameters: { template: 'Hello {{name}}' } }
      },
      condition: {
        if: { conditions: [{ field: 'value', operator: 'equals', value: 'true' }] },
        switch: { conditions: [{ field: 'status', operator: 'equals', value: 'active' }] }
      },
      apiCall: {
        get: { url: '', method: 'GET', headers: {} },
        post: { url: '', method: 'POST', headers: {}, body: {} }
      },
      email: {
        send: { to: '', subject: 'Workflow Notification', content: 'Hello from workflow!', contentType: 'text' }
      },
      delay: {
        wait: { duration: 5, unit: 'seconds' }
      },
      transform: {
        map: { operation: 'map', template: '{{item}}' },
        filter: { operation: 'filter', script: 'item.status === "active"' },
        format: { operation: 'format', parameters: { format: 'json' } }
      }
    };

    return defaults[type]?.[subtype] || {};
  };

  const handleSave = async () => {
    if (!onSave) return;

    const workflow = {
      nodes,
      edges,
      config: {
        timeout: 300000,
        retryPolicy: { maxRetries: 3, backoffType: 'exponential', backoffDelay: 1000 },
        errorHandling: 'stop'
      }
    };

    onSave(workflow);
  };

  const handleExecute = async () => {
    if (!onExecute || isExecuting) return;

    setIsExecuting(true);
    setExecutionLogs([]);

    try {
      await onExecute({ nodes, edges });
    } catch (error) {
      console.error('Workflow execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleNodeUpdate = (nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  };

  const exportWorkflow = () => {
    const workflow = { nodes, edges };
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'workflow.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
      } catch (error) {
        console.error('Failed to import workflow:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Node Palette */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Workflow Nodes</h2>
          <p className="text-sm text-gray-500 mt-1">Drag nodes to the canvas to build your workflow</p>
        </div>
        
        <Tabs defaultValue={nodeCategories[0].name} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 m-2">
            {nodeCategories.slice(0, 3).map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger
                  key={category.name}
                  value={category.name}
                  className="flex flex-col gap-1 py-2 text-xs"
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {nodeCategories.map((category) => (
            <TabsContent key={category.name} value={category.name} className="p-4 space-y-2">
              {category.nodes.map((node) => (
                <NodePaletteItem key={`${node.type}-${node.subtype}`} node={node} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleExecute}
                disabled={isExecuting || readonly}
                variant="default"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                {isExecuting ? 'Executing...' : 'Run Workflow'}
              </Button>
              
              {!readonly && (
                <Button onClick={handleSave} variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={exportWorkflow} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              {!readonly && (
                <label>
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importWorkflow}
                    className="hidden"
                  />
                </label>
              )}

              <Badge variant="outline" className="ml-4">
                {nodes.length} nodes, {edges.length} connections
              </Badge>
            </div>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={customEdgeTypes}
            fitView
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Shift"
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
            
            <Panel position="top-right">
              <Card className="p-4 bg-white/90 backdrop-blur">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Execution Status</div>
                  {isExecuting && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-sm text-blue-600">Running...</span>
                    </div>
                  )}
                  {!isExecuting && nodes.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-green-600">Ready</span>
                    </div>
                  )}
                </div>
              </Card>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Panel */}
      {selectedNode && !readonly && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={(updates) => handleNodeUpdate(selectedNode.id, updates)}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

// Node Palette Item Component
function NodePaletteItem({ node }: { node: any }) {
  const onDragStart = (event: React.DragEvent, node: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card
      className="p-3 cursor-grab hover:bg-gray-50 border border-gray-200"
      draggable
      onDragStart={(event) => onDragStart(event, node)}
    >
      <div className="flex items-center space-x-3">
        <span className="text-lg">{node.icon}</span>
        <div>
          <div className="text-sm font-medium text-gray-900">{node.label}</div>
          <div className="text-xs text-gray-500 capitalize">{node.type}</div>
        </div>
      </div>
    </Card>
  );
}

// Node Configuration Panel Component
function NodeConfigPanel({ 
  node, 
  onUpdate, 
  onClose 
}: { 
  node: Node; 
  onUpdate: (updates: any) => void; 
  onClose: () => void; 
}) {
  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Configure Node</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-1">{node.data.label}</p>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Node Name
            </label>
            <input
              type="text"
              value={node.data.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Add specific configuration forms for each node type */}
          <div className="text-sm text-gray-500">
            Configuration options for {node.type} nodes will be implemented here.
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component with ReactFlowProvider
export function WorkflowBuilderWrapper(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder {...props} />
    </ReactFlowProvider>
  );
}