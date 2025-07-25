"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  CreditCard,
  Save,
  Download,
  Calendar,
  DollarSign,
  Package,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SettingsViewProps {
  user: {
    name: string;
    email: string;
  };
}

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: string;
  description: string;
  status: "paid" | "pending" | "failed";
  invoiceUrl?: string;
}

export function SettingsView({ user }: SettingsViewProps) {
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Fetch real billing history from API
  useEffect(() => {
    const fetchBillingHistory = async () => {
      try {
        const response = await fetch("/api/billing/history", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBillingHistory(data.history || []);
        } else {
          // Fallback to empty array if API fails
          setBillingHistory([]);
        }
      } catch (error) {
        console.error("Failed to fetch billing history:", error);
        setBillingHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingHistory();
  }, []);

  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Settings</h1>
        <p className="text-slate-400">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-slate-700"
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="data-[state=active]:bg-slate-700"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Profile Information
              </CardTitle>
              <CardDescription className="text-slate-400">
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-electric-blue text-slate-900 text-xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-400 hover:bg-slate-800 bg-transparent cursor-not-allowed"
                    disabled
                  >
                    Change Avatar
                  </Button>
                  <p className="text-sm text-slate-500 mt-2">
                    Avatar updates are currently disabled
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name" className="text-slate-200">
                    Full Name
                  </Label>
                  <Input
                    id="full-name"
                    defaultValue={user.name}
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-electric-blue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email}
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-electric-blue"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-slate-200">
                  Company (Optional)
                </Label>
                <Input
                  id="company"
                  placeholder="Your company name"
                  className="bg-slate-800 border-slate-600 text-slate-100 focus:border-electric-blue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-slate-200">
                  Timezone
                </Label>
                <Select>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="utc" className="text-slate-200">
                      UTC (GMT+0)
                    </SelectItem>
                    <SelectItem value="est" className="text-slate-200">
                      Eastern Time (GMT-5)
                    </SelectItem>
                    <SelectItem value="pst" className="text-slate-200">
                      Pacific Time (GMT-8)
                    </SelectItem>
                    <SelectItem value="cet" className="text-slate-200">
                      Central European Time (GMT+1)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={saveSettings}
                className="bg-electric-blue hover:bg-cyan-500 text-slate-900 font-semibold"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* Current Package */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Current Package</CardTitle>
              <CardDescription className="text-slate-400">
                Your current subscription plan and usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-electric-blue/10 border border-electric-blue/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-electric-blue" />
                    <div>
                      <h4 className="font-medium text-slate-200">Pro Plan</h4>
                      <p className="text-sm text-slate-400">
                        $99/month • Renews on Feb 15, 2024
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
                  >
                    Change Plan
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5 text-electric-blue" />
                  </div>
                  <p className="text-2xl font-bold text-electric-blue">1,247</p>
                  <p className="text-sm text-slate-400">Analyses This Month</p>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 w-5 text-neon-green" />
                  </div>
                  <p className="text-2xl font-bold text-neon-green">$99.00</p>
                  <p className="text-sm text-slate-400">Current Bill</p>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">15</p>
                  <p className="text-sm text-slate-400">Days Until Renewal</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-200">Payment Method</h4>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-200">
                          •••• •••• •••• 4242
                        </p>
                        <p className="text-sm text-slate-400">Expires 12/25</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Billing History</CardTitle>
              <CardDescription className="text-slate-400">
                View your past invoices and payment history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {billingHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-400">
                          {item.date}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">
                          {item.description}
                        </p>
                        <p className="text-sm text-slate-400">{item.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                      {item.invoiceUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
