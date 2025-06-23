import React from 'react';
import { useRouter } from 'next/router';
import { TeamLayout } from '../../../components/layout/TeamLayout';
import { TeamSettings } from '../../../components/TeamSettings';

export default function TeamSettingsPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>;
  }

  return (
    <TeamLayout teamId={id}>
      <TeamSettings teamId={id} />
    </TeamLayout>
  );
} 