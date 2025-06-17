import React from 'react';
import { useRouter } from 'next/router';
import { TeamLayout } from '../../../components/layout/TeamLayout';
import { TeamBilling } from '../../../components/TeamBilling';

export default function TeamBillingPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>;
  }

  return (
    <TeamLayout teamId={id}>
      <TeamBilling teamId={id} />
    </TeamLayout>
  );
} 