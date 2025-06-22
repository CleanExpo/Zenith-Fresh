export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Notifications</h1>
      
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            All
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Unread
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Archive
          </button>
        </div>
        <button className="text-blue-600 hover:text-blue-800">
          Mark all as read
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">System Update Available</h3>
            <span className="text-sm text-gray-500">5 min ago</span>
          </div>
          <p className="text-gray-700 mb-3">A new system update is available. This update includes performance improvements and bug fixes.</p>
          <div className="flex gap-3">
            <button className="text-blue-600 hover:text-blue-800 font-medium">View Details</button>
            <button className="text-gray-600 hover:text-gray-800">Dismiss</button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">Monthly Report Ready</h3>
            <span className="text-sm text-gray-500">1 hour ago</span>
          </div>
          <p className="text-gray-700 mb-3">Your monthly performance report has been generated and is ready for review.</p>
          <div className="flex gap-3">
            <button className="text-blue-600 hover:text-blue-800 font-medium">View Report</button>
            <button className="text-gray-600 hover:text-gray-800">Archive</button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">API Rate Limit Warning</h3>
            <span className="text-sm text-gray-500">3 hours ago</span>
          </div>
          <p className="text-gray-700 mb-3">You&apos;ve used 80% of your monthly API quota. Consider upgrading your plan to avoid service interruption.</p>
          <div className="flex gap-3">
            <button className="text-blue-600 hover:text-blue-800 font-medium">Upgrade Plan</button>
            <button className="text-gray-600 hover:text-gray-800">Dismiss</button>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg shadow-md border-l-4 border-gray-300 opacity-75">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg text-gray-600">New Feature: Analytics Dashboard</h3>
            <span className="text-sm text-gray-500">Yesterday</span>
          </div>
          <p className="text-gray-600 mb-3">We&apos;ve launched a new analytics dashboard with enhanced visualization tools.</p>
          <div className="flex gap-3">
            <span className="text-gray-500">Read</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg shadow-md border-l-4 border-gray-300 opacity-75">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg text-gray-600">Scheduled Maintenance Complete</h3>
            <span className="text-sm text-gray-500">2 days ago</span>
          </div>
          <p className="text-gray-600 mb-3">The scheduled maintenance has been completed successfully. All systems are operational.</p>
          <div className="flex gap-3">
            <span className="text-gray-500">Read</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
          Load More
        </button>
      </div>
    </div>
  );
}