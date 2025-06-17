import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

const tasks = [
  {
    id: 1,
    title: 'Website Analysis',
    status: 'In Progress',
    assignee: 'John Doe',
    dueDate: '2024-03-20',
    priority: 'High',
  },
  {
    id: 2,
    title: 'Content Strategy',
    status: 'Not Started',
    assignee: 'Jane Smith',
    dueDate: '2024-03-25',
    priority: 'Medium',
  },
  {
    id: 3,
    title: 'SEO Implementation',
    status: 'Completed',
    assignee: 'Mike Johnson',
    dueDate: '2024-03-15',
    priority: 'High',
  },
];

export default function Planning() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Planning</h1>
        <div className="flex space-x-4">
          <button className="btn-primary">Add Task</button>
          <button className="btn-primary">Export Plan</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg bg-gray-800 shadow">
            <div className="p-4">
              <h2 className="text-lg font-medium text-white">Timeline</h2>
              <div className="mt-4 space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start space-x-4 rounded-lg bg-gray-700 p-4"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white">{task.title}</h3>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <ClockIcon className="mr-1 h-4 w-4" />
                          {task.dueDate}
                        </div>
                        <div className="flex items-center">
                          <UserIcon className="mr-1 h-4 w-4" />
                          {task.assignee}
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            task.priority === 'High'
                              ? 'bg-red-500/20 text-red-400'
                              : task.priority === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white">
                      <span className="sr-only">Edit task</span>
                      ✎
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-gray-800 p-4 shadow">
            <h2 className="text-lg font-medium text-white">Calendar</h2>
            <div className="mt-4">
              <div className="flex items-center justify-center text-gray-400">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Calendar View Coming Soon
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-800 p-4 shadow">
            <h2 className="text-lg font-medium text-white">Team Members</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">JD</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">John Doe</p>
                  <p className="text-xs text-gray-400">3 tasks assigned</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">JS</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Jane Smith</p>
                  <p className="text-xs text-gray-400">2 tasks assigned</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 