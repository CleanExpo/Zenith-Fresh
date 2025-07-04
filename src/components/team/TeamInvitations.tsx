'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserPlus, 
  Mail, 
  Clock, 
  Trash2,
  Send,
  Copy,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { TeamInvitation } from './TeamDashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TeamInvitationsProps {
  teamId: string;
  canManage: boolean;
}

interface SendInvitationModalProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
}

function SendInvitationModal({ open, onClose, teamId }: SendInvitationModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('MEMBER');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const sendInvitationMutation = useMutation({
    mutationFn: (data: { email: string; role: string; message?: string }) =>
      api.post(`/api/teams/${teamId}/invitations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamInvitations', teamId] });
      toast.success('Invitation sent successfully');
      onClose();
      setEmail('');
      setRole('MEMBER');
      setMessage('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const payload: { email: string; role: string; message?: string } = {
      email: email.trim(),
      role
    };

    if (message.trim()) {
      payload.message = message.trim();
    }

    sendInvitationMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Team Invitation</DialogTitle>
          <DialogDescription>
            Invite someone to join your team via email.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">
                  <div className="flex flex-col">
                    <span>Viewer</span>
                    <span className="text-xs text-muted-foreground">Read-only access</span>
                  </div>
                </SelectItem>
                <SelectItem value="MEMBER">
                  <div className="flex flex-col">
                    <span>Member</span>
                    <span className="text-xs text-muted-foreground">Can create and edit</span>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex flex-col">
                    <span>Admin</span>
                    <span className="text-xs text-muted-foreground">Full management access</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={sendInvitationMutation.isPending || !email.trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {sendInvitationMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamInvitations({ teamId, canManage }: TeamInvitationsProps) {
  const [showSendModal, setShowSendModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery<TeamInvitation[]>({
    queryKey: ['teamInvitations', teamId],
    queryFn: () => api.get(`/api/teams/${teamId}/invitations`).then(res => res.invitations)
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) =>
      api.delete(`/api/teams/${teamId}/invitations/${invitationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamInvitations', teamId] });
      toast.success('Invitation cancelled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel invitation');
    }
  });

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invite?token=${token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy invite link');
    }
  };

  const handleCancelInvitation = (invitation: TeamInvitation) => {
    if (confirm(`Cancel invitation to ${invitation.email}?`)) {
      cancelInvitationMutation.mutate(invitation.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading invitations...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
              {invitations && invitations.length > 0 && (
                <Badge variant="secondary">{invitations.length}</Badge>
              )}
            </CardTitle>
            {canManage && (
              <Button
                onClick={() => setShowSendModal(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {invitations && invitations.length > 0 ? (
            <div className="space-y-3">
              {invitations.map((invitation) => {
                const isExpired = new Date(invitation.expiresAt) < new Date();
                
                return (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{invitation.email}</span>
                        <Badge variant="outline" className="capitalize">
                          {invitation.role.toLowerCase()}
                        </Badge>
                        {isExpired && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Invited by {invitation.inviter.name} on{' '}
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyInviteLink(invitation.id)} // Note: This should be the token, not ID
                              className="flex items-center gap-1"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy invite link</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {canManage && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelInvitation(invitation)}
                                className="flex items-center gap-1 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cancel invitation</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No pending invitations</h3>
              <p className="text-muted-foreground mb-4">
                Invite people to join your team
              </p>
              {canManage && (
                <Button onClick={() => setShowSendModal(true)} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Send Invitation
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <SendInvitationModal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        teamId={teamId}
      />
    </>
  );
}