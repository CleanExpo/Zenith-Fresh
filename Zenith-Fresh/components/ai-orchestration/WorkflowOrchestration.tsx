"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Edit, 
  Trash, 
  Settings, 
  GitBranch,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Database,
  MessageSquare,
  Code,
  FileText,
  Bot,
  Workflow
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'model' | 'transform' | 'output';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: any;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

interface AIWorkflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft' | 'error';
  version: string;
  definition: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  totalExecutions: number;
  successfulRuns: number;
  failedRuns: number;
  averageRuntime: number;
  triggerType?: 'manual' | 'scheduled' | 'webhook' | 'event';
  triggerConfig?: any;
  agentId: string;
}

const nodeTypes = {
  trigger: { icon: Zap, color: 'bg-yellow-500', label: 'Trigger' },
  action: { icon: Play, color: 'bg-blue-500', label: 'Action' },
  condition: { icon: GitBranch, color: 'bg-purple-500', label: 'Condition' },
  model: { icon: Bot, color: 'bg-green-500', label: 'AI Model' },
  transform: { icon: Code, color: 'bg-orange-500', label: 'Transform' },
  output: { icon: Database, color: 'bg-gray-500', label: 'Output' }
};

export default function WorkflowOrchestration() {
  const [workflows, setWorkflows] = useState<AIWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AIWorkflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/ai-orchestration/workflows');
      const data = await response.json();
      setWorkflows(data.workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const createNewWorkflow = () => {
    const newWorkflow: AIWorkflow = {
      id: `workflow-${Date.now()}`,
      name: 'New Workflow',
      description: 'Describe your workflow',
      status: 'draft',
      version: '1.0.0',
      definition: {
        nodes: [],
        edges: []
      },
      totalExecutions: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageRuntime: 0,
      agentId: 'default-agent'
    };
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
  };

  const addNode = useCallback((type: WorkflowNode['type'], position?: { x: number; y: number }) => {
    if (!selectedWorkflow || !isEditing) return;

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      position: position || { x: 200, y: 100 },
      data: {
        label: nodeTypes[type].label,
        description: `New ${nodeTypes[type].label} node`,
        config: {}
      }
    };

    setSelectedWorkflow(prev => ({
      ...prev!,
      definition: {
        ...prev!.definition,
        nodes: [...prev!.definition.nodes, newNode]
      }
    }));
  }, [selectedWorkflow, isEditing]);

  const connectNodes = useCallback((sourceId: string, targetId: string) => {
    if (!selectedWorkflow || !isEditing) return;

    const newEdge: WorkflowEdge = {
      id: `edge-${Date.now()}`,
      source: sourceId,
      target: targetId
    };

    setSelectedWorkflow(prev => ({
      ...prev!,
      definition: {
        ...prev!.definition,
        edges: [...prev!.definition.edges, newEdge]
      }
    }));
    setConnecting(null);
  }, [selectedWorkflow, isEditing]);

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/workflows/${workflowId}/execute`, {
        method: 'POST'
      });
      const result = await response.json();
      console.log('Workflow execution result:', result);
      fetchWorkflows(); // Refresh to get updated execution stats
    } catch (error) {
      console.error('Error executing workflow:', error);
    }
  };

  const saveWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      const response = await fetch('/api/ai-orchestration/workflows', {
        method: selectedWorkflow.id.startsWith('workflow-') ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedWorkflow)
      });

      if (response.ok) {
        fetchWorkflows();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Orchestration</h1>
          <p className="text-muted-foreground">Design and manage AI workflow automations</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={createNewWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-background/50 p-4 space-y-4">
          {/* Workflows List */}
          <div>
            <h3 className="font-semibold mb-3">Workflows</h3>
            <div className="space-y-2">
              {workflows.map((workflow) => (
                <Card 
                  key={workflow.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedWorkflow?.id === workflow.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{workflow.name}</CardTitle>
                      <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                        {workflow.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Runs: {workflow.totalExecutions}</span>
                      <span>Success: {workflow.successfulRuns}</span>
                    </div>
                    <div className="mt-2 w-full bg-secondary rounded-full h-1">
                      <div 
                        className="bg-primary h-1 rounded-full transition-all"
                        style={{ 
                          width: workflow.totalExecutions > 0 
                            ? `${(workflow.successfulRuns / workflow.totalExecutions) * 100}%` 
                            : '0%' 
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Node Palette */}
          {isEditing && (
            <div>
              <h3 className="font-semibold mb-3">Add Nodes</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(nodeTypes).map(([type, config]) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className="h-16 flex flex-col space-y-1"
                    onClick={() => addNode(type as WorkflowNode['type'])}
                  >
                    <config.icon className="h-4 w-4" />
                    <span className="text-xs">{config.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {selectedWorkflow ? (
            <>
              {/* Workflow Header */}
              <div className="p-4 border-b bg-background/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedWorkflow.name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
                    </div>
                    <Badge variant={selectedWorkflow.status === 'active' ? 'default' : 'secondary'}>
                      {selectedWorkflow.status}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveWorkflow}>
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button onClick={() => executeWorkflow(selectedWorkflow.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          Execute
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex space-x-6 mt-4 text-sm text-muted-foreground">
                  <div>Total Runs: <span className="font-medium">{selectedWorkflow.totalExecutions}</span></div>
                  <div>Success Rate: <span className="font-medium">
                    {selectedWorkflow.totalExecutions > 0 
                      ? `${((selectedWorkflow.successfulRuns / selectedWorkflow.totalExecutions) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span></div>
                  <div>Avg Runtime: <span className="font-medium">{selectedWorkflow.averageRuntime}ms</span></div>
                </div>
              </div>

              {/* Canvas */}
              <div 
                ref={canvasRef}
                className="flex-1 relative overflow-hidden bg-gradient-to-br from-background to-muted/20"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
                  backgroundSize: '20px 20px'
                }}
              >
                <WorkflowCanvas
                  workflow={selectedWorkflow}
                  isEditing={isEditing}
                  connecting={connecting}
                  onConnect={connectNodes}
                  onNodeEdit={setEditingNode}
                  onStartConnection={setConnecting}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Workflow className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No workflow selected</h3>
                  <p className="text-muted-foreground">Select a workflow from the sidebar or create a new one</p>
                </div>
                <Button onClick={createNewWorkflow}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Workflow
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Editor Dialog */}
      {editingNode && (
        <NodeEditor
          node={editingNode}
          isOpen={!!editingNode}
          onClose={() => setEditingNode(null)}
          onSave={(updatedNode) => {
            if (selectedWorkflow) {
              setSelectedWorkflow(prev => ({
                ...prev!,
                definition: {
                  ...prev!.definition,
                  nodes: prev!.definition.nodes.map(node => 
                    node.id === updatedNode.id ? updatedNode : node
                  )
                }
              }));
            }
            setEditingNode(null);
          }}
        />
      )}
    </div>
  );
}

