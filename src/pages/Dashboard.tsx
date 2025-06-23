import { ChartBarIcon, FolderIcon, ClockIcon, DocumentIcon } from '@heroicons/react/24/outline';

const stats = [
  { name: 'Total Projects', value: '12', icon: FolderIcon },
  { name: 'Active Tasks', value: '24', icon: ClockIcon },
  { name: 'Files Uploaded', value: '156', icon: DocumentIcon },
  { name: 'Analytics Score', value: '92%', icon: ChartBarIcon },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="overflow-hidden rounded-lg bg-gray-800 px-4 py-5 shadow sm:p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-400">{item.name}</dt>
                  <dd className="mt-1 text-3xl font-semibold text-white">{item.value}</dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-6 shadow">
          <h2 className="text-lg font-medium text-white">Recent Activity</h2>
          <div className="mt-4 space-y-4">
            {/* Placeholder for activity feed */}
            <p className="text-gray-400">No recent activity</p>
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-6 shadow">
          <h2 className="text-lg font-medium text-white">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button className="btn-primary">New Project</button>
            <button className="btn-primary">Upload Files</button>
            <button className="btn-primary">View Analytics</button>
            <button className="btn-primary">Start Planning</button>
          </div>
        </div>
      </div>
    </div>
  );
} 