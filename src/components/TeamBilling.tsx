import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TeamBillingProps {
  teamId: string;
}

interface BillingInfo {
  plan: string;
  status: 'active' | 'past_due' | 'canceled';
  nextBillingDate: string;
  amount: number;
  currency: string;
  autoRenew: boolean;
  paymentMethod: {
    type: string;
    last4: string;
  };
  paymentHistory: {
    date: string;
    amount: number;
    status: string;
  }[];
}

export function TeamBilling({ teamId }: TeamBillingProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BillingInfo>({
    queryKey: ['teamBilling', teamId],
    queryFn: () => api.get(`/api/team/${teamId}/billing`)
  });

  const updateBillingMutation = useMutation({
    mutationFn: (updates: Partial<BillingInfo>) =>
      api.put(`/api/team/${teamId}/billing`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamBilling', teamId] });
      toast.success('Billing settings updated');
    },
    onError: (error) => {
      toast.error('Failed to update billing settings');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading billing information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Error loading billing information</div>
      </div>
    );
  }

  if (!data) return null;

  const handleAutoRenewChange = (checked: boolean) => {
    updateBillingMutation.mutate({ autoRenew: checked });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{data.plan} Plan</div>
              <div className="text-muted-foreground">
                ${data.amount}/{data.currency} per month
              </div>
            </div>
            <Badge
              variant={
                data.status === 'active'
                  ? 'secondary'
                  : data.status === 'past_due'
                  ? 'outline'
                  : 'destructive'
              }
            >
              {data.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-renew subscription</Label>
              <div className="text-sm text-muted-foreground">
                Your subscription will automatically renew on{' '}
                {format(new Date(data.nextBillingDate), 'MMM d, yyyy')}
              </div>
            </div>
            <Switch
              checked={data.autoRenew}
              onCheckedChange={handleAutoRenewChange}
              disabled={updateBillingMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Payment Method</Label>
              <div className="text-sm text-muted-foreground">
                {data.paymentMethod.type} ending in {data.paymentMethod.last4}
              </div>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.paymentHistory.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <div className="font-medium">Pro Plan - Monthly</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(payment.date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${payment.amount}</div>
                  <Badge
                    variant={
                      payment.status === 'paid'
                        ? 'secondary'
                        : payment.status === 'pending'
                        ? 'outline'
                        : 'destructive'
                    }
                    className="mt-1"
                  >
                    {payment.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
