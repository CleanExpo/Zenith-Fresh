export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-2xl mx-auto p-8">
          <h1 className="text-6xl font-bold text-white mb-6">
            🎯 ZENITH PLATFORM
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            Server Configuration Test - Ultra Minimal Version
          </p>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-6">
            <p className="text-green-300 text-lg">
              ✅ SUCCESS: Server is running without configuration errors!
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-blue-300">
              This ultra-minimal page proves the server configuration is working.
              <br />
              No database, no auth, no external dependencies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
