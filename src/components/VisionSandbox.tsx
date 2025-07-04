'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Monitor, Tablet, Smartphone, Zap, TrendingUp, Eye, Lock } from 'lucide-react';

// --- Final Mock Data with All Enhancements ---
const mockAuditData = {
  initialHtml: `<header class="header"><h1>Generic Company</h1><nav><a>Home</a><a>About</a><a>Contact</a></nav></header><main><section class="hero"><h2>Welcome to Our Website</h2><p>This is a sample landing page. Our services are top-notch and we value our customers.</p><img src="https://placehold.co/800x400/e2e8f0/4a5568?text=Hero+Image" alt="Placeholder Hero Image" /></section><section class="main-service"><h3>Our Main Service</h3><p>Details about the main service offering go here.</p></section></main><footer class="footer"><p>&copy; 2025 Generic Company</p></footer>`,
  recommendations: [
    { id: 'narrative-cta', title: 'Strengthen Homepage Call-to-Action', category: 'Quick Win', impact: { score: 15, unit: '% Conversion Lift' }, performance: { lcp: -0.1, cls: 0 }, comments: [{author: 'AI Agent', text: 'This is the lowest hanging fruit.'}], active: false },
    { id: 'eeat-author-bio', title: 'Add Author Bios to Articles', category: 'Major Project', impact: { score: 8, unit: 'E-E-A-T Pts' }, performance: { lcp: 0.2, cls: 0.01 }, comments: [], active: false },
    { id: 'eeat-testimonials', title: 'Integrate Customer Testimonials', category: 'Major Project', impact: { score: 12, unit: 'Trust Signal' }, performance: { lcp: 0.3, cls: 0.02 }, comments: [{author: 'Jane D.', text: 'Can we use our survey quotes?'}], active: false },
    { id: 'geo-schema', title: 'Implement Organization Schema', category: 'Major Project', requiredTier: 'Business', impact: { score: 20, unit: '% GEO Visibility' }, performance: { lcp: 0, cls: 0 }, comments: [], active: false },
    { id: 'visual-dark-mode', title: 'Introduce Dark Mode Theme', category: 'Fill-In', impact: { score: 5, unit: 'UX Score' }, performance: { lcp: 0, cls: 0 }, comments: [], active: false },
    { id: 'advanced-analytics', title: 'Set Up Advanced Goal Tracking', category: 'Major Project', requiredTier: 'Business', impact: { score: 25, unit: '% Data Clarity' }, performance: { lcp: 0.1, cls: 0 }, comments: [], active: false },
    { id: 'comp-analysis-video', title: 'Add Product Video like Competitor A', category: 'Major Project', requiredTier: 'Enterprise', impact: { score: 30, unit: '% Engagement' }, performance: { lcp: 1.2, cls: 0 }, comments: [], active: false },
  ],
  competitorInsights: [
      { id: 'comp-1', text: "Competitor A's headline has a 15% higher predicted engagement.", position: { top: '20%', left: '10%' } },
      { id: 'comp-2', text: "Competitor B includes video testimonials here, boosting E-E-A-T.", position: { top: '65%', left: '55%' } },
  ],
  aiScenarios: [
      { id: 'trust-builder', name: 'The Trust Builder', description: 'Prioritizes E-E-A-T and transparency to build authority.', recIds: ['eeat-author-bio', 'eeat-testimonials', 'geo-schema'] },
      { id: 'conversion-king', name: 'The Conversion King', description: 'Focuses on strong CTAs and narrative changes to drive action.', recIds: ['narrative-cta', 'eeat-testimonials'] },
  ],
};

