import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { TeamLayout } from '../../../components/layout/TeamLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export default function TeamOverviewPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>;
  }

  const sections = [
    {
      title: 'Analytics',
      description: 'View usage statistics and performance metrics',
      href: `/team/${id}/analytics`,
      stats: [
        { label: 'Total Requests', value: '7,000' },
        { label: 'Total Tokens', value: '350,000' }
      ]
    },
    {
      title: 'Billing',
      description: 'Manage subscription and payment methods',
      href: `/team/${id}/billing`,
      stats: [
        { label: 'Current Plan', value: 'Pro' },
        { label: 'Next Billing', value: 'May 1, 2024' }
      ]
    },
    {
      title: 'Settings',
      description: 'Configure team preferences and integrations',
      href: `/team/${id}/settings`,
      stats: [
        { label: 'Team Members', value: '5' },
        { label: 'Active Projects', value: '3' }
      ]
    }
  ];

  return (
    <TeamLayout teamId={id}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Team Overview</h1>
          <Button>New Project</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.title} href={section.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {section.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {section.stats.map((stat) => (
                      <div key={stat.label}>
                        <div className="text-sm text-muted-foreground">
                          {stat.label}
                        </div>
                        <div className="text-lg font-semibold">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </TeamLayout>
  );
} 