'use client';

import React, { useState } from 'react';
import { RealTimeAnalyticsDashboard } from '@/components/business-intelligence/RealTimeAnalyticsDashboard';
import { PredictiveAnalytics } from '@/components/business-intelligence/PredictiveAnalytics';
import { ReportBuilder } from '@/components/business-intelligence/ReportBuilder';
import { CohortAnalysis } from '@/components/business-intelligence/CohortAnalysis';
import { ABTestingPlatform } from '@/components/business-intelligence/ABTestingPlatform';
import { ExecutiveDashboard } from '@/components/business-intelligence/ExecutiveDashboard';
import { AutomatedInsights } from '@/components/business-intelligence/AutomatedInsights';
import { DataExportSharingHub } from '@/components/business-intelligence/DataExportSharingHub';

export default function BusinessIntelligencePage() {
  const [activeModule, setActiveModule] = useState<string>('overview');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const modules = [
    {
      id: 'overview',
      name: 'Overview',
      icon: '📊',
      description: 'Executive dashboard and key insights',
      component: ExecutiveDashboard
    },
    {
      id: 'realtime',
      name: 'Real-time Analytics',
      icon: '⚡',
      description: 'Live data streaming and monitoring',
      component: RealTimeAnalyticsDashboard
    },
    {
      id: 'predictive',
      name: 'Predictive Analytics',
      icon: '🔮',
      description: 'ML forecasting and predictions',
      component: PredictiveAnalytics
    },
    {
      id: 'cohorts',
      name: 'Cohort Analysis',
      icon: '👥',
      description: 'User retention and behavior patterns',
      component: CohortAnalysis
    },
    {
      id: 'abtesting',
      name: 'A/B Testing',
      icon: '🧪',
      description: 'Experiments and statistical analysis',
      component: ABTestingPlatform
    },
    {
      id: 'insights',
      name: 'AI Insights',
      icon: '🧠',
      description: 'Automated insights and anomaly detection',
      component: AutomatedInsights
    },
    {
      id: 'reports',
      name: 'Report Builder',
      icon: '📝',
      description: 'Custom reports with drag-and-drop',
      component: ReportBuilder
    },
    {
      id: 'sharing',
      name: 'Data Export & Sharing',
      icon: '🔗',
      description: 'Export data and manage permissions',
      component: DataExportSharingHub
    }
  ];

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component || ExecutiveDashboard;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navigation Bar */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Business Intelligence Platform</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Comprehensive analytics, insights, and data intelligence
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`p-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } transition-colors`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              
              {/* Help Button */}
              <button className={`px-4 py-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } transition-colors`}>
                Help & Docs
              </button>
            </div>
          </div>
        </div>
        
        {/* Module Navigation */}
        <div className="px-6">
          <nav className="flex space-x-1 overflow-x-auto pb-4">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeModule === module.id
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={module.description}
              >
                <span className="text-lg">{module.icon}</span>
                <span className="text-sm font-medium">{module.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        <ActiveComponent theme={theme} />
      </div>

      {/* Quick Stats Footer */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t px-6 py-3`}>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>Real-time data: Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>Analytics processing: Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span>ML models: 3 running</span>
            </div>
          </div>
          
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Last updated: {new Date().toLocaleTimeString()} | 
            Data freshness: &lt; 1 minute | 
            Platform status: All systems operational
          </div>
        </div>
      </div>
    </div>
  );
}