import { ChartBarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

const metrics = [
  {
    name: 'Website Traffic',
    value: '12,345',
    change: '+12.3%',
    trend: 'up',
  },
  {
    name: 'Conversion Rate',
    value: '3.2%',
    change: '+0.5%',
    trend: 'up',
  },
  {
    name: 'Bounce Rate',
    value: '42.1%',
    change: '-2.1%',
    trend: 'down',
  },
  {
    name: 'Avg. Session',
    value: '2m 45s',
    change: '+15s',
    trend: 'up',
  },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <div className="flex space-x-4">
          <button className="btn-primary">Export Report</button>
          <button className="btn-primary">Refresh Data</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="overflow-hidden rounded-lg bg-gray-800 px-4 py-5 shadow sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-gray-400">{metric.name}</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-white">
                {metric.value}
              </div>

              <div
                className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium ${
                  metric.trend === 'up'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {metric.trend === 'up' ? (
                  <ArrowUpIcon className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0" />
                ) : (
                  <ArrowDownIcon className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0" />
                )}
                <span className="sr-only">
                  {metric.trend === 'up' ? 'Increased' : 'Decreased'} by
                </span>
                {metric.change}
              </div>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-6 shadow">
          <h2 className="text-lg font-medium text-white">Traffic Overview</h2>
          <div className="mt-4 h-64">
            <div className="flex h-full items-center justify-center text-gray-400">
              <ChartBarIcon className="mr-2 h-8 w-8" />
              Chart Coming Soon
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-6 shadow">
          <h2 className="text-lg font-medium text-white">User Behavior</h2>
          <div className="mt-4 h-64">
            <div className="flex h-full items-center justify-center text-gray-400">
              <ChartBarIcon className="mr-2 h-8 w-8" />
              Chart Coming Soon
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-gray-800 p-6 shadow">
        <h2 className="text-lg font-medium text-white">Top Pages</h2>
        <div className="mt-4">
          <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-0">
                        Page
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                        Views
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                        Avg. Time
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                        Bounce Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0">
                        Homepage
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        5,234
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        2m 15s
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        35.2%
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0">
                        About Us
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        2,123
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        1m 45s
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        42.1%
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0">
                        Services
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        3,456
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        3m 12s
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        28.5%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 