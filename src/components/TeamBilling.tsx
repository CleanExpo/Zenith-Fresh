'use client';

import React from 'react';
import { BillingDashboard } from './billing/BillingDashboard';

interface TeamBillingProps {
  teamId: string;
}

export function TeamBilling({ teamId }: TeamBillingProps) {
  return <BillingDashboard teamId={teamId} />;
}
