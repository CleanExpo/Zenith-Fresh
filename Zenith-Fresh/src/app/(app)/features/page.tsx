'use client';

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Features</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">AI-Powered Analysis</h3>
            <p className="text-gray-600">
              Advanced AI algorithms analyze your website for optimal performance and SEO.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Real-time Monitoring</h3>
            <p className="text-gray-600">
              Monitor your website's health and performance in real-time with detailed metrics.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Competitive Analysis</h3>
            <p className="text-gray-600">
              Compare your performance against competitors and identify opportunities.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Expert Recommendations</h3>
            <p className="text-gray-600">
              Get actionable insights and recommendations from industry experts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}