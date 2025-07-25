"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Loader2,
  Zap,
  Shield,
  Clock,
  Headphones,
  BarChart3,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  websiteUrl?: string;
}

const MONTHLY_HEALTH_CHECK_FEATURES = [
  {
    icon: <BarChart3 className="h-5 w-5 text-electric-blue" />,
    title: "Monthly Website Analysis",
    description: "Comprehensive monthly audits of your website performance",
  },
  {
    icon: <Zap className="h-5 w-5 text-neon-green" />,
    title: "Performance Monitoring",
    description: "Track loading times and mobile responsiveness",
  },
  {
    icon: <Shield className="h-5 w-5 text-yellow-400" />,
    title: "SEO Health Tracking",
    description: "Monitor search engine optimization metrics",
  },
  {
    icon: <Clock className="h-5 w-5 text-purple-400" />,
    title: "Detailed Reports",
    description: "Monthly reports with actionable insights",
  },
  {
    icon: <Headphones className="h-5 w-5 text-cyan-400" />,
    title: "Email Support",
    description: "Get help when you need it with email support",
  },
];

export function SubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
  websiteUrl,
}: SubscriptionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { refreshSubscription } = useAuth();

  const handleSubscribe = async () => {
    setIsProcessing(true);

    try {
      // Create checkout session for MONTHLY_HEALTH_CHECK plan
      const response = await authClient.authenticatedFetch(
        "/api/payments/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: "MONTHLY_HEALTH_CHECK",
            successUrl: `${window.location.origin}/dashboard/success?session_id={CHECKOUT_SESSION_ID}&plan=MONTHLY_HEALTH_CHECK`,
            cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription failed",
        description: "Unable to process subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-100">
            Subscribe to Monthly Health Check
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Subscribe to our MONTHLY_HEALTH_CHECK plan to get ongoing website
            monitoring and optimization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Details */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">
                  Monthly Health Check
                </h3>
                <p className="text-slate-400 text-sm">
                  Ongoing website monitoring and optimization
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-electric-blue">
                  $275
                </div>
                <div className="text-sm text-slate-400">per month</div>
              </div>
            </div>

            <div className="space-y-3">
              {MONTHLY_HEALTH_CHECK_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{feature.icon}</div>
                  <div>
                    <div className="font-medium text-slate-200">
                      {feature.title}
                    </div>
                    <div className="text-sm text-slate-400">
                      {feature.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="flex-1 bg-electric-blue hover:bg-electric-blue/90 text-slate-900 font-semibold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Subscribe Now
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              You can cancel your subscription at any time
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
