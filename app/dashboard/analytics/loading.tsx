import { DashboardLayout } from "@/components/dashboard-layout";
import { Loader2 } from "lucide-react";

export default function AnalyticsLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              Analytics
            </h1>
            <p className="text-slate-400">
              Track your website performance and optimization progress
            </p>
          </div>
        </div>

        {/* Loading skeleton for overview stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-slate-900/50 border-slate-700 rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-700 rounded w-24"></div>
                  <div className="h-8 bg-slate-700 rounded w-16"></div>
                  <div className="h-4 bg-slate-700 rounded w-20"></div>
                </div>
                <div className="h-6 w-6 bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading skeleton for tabs */}
        <div className="space-y-4">
          <div className="bg-slate-800 border-slate-700 rounded-lg p-2">
            <div className="flex space-x-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 bg-slate-700 rounded w-24 animate-pulse"
                ></div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="bg-slate-900/50 border-slate-700 rounded-lg p-6 animate-pulse"
              >
                <div className="space-y-4">
                  <div className="h-6 bg-slate-700 rounded w-48"></div>
                  <div className="h-4 bg-slate-700 rounded w-64"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <div className="h-4 bg-slate-700 rounded w-24"></div>
                          <div className="h-4 bg-slate-700 rounded w-16"></div>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading skeleton for export section */}
        <div className="bg-slate-900/50 border-slate-700 rounded-lg p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-slate-700 rounded w-48"></div>
              <div className="h-4 bg-slate-700 rounded w-64"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-slate-700 rounded w-24"></div>
              <div className="h-10 bg-slate-700 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
