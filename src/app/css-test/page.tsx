import { Brain, Zap, Users, CheckCircle } from 'lucide-react';

export default function CSSTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* CSS Test Header */}
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient">
            CSS Enhancement Test Page
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This page tests the new enterprise-grade CSS system with glass morphism, 
            animations, and responsive design enhancements.
          </p>
        </div>

        {/* Glass Morphism Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-elevated glass-morphism p-6 hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="h-8 w-8 text-blue-600" />
              <h3 className="text-lg font-semibold text-gradient">AI Analysis</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Advanced content analysis with glass morphism styling
            </p>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors btn-modern">
              Analyze
            </button>
          </div>

          <div className="card-elevated glass-morphism p-6 hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-8 w-8 text-purple-600" />
              <h3 className="text-lg font-semibold text-gradient">Performance</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              GPU-accelerated animations and optimized CSS
            </p>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors btn-modern">
              Optimize
            </button>
          </div>

          <div className="card-elevated glass-morphism p-6 hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-8 w-8 text-green-600" />
              <h3 className="text-lg font-semibold text-gradient">Responsive</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Mobile-first responsive design with flexible breakpoints
            </p>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors btn-modern">
              Test
            </button>
          </div>

          <div className="card-elevated glass-morphism p-6 hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-8 w-8 text-orange-600" />
              <h3 className="text-lg font-semibold text-gradient">Success</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enterprise-grade styling system deployed successfully
            </p>
            <button className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors btn-modern">
              Deploy
            </button>
          </div>
        </div>

        {/* Animation Test Section */}
        <div className="glass-morphism p-8 text-center space-y-6 animate-slide-up">
          <h2 className="text-2xl font-bold text-gradient">Animation Test</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="animate-bounce-in px-6 py-3 bg-blue-100 text-blue-800 rounded-full font-medium">
              Bounce In
            </div>
            <div className="animate-pulse-glow px-6 py-3 bg-purple-100 text-purple-800 rounded-full font-medium">
              Pulse Glow
            </div>
            <div className="animate-float px-6 py-3 bg-green-100 text-green-800 rounded-full font-medium">
              Float
            </div>
            <div className="animate-wiggle px-6 py-3 bg-orange-100 text-orange-800 rounded-full font-medium">
              Wiggle
            </div>
          </div>
        </div>

        {/* Responsive Grid Test */}
        <div className="glass-morphism p-6">
          <h2 className="text-xl font-bold text-gradient mb-4">Responsive Grid Test</h2>
          <div className="grid-responsive">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg hover-lift"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Styling Verification */}
        <div className="text-center space-y-4 glass-morphism p-6">
          <h2 className="text-xl font-bold text-gradient">Styling Verification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="status-success">
              ✅ Glass Morphism
            </div>
            <div className="status-success">
              ✅ Text Gradients
            </div>
            <div className="status-success">
              ✅ Animations
            </div>
            <div className="status-success">
              ✅ Responsive Design
            </div>
          </div>
          <p className="text-gray-600 mt-4">
            If you can see this page with proper styling, glass effects, animations, 
            and responsive layout, the CSS enhancements have been successfully deployed!
          </p>
        </div>
      </div>

      {/* Breakpoint Indicator */}
      <div className="fixed bottom-4 right-4 bg-black text-white px-3 py-2 rounded-md text-sm font-mono z-50">
        <span className="sm:hidden">XS (&lt; 640px)</span>
        <span className="hidden sm:inline md:hidden">SM (640px+)</span>
        <span className="hidden md:inline lg:hidden">MD (768px+)</span>
        <span className="hidden lg:inline xl:hidden">LG (1024px+)</span>
        <span className="hidden xl:inline 2xl:hidden">XL (1280px+)</span>
        <span className="hidden 2xl:inline">2XL (1536px+)</span>
      </div>
    </div>
  );
}