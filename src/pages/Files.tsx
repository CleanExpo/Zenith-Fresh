import { DocumentIcon, FolderIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const files = [
  {
    id: 1,
    name: 'Website Analysis Report.pdf',
    type: 'PDF',
    size: '2.4 MB',
    lastModified: '2 hours ago',
  },
  {
    id: 2,
    name: 'Content Strategy.docx',
    type: 'DOCX',
    size: '1.8 MB',
    lastModified: '1 day ago',
  },
  {
    id: 3,
    name: 'SEO Keywords.xlsx',
    type: 'XLSX',
    size: '3.2 MB',
    lastModified: '3 days ago',
  },
];

const folders = [
  {
    id: 1,
    name: 'Project Documents',
    itemCount: 12,
    lastModified: '2 hours ago',
  },
  {
    id: 2,
    name: 'Analytics Reports',
    itemCount: 8,
    lastModified: '1 day ago',
  },
];

export default function Files() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Files</h1>
        <button className="btn-primary flex items-center">
          <ArrowUpTrayIcon className="mr-2 h-5 w-5" />
          Upload Files
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg bg-gray-800 shadow">
            <div className="p-4">
              <h2 className="text-lg font-medium text-white">Recent Files</h2>
              <div className="mt-4 space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center space-x-4 rounded-lg bg-gray-700 p-4"
                  >
                    <DocumentIcon className="h-8 w-8 text-gray-400" />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white">{file.name}</h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-400">
                        <span>{file.type}</span>
                        <span>{file.size}</span>
                        <span>{file.lastModified}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white">
                      <span className="sr-only">Download file</span>
                      ↓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-gray-800 p-4 shadow">
            <h2 className="text-lg font-medium text-white">Folders</h2>
            <div className="mt-4 space-y-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center space-x-4 rounded-lg bg-gray-700 p-4"
                >
                  <FolderIcon className="h-8 w-8 text-gray-400" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{folder.name}</h3>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-400">
                      <span>{folder.itemCount} items</span>
                      <span>{folder.lastModified}</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-white">
                    <span className="sr-only">Open folder</span>
                    →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gray-800 p-4 shadow">
            <h2 className="text-lg font-medium text-white">Storage</h2>
            <div className="mt-4">
              <div className="h-2 rounded-full bg-gray-700">
                <div className="h-2 rounded-full bg-primary-600" style={{ width: '65%' }} />
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-400">
                <span>6.5 GB used</span>
                <span>10 GB total</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 