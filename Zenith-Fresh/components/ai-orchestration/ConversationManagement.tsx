"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare,
  Send,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Clock,
  User,
  Bot,
  Archive,
  Star,
  Trash,
  Download,
  Share,
  Settings,
  Brain,
  Zap,
  DollarSign,
  Activity,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Conversation {
  id: string;
  title?: string;
  agentId: string;
  agentName: string;
  modelId: string;
  modelName: string;
  userId?: string;
  userName?: string;
  sessionId: string;
  status: 'active' | 'archived' | 'error';
  contextLength: number;
  maxContextLength: number;
  contextStrategy: 'sliding' | 'summary' | 'truncate';
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  tokenCount: number;
  latency?: number;
  cost?: number;
  functionCall?: any;
  functionResult?: any;
  qualityScore?: number;
  feedbackRating?: number;
  createdAt: Date;
}

interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  averageLatency: number;
  totalCost: number;
  averageQuality: number;
}

export default function ConversationManagement() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<ConversationStats>({
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
    averageLatency: 0,
    totalCost: 0,
    averageQuality: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/ai-orchestration/conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/conversations/${conversationId}/messages`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ai-orchestration/conversations/stats');
      const data = await response.json();
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isLoading) return;

    setIsLoading(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      const response = await fetch(`/api/ai-orchestration/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: messageContent,
          role: 'user'
        })
      });

      if (response.ok) {
        await fetchMessages(selectedConversation.id);
        await fetchConversations(); // Update conversation stats
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/ai-orchestration/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Conversation',
          agentId: 'default-agent', // Would be selected from available agents
          modelId: 'default-model'   // Would be selected from available models
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      });

      if (response.ok) {
        fetchConversations();
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
        }
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  const rateMessage = async (messageId: string, rating: number) => {
    try {
      const response = await fetch(`/api/ai-orchestration/messages/${messageId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackRating: rating })
      });

      if (response.ok && selectedConversation) {
        fetchMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error rating message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.modelName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversation Management</h1>
          <p className="text-muted-foreground">Monitor and manage AI conversations</p>
        </div>
        <Button onClick={createNewConversation}>
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6 p-6 border-b">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageLatency}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(3)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.averageQuality * 100).toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r flex flex-col">
          {/* Search and Filter */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conversations</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onSelect={setSelectedConversation}
                  onArchive={archiveConversation}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-background/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedConversation.title || 'Untitled Conversation'}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Agent: {selectedConversation.agentName}</span>
                      <span>Model: {selectedConversation.modelName}</span>
                      <span>Messages: {selectedConversation.totalMessages}</span>
                      <span>Cost: ${selectedConversation.totalCost.toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => archiveConversation(selectedConversation.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Context Length Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <span>Context Usage</span>
                    <span>{selectedConversation.contextLength} / {selectedConversation.maxContextLength}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(selectedConversation.contextLength / selectedConversation.maxContextLength) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageCard
                      key={message.id}
                      message={message}
                      onRate={rateMessage}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 min-h-[60px] max-h-[120px]"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    size="sm"
                    className="px-6"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No conversation selected</h3>
                  <p className="text-muted-foreground">Choose a conversation from the sidebar or create a new one</p>
                </div>
                <Button onClick={createNewConversation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationCard({ conversation, isSelected, onSelect, onArchive }: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversation: Conversation) => void;
  onArchive: (id: string) => void;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect(conversation)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">
            {conversation.title || 'Untitled Conversation'}
          </CardTitle>
          <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
            {conversation.status}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {conversation.agentName} • {conversation.modelName}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>{conversation.totalMessages} messages</span>
          <span>${conversation.totalCost.toFixed(4)}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {conversation.lastMessageAt 
            ? `Last: ${new Date(conversation.lastMessageAt).toLocaleDateString()}`
            : `Created: ${new Date(conversation.createdAt).toLocaleDateString()}`
          }
        </div>
      </CardContent>
    </Card>
  );
}

function MessageCard({ message, onRate }: {
  message: Message;
  onRate: (messageId: string, rating: number) => void;
}) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[70%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Message Header */}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {isUser ? (
            <>
              <User className="h-3 w-3" />
              <span>You</span>
            </>
          ) : isSystem ? (
            <>
              <Settings className="h-3 w-3" />
              <span>System</span>
            </>
          ) : (
            <>
              <Bot className="h-3 w-3" />
              <span>Assistant</span>
            </>
          )}
          <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
          {message.latency && <span>({message.latency}ms)</span>}
          {message.cost && <span>${message.cost.toFixed(4)}</span>}
        </div>

        {/* Message Content */}
        <div className={`
          p-3 rounded-lg max-w-full break-words
          ${isUser 
            ? 'bg-primary text-primary-foreground' 
            : isSystem
            ? 'bg-muted text-muted-foreground border'
            : 'bg-background border'
          }
        `}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {/* Function Call Display */}
          {message.functionCall && (
            <div className="mt-2 p-2 bg-secondary/50 rounded text-xs">
              <strong>Function Call:</strong> {message.functionCall.name}
              <pre className="mt-1 overflow-x-auto">{JSON.stringify(message.functionCall.arguments, null, 2)}</pre>
            </div>
          )}

          {/* Function Result Display */}
          {message.functionResult && (
            <div className="mt-2 p-2 bg-secondary/50 rounded text-xs">
              <strong>Function Result:</strong>
              <pre className="mt-1 overflow-x-auto">{JSON.stringify(message.functionResult, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Message Actions */}
        {!isUser && !isSystem && (
          <div className="flex items-center space-x-2">
            {/* Quality Score */}
            {message.qualityScore && (
              <Badge variant="outline" className="text-xs">
                Quality: {(message.qualityScore * 100).toFixed(0)}%
              </Badge>
            )}

            {/* Token Count */}
            <Badge variant="outline" className="text-xs">
              {message.tokenCount} tokens
            </Badge>

            {/* Rating */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${message.feedbackRating === 1 ? 'text-green-500' : ''}`}
                onClick={() => onRate(message.id, 1)}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${message.feedbackRating === -1 ? 'text-red-500' : ''}`}
                onClick={() => onRate(message.id, -1)}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>

            {/* Copy */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => navigator.clipboard.writeText(message.content)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}