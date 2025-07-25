"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { SettingsView } from "@/components/settings-view";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { user } = useAuth();

  // Convert AuthUser to the format expected by SettingsView
  const settingsUser = user
    ? {
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.email.split("@")[0],
        email: user.email,
      }
    : null;

  return (
    <DashboardLayout>
      {settingsUser && <SettingsView user={settingsUser} />}
    </DashboardLayout>
  );
}
