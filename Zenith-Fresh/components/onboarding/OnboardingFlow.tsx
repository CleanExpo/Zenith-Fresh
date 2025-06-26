'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  SkipForward as Skip, 
  Play,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Target,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  icon: React.ComponentType<{ className?: string }>;
  estimatedTime: number; // minutes
  isRequired: boolean;
}

interface OnboardingStepProps {
  onComplete: () => void;
  onSkip: () => void;
  isActive: boolean;
}

interface OnboardingData {
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  isCompleted: boolean;
  hasCreatedProject: boolean;
  hasRunFirstScan: boolean;
  hasInvitedTeamMember: boolean;
  hasCustomizedDashboard: boolean;
  hasSetupNotifications: boolean;
  timeSpentOnSteps?: Record<string, number>;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Zenith',
    description: 'Get familiar with your new AI-powered platform',
    component: WelcomeStep,
    icon: Sparkles,
    estimatedTime: 2,
    isRequired: true
  },
  {
    id: 'create-project',
    title: 'Create Your First Project',
    description: 'Set up a project to start analyzing your website',
    component: CreateProjectStep,
    icon: Target,
    estimatedTime: 3,
    isRequired: true
  },
  {
    id: 'run-scan',
    title: 'Run Your First Analysis',
    description: 'Experience our comprehensive website analysis',
    component: RunScanStep,
    icon: BarChart3,
    estimatedTime: 5,
    isRequired: true
  },
  {
    id: 'invite-team',
    title: 'Invite Team Members',
    description: 'Collaborate with your team on projects',
    component: InviteTeamStep,
    icon: Users,
    estimatedTime: 2,
    isRequired: false
  },
  {
    id: 'customize-dashboard',
    title: 'Customize Your Dashboard',
    description: 'Personalize your workspace for optimal productivity',
    component: CustomizeDashboardStep,
    icon: Settings,
    estimatedTime: 3,
    isRequired: false
  }
];

