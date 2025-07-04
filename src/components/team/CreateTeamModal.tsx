'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (teamId: string) => void;
}

export function CreateTeamModal({ open, onClose, onSuccess }: CreateTeamModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const createTeamMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post('/api/teams', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
      onClose();
      setName('');
      setDescription('');
      if (onSuccess) {
        onSuccess(response.team.id);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create team');
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

    createTeamMutation.mutate(payload);
  };

  const handleClose = () => {
    if (!createTeamMutation.isPending) {
      onClose();
      setName('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team to collaborate with your colleagues.
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
              disabled={createTeamMutation.isPending}
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
              disabled={createTeamMutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={createTeamMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTeamMutation.isPending || !name.trim()}
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}