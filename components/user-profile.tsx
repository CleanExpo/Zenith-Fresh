"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Calendar, Shield, Crown } from "lucide-react";

export function UserProfile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <p className="text-slate-400">No user data available</p>
        </CardContent>
      </Card>
    );
  }

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.email.split("@")[0];

  const roleBadge =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
      <Badge variant="destructive" className="ml-2">
        <Crown className="h-3 w-3 mr-1" />
        {user.role}
      </Badge>
    ) : (
      <Badge variant="secondary" className="ml-2">
        <Shield className="h-3 w-3 mr-1" />
        {user.role}
      </Badge>
    );

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-100 flex items-center">
          <User className="h-5 w-5 mr-2 text-electric-blue" />
          User Profile
        </CardTitle>
        <CardDescription className="text-slate-400">
          Your account information from the API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-electric-blue text-slate-900 text-lg">
              {user.firstName?.charAt(0)?.toUpperCase() ||
                user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-100 flex items-center">
              {displayName}
              {roleBadge}
            </h3>
            <p className="text-slate-400 flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {user.email}
            </p>
          </div>
        </div>

        {/* User Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">
              User ID
            </label>
            <p className="text-slate-200 font-mono text-sm bg-slate-800 px-3 py-2 rounded">
              {user.id}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Role</label>
            <p className="text-slate-200">{user.role}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">
              First Name
            </label>
            <p className="text-slate-200">{user.firstName || "Not provided"}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">
              Last Name
            </label>
            <p className="text-slate-200">{user.lastName || "Not provided"}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">
              Member Since
            </label>
            <p className="text-slate-200 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">
              Subscription
            </label>
            <p className="text-slate-200">
              {user.subscription ? "Active" : "No active subscription"}
            </p>
          </div>
        </div>

        {/* API Status */}
        <div className="pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">API Status</p>
              <p className="text-green-400 text-sm">
                ✓ Connected and authenticated
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-200"
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