function WorkflowCanvas({ 
  workflow, 
  isEditing, 
  connecting, 
  onConnect, 
  onNodeEdit, 
  onStartConnection 
}: {
  workflow: AIWorkflow;
  isEditing: boolean;
  connecting: string | null;
  onConnect: (source: string, target: string) => void;
  onNodeEdit: (node: WorkflowNode) => void;
  onStartConnection: (nodeId: string) => void;
}) {
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (!isEditing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode || !isEditing) return;
    
    const canvas = e.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    // Update node position (this would need to be passed back to parent)
  };

  return (
    <div 
      className="w-full h-full relative"
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDraggedNode(null)}
    >
      {/* Render Edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {workflow.definition.edges.map((edge) => {
          const sourceNode = workflow.definition.nodes.find(n => n.id === edge.source);
          const targetNode = workflow.definition.nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;
          
          const sourceX = sourceNode.position.x + 100; // Node width / 2
          const sourceY = sourceNode.position.y + 30;  // Node height / 2
          const targetX = targetNode.position.x + 100;
          const targetY = targetNode.position.y + 30;
          
          return (
            <g key={edge.id}>
              <path
                d={`M ${sourceX} ${sourceY} Q ${(sourceX + targetX) / 2} ${sourceY - 50} ${targetX} ${targetY}`}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        })}
        
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="hsl(var(--primary))"
            />
          </marker>
        </defs>
      </svg>

      {/* Render Nodes */}
      {workflow.definition.nodes.map((node) => {
        const NodeIcon = nodeTypes[node.type].icon;
        
        return (
          <motion.div
            key={node.id}
            className={`absolute w-48 bg-background border-2 rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl ${
              connecting === node.id ? 'ring-2 ring-primary' : ''
            }`}
            style={{
              left: node.position.x,
              top: node.position.y
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onClick={() => {
              if (connecting && connecting !== node.id) {
                onConnect(connecting, node.id);
              } else if (isEditing) {
                onNodeEdit(node);
              }
            }}
          >
            <div className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`p-1 rounded ${nodeTypes[node.type].color} text-white`}>
                  <NodeIcon className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium">{node.data.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{node.data.description}</p>
            </div>
            
            {/* Connection Points */}
            {isEditing && (
              <>
                <div 
                  className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary rounded-full cursor-pointer opacity-75 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartConnection(node.id);
                  }}
                />
                <div 
                  className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary rounded-full cursor-pointer opacity-75 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (connecting) {
                      onConnect(connecting, node.id);
                    }
                  }}
                />
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function NodeEditor({ node, isOpen, onClose, onSave }: {
  node: WorkflowNode;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: WorkflowNode) => void;
}) {
  const [editedNode, setEditedNode] = useState<WorkflowNode>(node);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {nodeTypes[node.type].label} Node</DialogTitle>
          <DialogDescription>
            Configure the node properties and behavior
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={editedNode.data.label}
              onChange={(e) => setEditedNode(prev => ({
                ...prev,
                data: { ...prev.data, label: e.target.value }
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedNode.data.description || ''}
              onChange={(e) => setEditedNode(prev => ({
                ...prev,
                data: { ...prev.data, description: e.target.value }
              }))}
            />
          </div>

          {/* Node-specific configuration */}
          {node.type === 'model' && (
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select
                value={editedNode.data.config?.modelId || ''}
                onValueChange={(value) => setEditedNode(prev => ({
                  ...prev,
                  data: { 
                    ...prev.data, 
                    config: { ...prev.data.config, modelId: value }
                  }
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {node.type === 'trigger' && (
            <div className="space-y-2">
              <Label htmlFor="triggerType">Trigger Type</Label>
              <Select
                value={editedNode.data.config?.triggerType || 'manual'}
                onValueChange={(value) => setEditedNode(prev => ({
                  ...prev,
                  data: { 
                    ...prev.data, 
                    config: { ...prev.data.config, triggerType: value }
                  }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editedNode)}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}