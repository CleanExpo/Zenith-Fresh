"use client";

import type React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import {
  BarChart3,
  Cpu,
  Crown,
  FileText,
  Globe,
  Loader,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader className="h-10 w-10 animate-spin text-electric-blue" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push("/login");
    return null;
  }

  const sidebarItems = [
    {
      icon: Search,
      label: "Website Analyzer",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      icon: FileText,
      label: "Reports",
      href: "/dashboard/reports",
      active: pathname === "/dashboard/reports",
    },
    {
      icon: BarChart3,
      label: "Analytics",
      href: "/dashboard/analytics",
      active: pathname === "/dashboard/analytics",
    },
    {
      icon: Zap,
      label: "Automations",
      href: "/dashboard/automations",
      active: pathname === "/dashboard/automations",
    },
    // {
    //   icon: Globe,
    //   label: "Deployments",
    //   href: "/dashboard/deployments",
    //   active: pathname === "/dashboard/deployments",
    // },
    {
      icon: Crown,
      label: "Upgrade",
      href: "/dashboard/upgrade",
      active: pathname === "/dashboard/upgrade",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-electric-blue" />
            <span className="text-lg font-bold">Zenith.engineer</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3">
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-electric-blue/10 text-electric-blue"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-electric-blue text-slate-900">
                {user.firstName?.charAt(0)?.toUpperCase() ||
                  user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName || user.email.split("@")[0]}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
        {/* Logout Section */}
        <div className="p-3 border-t border-slate-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
