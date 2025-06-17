import { PlusIcon } from '@heroicons/react/24/outline';

const projects = [
  {
    id: 1,
    name: 'Website Redesign',
    status: 'In Progress',
    progress: 75,
    lastUpdated: '2 hours ago',
  },
  {
    id: 2,
    name: 'Mobile App Development',
    status: 'Planning',
    progress: 30,
    lastUpdated: '1 day ago',
  },
  {
    id: 3,
    name: 'SEO Optimization',
    status: 'Completed',
    progress: 100,
    lastUpdated: '3 days ago',
  },
];

export default function Projects() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Projects</h1>
        <button className="btn-primary flex items-center">
          <PlusIcon className="mr-2 h-5 w-5" />
          New Project
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-gray-800 shadow">
        <ul className="divide-y divide-gray-700">
          {projects.map((project) => (
            <li key={project.id} className="p-4 hover:bg-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">{project.name}</h3>
                  <p className="text-sm text-gray-400">{project.status}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32">
                    <div className="h-2 rounded-full bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-primary-600"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{project.lastUpdated}</span>
                  <button className="text-gray-400 hover:text-white">
                    <span className="sr-only">View project</span>
                    →
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 