import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  FolderIcon, 
  ClockIcon, 
  DocumentIcon, 
  ChartBarIcon,
  PlusIcon,
  ArrowRightIcon,
  BellIcon
} from '@heroicons/react/24/outline';

async function getDashboardData(userId: string) {
  try {
    const [projects, tasks, files, notifications, activityLogs] = await Promise.all([
      // Get user's projects
      prisma.project.findMany({
        where: { 
          OR: [
            { userId },
            { members: { some: { userId } } }
          ]
        },
        include: {
          tasks: true,
          _count: { select: { tasks: true, files: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      
      // Get user's tasks
      prisma.task.findMany({
        where: { userId },
        include: { project: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 10
      }),
      
      // Get file count
      prisma.file.count({
        where: { userId }
      }),
      
      // Get recent notifications
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Get recent activity
      prisma.activityLog.findMany({
        where: { userId },
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    return {
      projects,
      tasks,
      fileCount: files,
      notifications,
      activityLogs,
      stats: {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'DONE').length,
        pendingTasks: tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
      }
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return {
      projects: [],
      tasks: [],
      fileCount: 0,
      notifications: [],
      activityLogs: [],
      stats: {
        totalProjects: 0,
        activeProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
      }
    };
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const data = await getDashboardData(session.user.id);

  const stats = [
    { 
      name: 'Total Projects', 
      value: data.stats.totalProjects.toString(), 
      icon: FolderIcon,
      href: '/projects',
      color: 'bg-blue-500'
    },
    { 
      name: 'Active Tasks', 
      value: data.stats.pendingTasks.toString(), 
      icon: ClockIcon,
      href: '/projects',
      color: 'bg-yellow-500'
    },
    { 
      name: 'Files Uploaded', 
      value: data.fileCount.toString(), 
      icon: DocumentIcon,
      href: '/projects',
      color: 'bg-green-500'
    },
    { 
      name: 'Completed Tasks', 
      value: data.stats.completedTasks.toString(), 
      icon: ChartBarIcon,
      href: '/projects',
      color: 'bg-purple-500'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session.user.name || session.user.email}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 shadow hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-lg ${item.color} p-3`}>
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      {item.name}
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                      {item.value}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-50 dark:to-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
                <Link 
                  href="/projects"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  View all <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="p-6">
              {data.projects.length > 0 ? (
                <div className="space-y-4">
                  {data.projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/projects/${project.id}`}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {project.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {project._count.tasks} tasks • {project.status}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first project.</p>
                  <div className="mt-6">
                    <Link
                      href="/projects"
                      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                      <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                      New Project
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity & Notifications */}
          <div className="space-y-8">
            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BellIcon className="w-5 h-5" />
                  Notifications
                </h2>
              </div>
              <div className="p-6">
                {data.notifications.length > 0 ? (
                  <div className="space-y-3">
                    {data.notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet.</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    href="/projects"
                    className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">New Project</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Settings</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 