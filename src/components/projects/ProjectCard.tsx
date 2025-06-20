import Link from 'next/link';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    progress: number;
    totalTasks: number;
    completedTasks: number;
    user: {
      name: string | null;
      email: string;
    };
    members: Array<{
      user: {
        name: string | null;
        email: string;
        image: string | null;
      };
    }>;
    team?: {
      name: string;
    } | null;
    _count: {
      tasks: number;
      files: number;
      members: number;
    };
  };
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColor = statusColors[project.status as keyof typeof statusColors] || statusColors.draft;

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <Link 
              href={`/projects/${project.id}`}
              className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {project.name}
            </Link>
            {project.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {project._count.tasks}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {project._count.files}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Files</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {project._count.members + 1} {/* +1 for owner */}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Members</div>
          </div>
        </div>

        {/* Team Members Avatars */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {/* Owner Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium ring-2 ring-white dark:ring-gray-800">
              {project.user.name?.charAt(0) || project.user.email.charAt(0).toUpperCase()}
            </div>
            
            {/* Member Avatars */}
            {project.members.slice(0, 3).map((member, index) => (
              <div 
                key={index}
                className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-medium ring-2 ring-white dark:ring-gray-800"
              >
                {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
              </div>
            ))}
            
            {project.members.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium ring-2 ring-white dark:ring-gray-800">
                +{project.members.length - 3}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Updated {format(new Date(project.updatedAt), 'MMM d')}
          </div>
        </div>

        {/* Team Badge */}
        {project.team && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Team: {project.team.name}
            </div>
          </div>
        )}
      </div>

      {/* Hover Actions */}
      <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg px-6 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex justify-between items-center">
          <Link 
            href={`/projects/${project.id}`}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            View Project →
          </Link>
          <div className="flex gap-2">
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
