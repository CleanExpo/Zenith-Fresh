'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Monitor, Tablet, Smartphone, Zap, TrendingUp, Shield, Globe, Eye, CheckCircle, Clock, Users } from 'lucide-react';

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

// --- Helper Components ---
const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-start pt-20" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
};

// --- Main Component ---
export default function VisionSandbox({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // State for all features
  const [siteUrl, setSiteUrl] = useState('');
  const [competitorUrl1, setCompetitorUrl1] = useState('');
  const [competitorUrl2, setCompetitorUrl2] = useState('');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showCompetitorOverlay, setShowCompetitorOverlay] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [activeTab, setActiveTab] = useState('roadmap');
  const [performanceScore, setPerformanceScore] = useState({ lcp: 1.5, cls: 0.05 }); // Baseline
  
  const userTier = 'Pro';
  const tierLevels = { 'Free': 0, 'Pro': 1, 'Business': 2, 'Enterprise': 3 };
  
  const deviceWidths: any = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  const handleAnalyzeSite = () => {
    if (!siteUrl) {
      alert('Please enter a website URL to analyze');
      return;
    }
    // Simulate analysis with loading
    setIsAnalyzed(true);
    setRecommendations(mockAuditData.recommendations);
  };
  
  // Calculate performance impact on recommendation change
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
    const isLocked = tierLevels[userTier] < tierLevels['Enterprise'];
    if(isLocked) { 
      alert('AI Scenarios are an Enterprise feature. Please upgrade.'); 
      return; 
    }

    let scenarioRecs = recommendations.map(rec => ({ ...rec, active: false }));
    scenario.recIds.forEach((recId: string) => {
      const recIndex = scenarioRecs.findIndex(r => r.id === recId);
      if(recIndex !== -1) {
        scenarioRecs[recIndex].active = true;
      }
    });
    setRecommendations(scenarioRecs);
  };

  const toggleRecommendation = (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, active: !rec.active } : rec
      )
    );
  };

  const PerformanceMeter = ({ label, value, goodThreshold, badThreshold, unit }: any) => {
    const isGood = value <= goodThreshold;
    const isBad = value > badThreshold;
    const color = isBad ? 'text-red-500' : isGood ? 'text-green-500' : 'text-yellow-500';
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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">The Zenith Command Center</h1>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mb-8">Enter your site and up to two competitors to generate your complete strategic and competitive blueprint.</p>
          <div className="space-y-4">
            <input 
              type="text" 
              value={siteUrl} 
              onChange={(e) => setSiteUrl(e.target.value)} 
              placeholder="https://your-website.com (Required)" 
              className="w-full p-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
            <input 
              type="text" 
              value={competitorUrl1}
              onChange={(e) => setCompetitorUrl1(e.target.value)}
              placeholder="https://competitor-one.com (Optional, Enterprise Plan)" 
              className="w-full p-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
            <input 
              type="text" 
              value={competitorUrl2}
              onChange={(e) => setCompetitorUrl2(e.target.value)}
              placeholder="https://competitor-two.com (Optional, Enterprise Plan)" 
              className="w-full p-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
            <button 
              onClick={handleAnalyzeSite} 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg font-bold text-lg hover:scale-105 transition-transform"
            >
              Generate Blueprint
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main sandbox JSX with all features integrated
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b p-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">Zenith Command Center</h1>
          <div className="text-sm text-gray-500">{siteUrl}</div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2">
          <X className="w-6 h-6" />
        </button>
      </header>
      
      <div className="flex-grow flex overflow-hidden">
        {/* Control Panel */}
        <aside className="w-[420px] bg-white border-r flex flex-col shadow-lg">
          {/* Tabs */}
          <div className="flex border-b">
            <button 
              className={`flex-1 p-3 font-medium ${activeTab === 'roadmap' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('roadmap')}
            >
              Roadmap
            </button>
            <button 
              className={`flex-1 p-3 font-medium ${activeTab === 'deployment' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('deployment')}
            >
              Deployment
            </button>
          </div>

          {/* Performance Meter */}
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-md mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance Impact
            </h3>
            <div className="flex justify-around bg-white p-3 rounded-lg shadow-sm">
              <PerformanceMeter label="LCP" value={performanceScore.lcp} goodThreshold={2.5} badThreshold={4.0} unit="s" />
              <PerformanceMeter label="CLS" value={performanceScore.cls} goodThreshold={0.1} badThreshold={0.25} unit="" />
            </div>
          </div>

          {/* AI Scenarios */}
          <div className="p-4 border-b">
            <h3 className="font-semibold text-md mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI-Generated Scenarios
            </h3>
            {mockAuditData.aiScenarios.map(scenario => (
              <button 
                key={scenario.id} 
                onClick={() => handleApplyScenario(scenario)} 
                className="w-full text-left p-3 mb-2 rounded-md hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                <p className="font-bold text-sm">{scenario.name}</p>
                <p className="text-xs text-gray-500">{scenario.description}</p>
              </button>
            ))}
            {tierLevels[userTier] < tierLevels['Enterprise'] && (
              <div className="text-center text-xs text-gray-500 mt-2 p-2 bg-yellow-50 rounded border">
                Upgrade to Enterprise to use AI Scenarios
              </div>
            )}
          </div>

          {/* Roadmap Recommendations List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-semibold text-md mb-3">Recommendations</h3>
            <ul className="space-y-3">
              {recommendations.map((rec) => {
                const isLocked = rec.requiredTier && tierLevels[userTier] < tierLevels[rec.requiredTier];
                return (
                  <li key={rec.id} className={`border rounded-lg p-3 ${rec.active ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'} ${isLocked ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            checked={rec.active}
                            onChange={() => !isLocked && toggleRecommendation(rec.id)}
                            disabled={isLocked}
                            className="rounded"
                          />
                          <span className="font-medium text-sm">{rec.title}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          <span className={`px-2 py-1 rounded ${rec.category === 'Quick Win' ? 'bg-green-100 text-green-800' : rec.category === 'Major Project' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                            {rec.category}
                          </span>
                          {rec.requiredTier && (
                            <span className="ml-2 px-2 py-1 rounded bg-purple-100 text-purple-800">
                              {rec.requiredTier}+
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          Impact: <span className="font-medium text-blue-600">+{rec.impact.score} {rec.impact.unit}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
        
        {/* Preview Panel */}
        <main className="flex-grow bg-gray-200 p-4 flex flex-col items-center">
          {/* Device Toggles */}
          <div className="w-full flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <label htmlFor="comp-toggle" className="text-sm font-semibold">Competitive Overlay</label>
              <div className="relative">
                <input 
                  type="checkbox" 
                  id="comp-toggle" 
                  className="sr-only" 
                  onChange={(e) => setShowCompetitorOverlay(e.target.checked)} 
                  disabled={tierLevels[userTier] < tierLevels['Enterprise']} 
                />
                <div className={`block w-10 h-6 rounded-full cursor-pointer ${showCompetitorOverlay ? 'bg-purple-600' : 'bg-gray-300'} ${tierLevels[userTier] < tierLevels['Enterprise'] ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showCompetitorOverlay ? 'translate-x-4' : ''}`}></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDevice('desktop')} 
                className={`p-2 rounded ${device === 'desktop' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setDevice('tablet')} 
                className={`p-2 rounded ${device === 'tablet' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setDevice('mobile')} 
                className={`p-2 rounded ${device === 'mobile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Preview Iframe with Overlay */}
          <div className="relative w-full h-full flex justify-center">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all" style={{ width: deviceWidths[device], maxWidth: '100%' }}>
              <div className="w-full h-full p-4 bg-gray-50">
                <div className="text-center py-20">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Website Preview</h2>
                  <p className="text-gray-600 mb-4">Your website preview would appear here</p>
                  <div className="bg-white p-6 rounded-lg shadow-sm max-w-md mx-auto">
                    <h3 className="text-lg font-semibold mb-2">Sample Content</h3>
                    <p className="text-gray-600 text-sm">This simulates how your website changes would appear in real-time as you toggle recommendations.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitor Overlay */}
            {showCompetitorOverlay && (
              <div className="absolute inset-0 pointer-events-none">
                {mockAuditData.competitorInsights.map(insight => (
                  <div 
                    key={insight.id} 
                    className="absolute p-2 bg-purple-600 text-white text-xs rounded-lg shadow-xl max-w-xs" 
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
