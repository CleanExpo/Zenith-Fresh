'use client';

export default function ApprovalCenterPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Approval Center</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">
            Welcome to the Approval Center. This page manages approval workflows and processes.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Pending Approvals</h3>
              <p className="text-gray-600">No pending approvals at this time.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-gray-600">All approval processes are up to date.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}