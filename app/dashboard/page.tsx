export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Project Cards */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">My Projects</h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage your projects and track their progress.
              </p>
            </div>
          </div>

          {/* Analytics Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
              <p className="mt-1 text-sm text-gray-500">
                View your project analytics and insights.
              </p>
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Configure your account and preferences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 