'use client';

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Reports</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Generated Reports</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Generate New Report
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Report Name</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Date Created</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">Monthly Performance Report</td>
                <td className="py-3 px-4">Performance</td>
                <td className="py-3 px-4">2024-01-15</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Completed</span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                  <button className="text-gray-600 hover:text-gray-800">Download</button>
                </td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">User Analytics Report</td>
                <td className="py-3 px-4">Analytics</td>
                <td className="py-3 px-4">2024-01-14</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Completed</span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                  <button className="text-gray-600 hover:text-gray-800">Download</button>
                </td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">System Health Report</td>
                <td className="py-3 px-4">System</td>
                <td className="py-3 px-4">2024-01-13</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Processing</span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-gray-400" disabled>View</button>
                  <button className="text-gray-400 ml-3" disabled>Download</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">Report Templates</h3>
          <ul className="space-y-2">
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">→ Performance Template</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">→ Analytics Template</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">→ Financial Template</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">→ Custom Template</li>
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Reports</span>
              <span className="font-medium">156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Month</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Scheduled</span>
              <span className="font-medium">8</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">Export Options</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded">
              📄 Export as PDF
            </button>
            <button className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded">
              📊 Export as Excel
            </button>
            <button className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded">
              📈 Export as CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}