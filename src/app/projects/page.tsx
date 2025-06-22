import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Layout from '@/components/layout/Layout';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getProjects(userId: string) {
  try {
    const projects = await prisma.project.findMany({
      where: { 
        OR: [
          { userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        tasks: {
          select: { id: true, status: true }
        },
        files: {
          select: { id: true }
        },
        members: {
          include: {
            user: {
              select: { name: true, email: true, image: true }
            }
          }
        },
        team: {
          select: { name: true }
        },
        _count: {
          select: {
            tasks: true,
            files: true,
            members: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return projects.map(project => ({
      ...project,
      completedTasks: project.tasks.filter(task => task.status === 'DONE').length,
      totalTasks: project.tasks.length,
      progress: project.tasks.length > 0 
        ? Math.round((project.tasks.filter(task => task.status === 'DONE').length / project.tasks.length) * 100)
        : 0
    }));
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return [];
  }
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const projects = await getProjects(session.user.id);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your projects and track progress across teams.
            </p>
          </div>
          <CreateProjectModal />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-lg border border-blue-400/30">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Total Projects</p>
                <p className="text-2xl font-bold text-white">{projects.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-lg border border-green-400/30">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Active Projects</p>
                <p className="text-2xl font-bold text-white">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-lg border border-yellow-400/30">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">In Progress</p>
                <p className="text-2xl font-bold text-white">
                  {projects.filter(p => p.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-lg border border-purple-400/30">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Team Members</p>
                <p className="text-2xl font-bold text-white">
                  {projects.reduce((acc, p) => acc + p._count.members, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 bg-white/10 backdrop-blur-xl border border-white/20">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-4">
              <select 
                title="Filter by project status"
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="" className="bg-gray-800 text-white">All Status</option>
                <option value="active" className="bg-gray-800 text-white">Active</option>
                <option value="in_progress" className="bg-gray-800 text-white">In Progress</option>
                <option value="completed" className="bg-gray-800 text-white">Completed</option>
                <option value="draft" className="bg-gray-800 text-white">Draft</option>
              </select>
              <select 
                title="Filter by team type"
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="" className="bg-gray-800 text-white">All Teams</option>
                <option value="personal" className="bg-gray-800 text-white">Personal</option>
                <option value="team" className="bg-gray-800 text-white">Team Projects</option>
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm w-64 text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
              />
              <svg className="w-4 h-4 text-white/60 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card className="p-12 bg-white/10 backdrop-blur-xl border border-white/20 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
              <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-white/60 mb-6">Get started by creating your first project.</p>
            <CreateProjectModal variant="primary" />
          </Card>
        )}
      </div>
    </Layout>
  );
}
