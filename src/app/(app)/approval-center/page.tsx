// src/app/(app)/approval-center/page.tsx
import ApprovalCenter from '../../../components/dashboard/ApprovalCenter';
import { Suspense } from 'react';

export default function ApprovalCenterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApprovalCenter />
    </Suspense>
  );
}