interface OnboardingFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps = {}) {
  const { data: session } = useSession();
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    currentStep: 0,
    completedSteps: [],
    skippedSteps: [],
    isCompleted: false,
    hasCreatedProject: false,
    hasRunFirstScan: false,
    hasInvitedTeamMember: false,
    hasCustomizedDashboard: false,
    hasSetupNotifications: false
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());

  useEffect(() => {
    if (session?.user?.id) {
      loadOnboardingData();
    }
  }, [session?.user?.id]);

  const loadOnboardingData = async () => {
    try {
      const response = await fetch('/api/onboarding');
      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);
        setIsVisible(!data.isCompleted);
      } else {
        // First time user, show onboarding
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
      setIsVisible(true);
    }
  };

  const saveOnboardingData = async (data: Partial<OnboardingData>) => {
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  const handleStepComplete = async () => {
    const currentStepId = onboardingSteps[onboardingData.currentStep].id;
    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    
    const newCompletedSteps = [...onboardingData.completedSteps, currentStepId];
    const newCurrentStep = onboardingData.currentStep + 1;
    const isCompleted = newCurrentStep >= onboardingSteps.length;
    
    const updatedData = {
      ...onboardingData,
      currentStep: newCurrentStep,
      completedSteps: newCompletedSteps,
      isCompleted
    };
    
    setOnboardingData(updatedData);
    
    // Save progress
    await saveOnboardingData({
      ...updatedData,
      timeSpentOnSteps: {
        ...onboardingData.timeSpentOnSteps,
        [currentStepId]: timeSpent
      }
    });
    
    // Track success metric
    await fetch('/api/user-success-metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metricType: 'milestone-completion',
        metricName: `onboarding-step-${currentStepId}`,
        value: timeSpent,
        unit: 'seconds',
        category: 'onboarding',
        milestone: currentStepId
      })
    });
    
    if (isCompleted) {
      setIsVisible(false);
      // Track overall onboarding completion
      await fetch('/api/user-success-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metricType: 'time-to-value',
          metricName: 'onboarding-completion',
          value: Math.floor((new Date().getTime() - new Date((session?.user as any)?.createdAt || Date.now()).getTime()) / (1000 * 60)),
          unit: 'minutes',
          category: 'onboarding',
          milestone: 'onboarding-complete'
        })
      });
    }
    
    setStartTime(new Date());
  };

  const handleStepSkip = async () => {
    const currentStepId = onboardingSteps[onboardingData.currentStep].id;
    
    const newSkippedSteps = [...onboardingData.skippedSteps, currentStepId];
    const newCurrentStep = onboardingData.currentStep + 1;
    const isCompleted = newCurrentStep >= onboardingSteps.length;
    
    const updatedData = {
      ...onboardingData,
      currentStep: newCurrentStep,
      skippedSteps: newSkippedSteps,
      isCompleted
    };
    
    setOnboardingData(updatedData);
    await saveOnboardingData(updatedData);
    
    if (isCompleted) {
      setIsVisible(false);
    }
    
    setStartTime(new Date());
  };

  const handlePrevious = () => {
    if (onboardingData.currentStep > 0) {
      setOnboardingData({
        ...onboardingData,
        currentStep: onboardingData.currentStep - 1
      });
    }
  };

  const handleDismiss = async () => {
    const updatedData = {
      ...onboardingData,
      hasSkippedTour: true,
      isCompleted: true
    };
    
    setOnboardingData(updatedData);
    await saveOnboardingData(updatedData);
    setIsVisible(false);
  };

  const progress = (onboardingData.completedSteps.length / onboardingSteps.length) * 100;
  const currentStep = onboardingSteps[onboardingData.currentStep];

  if (!isVisible || !session?.user) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Welcome to Zenith</h2>
                  <p className="text-blue-100">Let's get you set up for success</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20"
              >
                Skip Tour
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress: {onboardingData.completedSteps.length} of {onboardingSteps.length} steps</span>
                <span>Step {onboardingData.currentStep + 1}</span>
              </div>
              <Progress value={progress} className="bg-white/20" />
            </div>
          </div>

          {/* Step Indicator */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              {onboardingSteps.map((step, index) => {
                const isCompleted = onboardingData.completedSteps.includes(step.id);
                const isSkipped = onboardingData.skippedSteps.includes(step.id);
                const isCurrent = index === onboardingData.currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                      ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                        isSkipped ? 'bg-gray-400 border-gray-400 text-white' :
                        isCurrent ? 'bg-blue-500 border-blue-500 text-white' : 
                        'bg-white border-gray-300 text-gray-400'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : isSkipped ? (
                        <Skip className="h-4 w-4" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    
                    {index < onboardingSteps.length - 1 && (
                      <div className={`
                        w-12 h-0.5 mx-2 transition-colors
                        ${isCompleted || (index < onboardingData.currentStep) ? 'bg-green-500' : 'bg-gray-300'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6 min-h-[400px]">
            {currentStep && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <currentStep.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentStep.title}</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">{currentStep.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Estimated time: {currentStep.estimatedTime} minutes
                  </div>
                </div>

                <div className="max-w-3xl mx-auto">
                  <currentStep.component
                    onComplete={handleStepComplete}
                    onSkip={handleStepSkip}
                    isActive={true}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={onboardingData.currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <div className="text-sm text-gray-500">
              {currentStep?.isRequired ? 'Required step' : 'Optional step'}
            </div>
            
            <div className="flex items-center space-x-2">
              {!currentStep?.isRequired && (
                <Button variant="ghost" onClick={handleStepSkip}>
                  Skip
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Individual Step Components
function WelcomeStep({ onComplete }: OnboardingStepProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h4 className="text-xl font-semibold">Welcome to Zenith Platform!</h4>
            <p className="text-gray-600 leading-relaxed">
              Zenith is your AI-powered comprehensive platform for website optimization, 
              competitive intelligence, and business growth. We'll help you:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Analyze & Optimize</h5>
              <p className="text-sm text-blue-700">
                Get comprehensive website analysis with performance, SEO, and accessibility insights
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h5 className="font-medium text-purple-900 mb-2">Competitive Intelligence</h5>
              <p className="text-sm text-purple-700">
                Monitor competitors and identify opportunities in your market
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">Team Collaboration</h5>
              <p className="text-sm text-green-700">
                Work together with your team on projects and share insights
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h5 className="font-medium text-orange-900 mb-2">AI-Powered Insights</h5>
              <p className="text-sm text-orange-700">
                Leverage AI for automated analysis and intelligent recommendations
              </p>
            </div>
          </div>
          
          <Button onClick={onComplete} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Play className="h-4 w-4 mr-2" />
            Let's Get Started
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateProjectStep({ onComplete, onSkip }: OnboardingStepProps) {
  const [projectName, setProjectName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!projectName.trim() || !projectUrl.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: projectName,
          url: projectUrl,
          description: 'My first Zenith project'
        })
      });
      
      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-2">Create Your First Project</h4>
            <p className="text-gray-600">
              Projects help you organize and track your website analysis efforts.
            </p>
          </div>
          
          <div className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., My Company Website"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={onSkip}>
              Skip for Now
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={!projectName.trim() || !projectUrl.trim() || isCreating}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RunScanStep({ onComplete, onSkip }: OnboardingStepProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleRunScan = async () => {
    if (!selectedProject) return;
    
    setIsScanning(true);
    try {
      const response = await fetch('/api/website-analyzer/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: selectedProject,
          scanType: 'onboarding'
        })
      });
      
      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error('Error running scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-2">Run Your First Analysis</h4>
            <p className="text-gray-600">
              Experience our comprehensive website analysis to see what Zenith can do for you.
            </p>
          </div>
          
          {projects.length > 0 ? (
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project to Analyze
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {projects.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.url}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">What you'll get:</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Performance analysis with Core Web Vitals</li>
                  <li>• SEO optimization recommendations</li>
                  <li>• Accessibility compliance check</li>
                  <li>• Security and technical analysis</li>
                  <li>• Actionable improvement suggestions</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                You need to create a project first to run an analysis.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Create a Project First
              </Button>
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={onSkip}>
              Skip for Now
            </Button>
            {projects.length > 0 && (
              <Button 
                onClick={handleRunScan}
                disabled={!selectedProject || isScanning}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {isScanning ? 'Analyzing...' : 'Run Analysis'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InviteTeamStep({ onComplete, onSkip }: OnboardingStepProps) {
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    
    setIsInviting(true);
    try {
      // This would integrate with your team invitation system
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onComplete();
    } catch (error) {
      console.error('Error sending invitation:', error);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-2">Invite Your Team</h4>
            <p className="text-gray-600">
              Collaboration makes optimization easier. Invite your team members to join your workspace.
            </p>
          </div>
          
          <div className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Member Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">Team benefits:</h5>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Share projects and analysis results</li>
                <li>• Collaborate on optimization strategies</li>
                <li>• Assign tasks and track progress</li>
                <li>• Centralized reporting and insights</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={onSkip}>
              I'll Do This Later
            </Button>
            <Button 
              onClick={handleInvite}
              disabled={!email.trim() || isInviting}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomizeDashboardStep({ onComplete, onSkip }: OnboardingStepProps) {
  const [preferences, setPreferences] = useState({
    showPerformanceCharts: true,
    showCompetitorUpdates: true,
    showTeamActivity: false,
    defaultView: 'overview'
  });

  const handleSavePreferences = async () => {
    try {
      // This would save dashboard preferences
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onComplete();
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-2">Customize Your Dashboard</h4>
            <p className="text-gray-600">
              Make Zenith work the way you do. Customize your dashboard to show what matters most.
            </p>
          </div>
          
          <div className="space-y-4 max-w-md mx-auto">
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.showPerformanceCharts}
                  onChange={(e) => setPreferences({...preferences, showPerformanceCharts: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Show performance charts on dashboard</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.showCompetitorUpdates}
                  onChange={(e) => setPreferences({...preferences, showCompetitorUpdates: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Show competitor updates</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.showTeamActivity}
                  onChange={(e) => setPreferences({...preferences, showTeamActivity: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Show team activity feed</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Dashboard View
              </label>
              <select
                value={preferences.defaultView}
                onChange={(e) => setPreferences({...preferences, defaultView: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">Overview</option>
                <option value="projects">Projects</option>
                <option value="analytics">Analytics</option>
                <option value="competitors">Competitors</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={onSkip}>
              Use Defaults
            </Button>
            <Button 
              onClick={handleSavePreferences}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}