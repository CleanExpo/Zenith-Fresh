"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { AutomationsView } from "@/components/automations-view";

export default function AutomationsPage() {
  return (
    <DashboardLayout>
      <AutomationsView />
    </DashboardLayout>
  );
}
