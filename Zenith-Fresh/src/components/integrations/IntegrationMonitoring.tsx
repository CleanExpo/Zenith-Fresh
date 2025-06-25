import React from 'react';

export default function IntegrationMonitoring() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Integration Monitoring</h2>
      <p className="text-gray-600">Monitor integration health, performance, and status.</p>
      <div className="mt-6">
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Salesforce CRM</h3>
                <p className="text-sm text-gray-600">Last sync: 2 minutes ago</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">HubSpot Marketing</h3>
                <p className="text-sm text-gray-600">Last sync: 5 minutes ago</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Google Analytics</h3>
                <p className="text-sm text-gray-600">Sync failed - API limit</p>
              </div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}