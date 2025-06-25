'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  MoreHorizontal,
  Crown,
  Shield,
  User,
  Eye,
  Mail,
  Calendar,
  Activity,
  Trash2,
  Edit
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { TeamMember } from './TeamDashboard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TeamMembersProps {
  teamId: string;
  canManage: boolean;
}

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
}

interface UpdateRoleModalProps {
  open: boolean;
  onClose: () => void;
  member: TeamMember;
  teamId: string;
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye
};

const roleColors = {
  OWNER: 'text-yellow-600',
  ADMIN: 'text-blue-600',
  MEMBER: 'text-green-600',
  VIEWER: 'text-gray-600'
};

function AddMemberModal({ open, onClose, teamId }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('MEMBER');
  const queryClient = useQueryClient();

  const addMemberMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      api.post(`/api/teams/${teamId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
      toast.success('Member added successfully');
      onClose();
      setEmail('');
      setRole('MEMBER');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add member');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    addMemberMutation.mutate({ email: email.trim(), role });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add an existing user to your team by their email address.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">Viewer</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addMemberMutation.isPending || !email.trim()}
            >
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UpdateRoleModal({ open, onClose, member, teamId }: UpdateRoleModalProps) {
  const [role, setRole] = useState(member.role);
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: (newRole: string) =>
      api.put(`/api/teams/${teamId}/members/${member.id}`, { role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
      toast.success('Member role updated');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === member.role) {
      onClose();
      return;
    }

    updateRoleMutation.mutate(role);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Member Role</DialogTitle>
          <DialogDescription>
            Change the role for {member.user.name} ({member.user.email})
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">Viewer</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateRoleMutation.isPending || role === member.role}
            >
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamMembers({ teamId, canManage }: TeamMembersProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showUpdateRoleModal, setShowUpdateRoleModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery<TeamMember[]>({
    queryKey: ['teamMembers', teamId],
    queryFn: () => api.get(`/api/teams/${teamId}/members`).then(res => res.members)
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/api/teams/${teamId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
      toast.success('Member removed from team');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  });

  const handleRemoveMember = (member: TeamMember) => {
    if (confirm(`Are you sure you want to remove ${member.user.name} from the team?`)) {
      removeMemberMutation.mutate(member.id);
    }
  };

  const handleUpdateRole = (member: TeamMember) => {
    setSelectedMember(member);
    setShowUpdateRoleModal(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading members...</div>
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
              <Users className="h-5 w-5" />
              Team Members ({members?.length || 0})
            </CardTitle>
            {canManage && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
            <div className="space-y-4">
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role as keyof typeof roleIcons];
                const roleColor = roleColors[member.role as keyof typeof roleColors];

                return (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {member.user.image ? (
                          <img 
                            src={member.user.image} 
                            alt={member.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {member.user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {member.user.email}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(member.createdAt).toLocaleDateString()}
                          <Activity className="h-3 w-3 ml-2" />
                          Active {new Date(member.lastActive).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`flex items-center gap-1 ${roleColor}`}>
                        <RoleIcon className="h-3 w-3" />
                        {member.role.toLowerCase()}
                      </Badge>

                      {canManage && member.role !== 'OWNER' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(member)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Update Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member)}
                              className="flex items-center gap-2 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No team members</h3>
              <p className="text-muted-foreground">
                Add team members to start collaborating
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddMemberModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        teamId={teamId}
      />

      {selectedMember && (
        <UpdateRoleModal
          open={showUpdateRoleModal}
          onClose={() => {
            setShowUpdateRoleModal(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          teamId={teamId}
        />
      )}
    </>
  );
}