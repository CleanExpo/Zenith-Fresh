"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [processingStep, setProcessingStep] = useState("Initializing...");
  const { refreshSubscription, user } = useAuth();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const plan = searchParams.get("plan");

    if (sessionId) {
      // Start processing immediately
      handlePaymentSuccess(sessionId, plan);
    } else {
      // No session ID, show success but skip processing
      setIsRefreshing(false);
      toast({
        title: "Payment successful!",
        description: "Your subscription has been activated.",
      });
    }

    // Fallback: if processing takes too long, redirect anyway
    const fallbackTimeout = setTimeout(() => {
      if (isRefreshing) {
        console.warn("Processing timeout, redirecting to dashboard");
        setIsRefreshing(false);
        toast({
          title: "Payment successful!",
          description:
            "Your subscription is being activated. You'll be able to use the service shortly.",
        });
        router.push("/dashboard");
      }
    }, 15000); // 15 second fallback

    return () => clearTimeout(fallbackTimeout);
  }, [searchParams, isRefreshing, router]);

  const handlePaymentSuccess = async (
    sessionId: string,
    plan: string | null
  ) => {
    setIsRefreshing(true);

    try {
      if (plan === "MONTHLY_HEALTH_CHECK") {
        setProcessingStep("Activating subscription...");

        // Wait a bit for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Try to refresh subscription with retry logic
        let updatedUser = null;
        let retryCount = 0;
        const maxRetries = 5;

        while (!updatedUser && retryCount < maxRetries) {
          setProcessingStep(
            `Activating subscription... (attempt ${retryCount + 1})`
          );
          updatedUser = await refreshSubscription();

          if (!updatedUser) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }
        }

        if (
          updatedUser &&
          updatedUser.subscription &&
          updatedUser.subscription.status === "ACTIVE"
        ) {
          toast({
            title: "Subscription activated!",
            description:
              "Your Monthly Health Check subscription is now active. You can now analyze websites.",
          });

          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else {
          // Even if refresh fails, show success and redirect
          toast({
            title: "Payment successful!",
            description:
              "Your subscription is being activated. You'll be able to use the service shortly.",
          });

          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        }
      } else {
        // Handle unknown plan
        setProcessingStep("Activating subscription...");
        const updatedUser = await refreshSubscription();

        if (updatedUser) {
          toast({
            title: "Subscription activated!",
            description: "Your subscription is now active.",
          });

          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Payment success handling failed:", error);

      // Even if there's an error, show success message and redirect
      toast({
        title: "Payment successful!",
        description:
          "Your subscription is being activated. You'll be able to use the service shortly.",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  if (isRefreshing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-electric-blue mx-auto" />
                <h2 className="text-xl font-semibold text-slate-100">
                  Processing your payment...
                </h2>
                <p className="text-slate-400">{processingStep}</p>
                <p className="text-xs text-slate-500">
                  This should only take a few seconds...
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsRefreshing(false);
                    router.push("/dashboard");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Skip and go to dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-neon-green" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-100">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-slate-400 text-lg">
              Your subscription is now active. You can now analyze websites and
              access all features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-electric-blue/10 to-cyan-500/10 border border-electric-blue/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-electric-blue" />
                What's Next?
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Your subscription is now active</li>
                <li>• You can analyze any website</li>
                <li>• Access comprehensive SEO reports</li>
                <li>• Get detailed performance insights</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGoToDashboard}
                className="flex-1 bg-electric-blue hover:bg-electric-blue/90 text-slate-900 font-semibold"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
