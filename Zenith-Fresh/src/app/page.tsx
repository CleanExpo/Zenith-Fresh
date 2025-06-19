export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Zenith Fresh
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-Driven SaaS Optimization Platform
        </p>
        <p className="text-lg text-gray-500 mb-12">
          Complete AI-driven optimization platform with E-E-A-T compliance, 
          GEO optimization, competitive analysis, and intelligent deployment management.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">E-E-A-T Compliance</h3>
            <p className="text-gray-600">
              Experience, Expertise, Authoritativeness, and Trustworthiness analysis
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">GEO Optimization</h3>
            <p className="text-gray-600">
              Generative Engine Optimization for AI search visibility
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Smart Deployment</h3>
            <p className="text-gray-600">
              Intelligent traffic management and auto-scaling architecture
            </p>
          </div>
        </div>
        
        <div className="space-x-4">
          <a
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  )
}