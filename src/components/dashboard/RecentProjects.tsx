import Link from 'next/link';
import { Project } from '@prisma/client';

interface RecentProjectsProps {
  projects: Project[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="border-b pb-4">
            <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline">
              {project.name}
            </Link>
            <p className="text-gray-600">{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 