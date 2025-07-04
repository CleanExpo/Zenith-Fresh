'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Team } from './TeamDashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EditTeamModalProps {
  open: boolean;
  onClose: () => void;
  team: Team;
}

export function EditTeamModal({ open, onClose, team }: EditTeamModalProps) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const queryClient = useQueryClient();

  // Reset form when team changes
  useEffect(() => {
    setName(team.name);
    setDescription(team.description || '');
  }, [team]);

  const updateTeamMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.put(`/api/teams/${team.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', team.id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update team');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: { name: string; description?: string } = {
      name: name.trim()
    };

    if (description.trim()) {
      payload.description = description.trim();
    }

    updateTeamMutation.mutate(payload);
  };

  const handleClose = () => {
    if (!updateTeamMutation.isPending) {
      onClose();
      // Reset form to original values
      setName(team.name);
      setDescription(team.description || '');
    }
  };

  const hasChanges = name.trim() !== team.name || (description.trim() || '') !== (team.description || '');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update your team's name and description.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              required
              disabled={updateTeamMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this team is for..."
              rows={3}
              disabled={updateTeamMutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={updateTeamMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateTeamMutation.isPending || !name.trim() || !hasChanges}
            >
              {updateTeamMutation.isPending ? 'Updating...' : 'Update Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}