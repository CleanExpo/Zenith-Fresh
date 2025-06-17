import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { TeamAnalytics } from '@/components/dashboard/TeamAnalytics';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const [projects, stats] = await Promise.all([
    prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    }),
    prisma.project.aggregate({
      where: {
        userId: session.user.id,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
      </div>

      <DashboardStats totalProjects={stats._count._all} />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentProjects projects={projects} />
        <TeamAnalytics teamId={session.user.id} />
      </div>
    </div>
  );
} 