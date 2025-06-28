export default function SimpleCSSTest() {
  return (
    <div className="min-h-screen bg-blue-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Simple CSS Test
        </h1>
        
        {/* Basic Tailwind Test */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Basic Tailwind Styles Test
          </h2>
          <p className="text-gray-600 mb-4">
            This should have white background, rounded corners, padding, and shadow.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
            Test Button
          </button>
        </div>

        {/* Gradient Test */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Gradient Background Test
          </h2>
          <p className="text-white">
            This should have a purple to pink gradient background.
          </p>
        </div>

        {/* Animation Test */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Animation Test
          </h2>
          <div className="animate-bounce bg-red-500 w-16 h-16 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">
            The red circle above should be bouncing.
          </p>
        </div>

        {/* Grid Test */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Grid Layout Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-500 h-20 rounded flex items-center justify-center text-white font-medium">
              Grid 1
            </div>
            <div className="bg-yellow-500 h-20 rounded flex items-center justify-center text-white font-medium">
              Grid 2
            </div>
            <div className="bg-red-500 h-20 rounded flex items-center justify-center text-white font-medium">
              Grid 3
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-medium">
            ✅ If you can see this page with proper colors, layouts, and the bouncing animation, 
            then Tailwind CSS is working correctly!
          </p>
        </div>
      </div>
    </div>
  );
}