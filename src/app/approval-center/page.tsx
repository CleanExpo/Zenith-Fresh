"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, Edit3, AlertCircle, Bot, MessageSquare, FileText, Image, Share2 } from 'lucide-react';

interface ApprovalRequest {
  id: string;
  missionId: string;
  mission: {
    id: string;
    goal: string;
    status: string;
    createdAt: string;
  };
  agentType: string;
  taskType: string;
  contentType: string;
  originalContent: any;
  editedContent?: any;
  status: string;
  priority: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  autoApprovalRule?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApprovalSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  editing: number;
  autoApproved: number;
}

export default function ApprovalCenterPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [summary, setSummary] = useState<ApprovalSummary>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    editing: 0,
    autoApproved: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');

  useEffect(() => {
    fetchApprovals();
  }, [selectedTab]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const status = selectedTab === 'all' ? 'all' : selectedTab.toUpperCase();
      const response = await fetch(`/api/approvals/pending?status=${status}`);
      const data = await response.json();
      
      if (response.ok) {
        setApprovals(data.approvals);
        setSummary(data.summary);
      } else {
        console.error('Failed to fetch approvals:', data.error);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      const response = await fetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchApprovals();
      }
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (approvalId: string, reason: string) => {
    try {
      const response = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, returnToAgent: true })
      });
      
      if (response.ok) {
        await fetchApprovals();
      }
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'ContentAgent': return <FileText className="h-4 w-4" />;
      case 'MediaAgent': return <Image className="h-4 w-4" />;
      case 'SocialMediaAgent': return <Share2 className="h-4 w-4" />;
      case 'CommunityManagerAgent': return <MessageSquare className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'EDITING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AUTO_APPROVED': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'NORMAL': return 'bg-blue-500';
      case 'LOW': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const renderContent = (approval: ApprovalRequest) => {
    const content = approval.editedContent || approval.originalContent;
    
    switch (approval.contentType) {
      case 'social_post':
        return (
          <div className="space-y-2">
            <p className="font-medium">{content.text}</p>
            {content.hashtags && (
              <div className="flex flex-wrap gap-1">
                {content.hashtags.map((tag: string, index: number) => (
                  <span key={index} className="text-blue-600 text-sm">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        );
      case 'blog_article':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{content.title}</h4>
            <p className="text-gray-600 text-sm">{content.excerpt}</p>
            <div className="text-xs text-gray-500">
              Word count: {content.wordCount} | Reading time: {content.readingTime}
            </div>
          </div>
        );
      case 'review_reply':
        return (
          <div className="space-y-2">
            <div className="bg-gray-50 p-2 rounded text-sm">
              <strong>Original Review:</strong> {content.originalReview}
            </div>
            <div>
              <strong>Reply:</strong> {content.reply}
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 p-3 rounded">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Approval Center</h1>
        <p className="text-gray-600">
          Review and approve content generated by your AI agents before it goes live.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{summary.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{summary.approved}</p>
                <p className="text-xs text-gray-500">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{summary.rejected}</p>
                <p className="text-xs text-gray-500">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{summary.editing}</p>
                <p className="text-xs text-gray-500">Editing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{summary.autoApproved}</p>
                <p className="text-xs text-gray-500">Auto-Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">Pending ({summary.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="editing">Editing</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading approvals...</p>
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No approvals found</h3>
              <p className="text-gray-600">There are no approvals with status &ldquo;{selectedTab}&rdquo; at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvals.map((approval) => (
                <Card key={approval.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getAgentIcon(approval.agentType)}
                          <div>
                            <CardTitle className="text-lg">{approval.agentType}</CardTitle>
                            <CardDescription className="flex items-center space-x-2">
                              <span>{approval.taskType}</span>
                              <span>•</span>
                              <span>{approval.contentType.replace('_', ' ')}</span>
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Priority Indicator */}
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(approval.priority)}`} 
                             title={`Priority: ${approval.priority}`} />
                        
                        {/* Status Badge */}
                        <Badge className={getStatusColor(approval.status)}>
                          {approval.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Mission Context */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Mission Goal:</p>
                        <p className="text-sm text-blue-700">{approval.mission.goal}</p>
                      </div>
                      
                      {/* Generated Content */}
                      <div>
                        <h4 className="font-medium mb-2">Generated Content:</h4>
                        {renderContent(approval)}
                      </div>
                      
                      {/* Action Buttons */}
                      {approval.status === 'PENDING' && (
                        <div className="flex space-x-2 pt-4 border-t">
                          <Button 
                            onClick={() => handleApprove(approval.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve & Publish
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => {/* TODO: Open edit modal */}}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Content
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => handleReject(approval.id, 'Content needs revision')}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {/* Timestamps */}
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        <div className="flex justify-between">
                          <span>Created: {new Date(approval.createdAt).toLocaleString()}</span>
                          {approval.approvedAt && (
                            <span>Approved: {new Date(approval.approvedAt).toLocaleString()}</span>
                          )}
                          {approval.rejectedAt && (
                            <span>Rejected: {new Date(approval.rejectedAt).toLocaleString()}</span>
                          )}
                        </div>
                        {approval.rejectionReason && (
                          <div className="mt-1">
                            <span className="font-medium">Rejection reason:</span> {approval.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
