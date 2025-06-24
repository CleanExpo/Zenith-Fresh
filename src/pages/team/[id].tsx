import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { TeamAnalytics } from '../../components/TeamAnalytics';
import { TeamBilling } from '../../components/TeamBilling';
import { TeamSettings } from '../../components/TeamSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';

export default function TeamPage() {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState("analytics");

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <Card className="p-6">
            <TeamAnalytics teamId={id} />
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="p-6">
            <TeamBilling teamId={id} />
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6">
            <TeamSettings teamId={id} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 