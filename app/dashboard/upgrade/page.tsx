"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Loader2, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export default function UpgradePage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    setLoadingPlan(plan);

    try {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/dashboard/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
          cancelUrl: `${window.location.origin}/dashboard/upgrade?canceled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Payment failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Upgrade Your Plan
          </h1>
          <p className="text-slate-400">
            Choose the perfect plan to unlock advanced features and grow your
            business
          </p>
        </div>

        {/* Plans Grid */}
        <div className="flex justify-center">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            {/* Pro Website Package - DISABLED */}
            <Card className="bg-slate-900/50 border-slate-700 relative opacity-60">
              <div className="absolute inset-0 bg-slate-900/20 rounded-lg z-10"></div>
              <CardHeader className="text-center relative z-20">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-8 w-8 text-slate-400 mr-2" />
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
                <CardTitle className="text-2xl text-slate-100">
                  Pro Website Package
                </CardTitle>
                <div className="text-3xl font-bold text-slate-400">
                  $1,895
                  <span className="text-sm font-normal text-slate-400 ml-1">
                    one-time
                  </span>
                </div>
                <CardDescription className="text-slate-400">
                  Professional website generation with comprehensive analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-20">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Professional website generation with modern design
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Comprehensive SEO and UX analysis
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Detailed technical audit and recommendations
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Professional PDF report with actionable insights
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Priority support and consultation
                    </span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-slate-600 text-slate-300 cursor-not-allowed"
                  disabled={true}
                >
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Health Check */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-8 w-8 text-blue-500 mr-2" />
                  <Badge variant="outline" className="text-xs">
                    Available Now
                  </Badge>
                </div>
                <CardTitle className="text-2xl text-slate-100">
                  Monthly Health Check
                </CardTitle>
                <div className="text-3xl font-bold text-electric-blue">
                  $275
                  <span className="text-sm font-normal text-slate-400 ml-1">
                    /month
                  </span>
                </div>
                <CardDescription className="text-slate-400">
                  Ongoing monitoring and optimization for your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Monthly website performance monitoring
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Regular SEO and UX audits
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Performance optimization recommendations
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Monthly progress reports
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Email support and consultation
                    </span>
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={() => handleUpgrade("MONTHLY_HEALTH_CHECK")}
                  disabled={loadingPlan === "MONTHLY_HEALTH_CHECK"}
                >
                  {loadingPlan === "MONTHLY_HEALTH_CHECK" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Start Monthly Health Check"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-slate-100">
                Need a custom solution?
              </h3>
              <p className="text-slate-400 text-sm">
                Contact us for enterprise plans and custom integrations
              </p>
              <Button
                variant="ghost"
                className="text-electric-blue hover:text-electric-blue/90"
              >
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
