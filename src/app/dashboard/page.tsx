import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import Layout from '@/components/layout/Layout';

async function getDashboardData(userId: string) {
  try {
    const [projects, tasks, analytics, notifications] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        include: {
          tasks: true,
          _count: {
            select: {
              tasks: true,
              files: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.task.findMany({
        where: { userId },
        include: {
          project: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.analytics.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 7,
      }),
      prisma.notification.findMany({
        where: { userId, read: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      projects,
      tasks,
      analytics,
      notifications,
      stats: {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'DONE').length,
        unreadNotifications: notifications.length,
      },
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return {
      projects: [],
      tasks: [],
      analytics: [],
      notifications: [],
      stats: {
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        unreadNotifications: 0,
      },
    };
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const dashboardData = await getDashboardData(session.user.id);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session.user.name}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats */}
        <DashboardStats totalProjects={dashboardData.stats.totalProjects} />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div className="space-y-6">
            <RecentProjects projects={dashboardData.projects} />
          </div>

          {/* Recent Activity & Notifications */}
          <div className="space-y-6">
            {/* Recent Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Tasks
              </h3>
              {dashboardData.tasks.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {task.project.name}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === 'DONE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No recent tasks. Create a project to get started!
                </p>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notifications
                {dashboardData.notifications.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
                    {dashboardData.notifications.length}
                  </span>
                )}
              </h3>
              {dashboardData.notifications.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded"
                    >
                      <p className="text-sm text-gray-900 dark:text-white">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No new notifications.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <span className="text-lg mr-2">📊</span>
              New Project
            </button>
            <button className="flex items-center justify-center p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              <span className="text-lg mr-2">✅</span>
              Add Task
            </button>
            <button className="flex items-center justify-center p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              <span className="text-lg mr-2">👥</span>
              Invite Team
            </button>
            <button className="flex items-center justify-center p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              <span className="text-lg mr-2">📈</span>
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
