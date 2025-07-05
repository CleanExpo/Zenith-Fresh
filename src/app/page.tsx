export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Zenith Platform
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Server Configuration Test - Minimal Page
          </p>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-300">
              ✅ If you can see this page, the server error is resolved!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
