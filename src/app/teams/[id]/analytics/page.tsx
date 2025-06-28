'use client';

import { TeamAnalytics } from '@/components/team/TeamAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TeamAnalyticsPageProps {
  params: {
    id: string;
  };
}

export default function TeamAnalyticsPage({ params }: TeamAnalyticsPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Link href={`/teams/${params.id}`}>
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Button>
        </Link>
      </div>

      {/* Analytics Component */}
      <TeamAnalytics teamId={params.id} />
    </div>
  );
}