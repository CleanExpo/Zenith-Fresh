import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface DashboardStatsProps {
  totalProjects: number;
}

export function DashboardStats({ totalProjects }: DashboardStatsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800 sm:p-6">
        <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Projects
        </dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {totalProjects}
        </dd>
      </div>

      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800 sm:p-6">
        <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
          Active Projects
        </dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {Math.floor(totalProjects * 0.7)}
        </dd>
      </div>

      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800 sm:p-6">
        <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
          Completed Projects
        </dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {Math.floor(totalProjects * 0.3)}
        </dd>
      </div>
    </div>
  );
} 