// --- Main Component ---
export default function VisionSandbox({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [siteUrl, setSiteUrl] = useState('');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showCompetitorOverlay, setShowCompetitorOverlay] = useState(false);
  const [performanceScore, setPerformanceScore] = useState({ lcp: 1.5, cls: 0.05 });
  const [userTier] = useState('Pro');
  const tierLevels = { 'Free': 0, 'Pro': 1, 'Business': 2, 'Enterprise': 3 };

  const handleAnalyzeSite = () => { 
    if (!siteUrl) {
      alert('Please enter a website URL to analyze');
      return;
    }
    setIsAnalyzed(true); 
    setRecommendations(mockAuditData.recommendations); 
  };
  
  useEffect(() => {
    const baseline = { lcp: 1.5, cls: 0.05 };
    const newScore = recommendations.reduce((acc, rec) => {
      if (rec.active) {
        acc.lcp += rec.performance.lcp;
        acc.cls += rec.performance.cls;
      }
      return acc;
    }, baseline);
    setPerformanceScore(newScore);
  }, [recommendations]);
  
  const handleApplyScenario = (scenario: any) => {
    if (tierLevels[userTier as keyof typeof tierLevels] < tierLevels['Enterprise']) { 
      alert('AI Scenarios are an Enterprise feature.'); 
      return; 
    }
    setRecommendations(recs => recs.map(rec => ({ ...rec, active: scenario.recIds.includes(rec.id) })));
  };

  const PerformanceMeter = ({ label, value, goodThreshold, badThreshold, unit }: any) => {
    const color = value > badThreshold ? 'text-red-500' : value > goodThreshold ? 'text-yellow-500' : 'text-green-500';
    return (
      <div className="text-center">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-bold text-lg ${color}`}>{value.toFixed(2)}{unit}</p>
      </div>
    );
  };

  if (!isOpen) return null;

  if (!isAnalyzed) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white z-50 flex items-center justify-center font-sans">
        <div className="w-full max-w-3xl text-center p-8">
          <div className="flex justify-between items-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://i.imgur.com/gC3v66I.png" alt="Zenith Logo" className="h-20 w-auto invert" />
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <h1 className="text-5xl font-bold mb-4">The Zenith Command Center</h1>
          <p className="text-lg text-gray-300 mb-8">Enter your site and up to two competitors to generate your complete strategic and competitive blueprint.</p>
          <div className="space-y-4 bg-gray-800 p-8 rounded-xl shadow-2xl">
            <input 
              type="text" 
              value={siteUrl} 
              onChange={(e) => setSiteUrl(e.target.value)} 
              placeholder="https://your-website.com (Required)" 
              className="w-full p-4 text-lg bg-gray-700 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white" 
            />
            <input 
              type="text" 
              placeholder="https://competitor-one.com (Optional, Enterprise Plan)" 
              className="w-full p-4 text-lg bg-gray-700 border-2 border-gray-600 rounded-lg disabled:opacity-50 text-white" 
              disabled={tierLevels[userTier as keyof typeof tierLevels] < tierLevels['Enterprise']} 
            />
            <input 
              type="text" 
              placeholder="https://competitor-two.com (Optional, Enterprise Plan)" 
              className="w-full p-4 text-lg bg-gray-700 border-2 border-gray-600 rounded-lg disabled:opacity-50 text-white" 
              disabled={tierLevels[userTier as keyof typeof tierLevels] < tierLevels['Enterprise']} 
            />
            <button 
              onClick={handleAnalyzeSite} 
              className="w-full bg-blue-600 p-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Generate Blueprint
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col font-sans">
      <header className="bg-white border-b p-3 flex justify-between items-center flex-shrink-0">
        <h1 className="font-bold text-xl">Zenith Command Center</h1>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
      </header>
      
      <div className="flex-grow flex overflow-hidden">
        <aside className="w-[420px] bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-md mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance Impact
            </h3>
            <div className="flex justify-around bg-gray-50 p-2 rounded-lg">
              <PerformanceMeter label="LCP" value={performanceScore.lcp} goodThreshold={2.5} badThreshold={4.0} unit="s" />
              <PerformanceMeter label="CLS" value={performanceScore.cls} goodThreshold={0.1} badThreshold={0.25} unit="" />
            </div>
          </div>

          <div className="p-4 border-b">
            <h3 className="font-semibold text-md mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI-Generated Scenarios
            </h3>
            {mockAuditData.aiScenarios.map(scenario => (
              <button 
                key={scenario.id} 
                onClick={() => handleApplyScenario(scenario)} 
                className="w-full text-left p-2 mb-1 rounded-md hover:bg-gray-100 disabled:opacity-50" 
                disabled={tierLevels[userTier as keyof typeof tierLevels] < tierLevels['Enterprise']}
              >
                <p className="font-bold flex items-center gap-2">
                  {scenario.name} 
                  {tierLevels[userTier as keyof typeof tierLevels] < tierLevels['Enterprise'] && <Lock className="w-4 h-4 text-gray-400" />}
                </p>
                <p className="text-xs text-gray-500">{scenario.description}</p>
              </button>
            ))}
          </div>

          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="comp-toggle" 
                onChange={(e) => setShowCompetitorOverlay(e.target.checked)} 
                disabled={tierLevels[userTier as keyof typeof tierLevels] < tierLevels['Enterprise']} 
                className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500" 
              />
              <label htmlFor="comp-toggle" className="font-semibold text-md">Competitive Overlay</label>
              {tierLevels[userTier as keyof typeof tierLevels] < tierLevels['Enterprise'] && <Lock className="w-4 h-4 text-gray-400" />}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4">
            <h3 className="font-semibold text-md mb-2">Manual Roadmap</h3>
            {recommendations.map(rec => (
              <div key={rec.id} className="p-2 mb-2 border-l-4 border-gray-200">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold">{rec.title}</h4>
                  <input 
                    type="checkbox" 
                    checked={rec.active} 
                    onChange={() => setRecommendations(recs => recs.map(r => r.id === rec.id ? {...r, active: !r.active} : r))} 
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" 
                  />
                </div>
                <p className="text-sm text-gray-600">{rec.impact.score}{rec.impact.unit}</p>
              </div>
            ))}
          </div>
        </aside>
        
        <main className="flex-grow bg-gray-200 p-4 flex flex-col items-center">
          <div className="relative w-full h-full flex justify-center">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ width: '100%' }}>
              <iframe 
                srcDoc={mockAuditData.initialHtml} 
                title="Website Preview" 
                className="w-full h-full border-0" 
              />
            </div>
            {showCompetitorOverlay && (
              <div className="absolute inset-0 pointer-events-none">
                {mockAuditData.competitorInsights.map(insight => (
                  <div 
                    key={insight.id} 
                    className="absolute p-2 bg-purple-600 text-white text-xs rounded-lg shadow-xl animate-pulse" 
                    style={insight.position}
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    {insight.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
