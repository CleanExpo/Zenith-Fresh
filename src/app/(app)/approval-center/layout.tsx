// Minimal layout for approval center to bypass createContext issues
export default function ApprovalCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Zenith Platform - Approval Center
          </h1>
        </div>
      </div>
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
