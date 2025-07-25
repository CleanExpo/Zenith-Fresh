"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { WebsiteAnalyzer } from "@/components/website-analyzer";
import { UserProfile } from "@/components/user-profile";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <WebsiteAnalyzer />
      </div>
    </DashboardLayout>
  );
}
