'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { 
  Building2, 
  Globe, 
  MessageSquare, 
  Share2,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface OnboardingWizardProps {
  onComplete?: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    website: '',
    phone: '',
    address: ''
  });

  const handleBusinessInfoSubmit = () => {
    setCompletedSteps(prev => new Set([...Array.from(prev), 0]));
    setCurrentStep(1);
  };

  const handleOAuthConnect = (platform: string) => {
    // In production, this would initiate OAuth flow
    console.log(`Connecting to ${platform}...`);
    // Mock connection success
    setTimeout(() => {
      alert(`Successfully connected to ${platform}!`);
    }, 1000);
  };

  const handleGMBConnect = () => {
    setCompletedSteps(prev => new Set([...Array.from(prev), 1]));
    setCurrentStep(2);
  };

  const steps: Step[] = [
    {
      id: 'business-info',
      title: 'Business Information',
      description: 'Tell us about your business',
      icon: <Building2 className="w-5 h-5" />,
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              value={businessInfo.name}
              onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
              placeholder="Your Business Name"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={businessInfo.website}
              onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
              placeholder="https://yourbusiness.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={businessInfo.phone}
              onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="address">Business Address</Label>
            <Input
              id="address"
              value={businessInfo.address}
              onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
              placeholder="123 Main St, City, State ZIP"
            />
          </div>
          <Button 
            onClick={handleBusinessInfoSubmit}
            className="w-full"
            disabled={!businessInfo.name || !businessInfo.website}
          >
            Continue
          </Button>
        </div>
      )
    },
    {
      id: 'gmb-connect',
      title: 'Google My Business',
      description: 'Connect your Google Business Profile',
      icon: <Globe className="w-5 h-5" />,
      component: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Why connect Google My Business?</h4>
            <ul className="text-sm space-y-1">
              <li>• Monitor and respond to customer reviews</li>
              <li>• Track your local search rankings</li>
              <li>• Update business information instantly</li>
              <li>• View insights and analytics</li>
            </ul>
          </div>
          <Button 
            onClick={() => {
              signIn('google');
              // Note: In production, we'd handle the callback to mark this step complete
              handleGMBConnect();
            }}
            className="w-full"
          >
            <Globe className="w-4 h-4 mr-2" />
            Connect with Google
          </Button>
          <Button variant="outline" onClick={handleGMBConnect} className="w-full">
            Skip for now
          </Button>
        </div>
      )
    },
    {
      id: 'social-connect',
      title: 'Social Media',
      description: 'Connect your social media accounts',
      icon: <Share2 className="w-5 h-5" />,
      component: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your social accounts to manage everything from one dashboard
          </p>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleOAuthConnect('Facebook')}
            >
              <div className="w-4 h-4 mr-2 bg-blue-600 rounded" />
              Connect Facebook
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleOAuthConnect('Instagram')}
            >
              <div className="w-4 h-4 mr-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded" />
              Connect Instagram
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleOAuthConnect('X (Twitter)')}
            >
              <div className="w-4 h-4 mr-2 bg-black rounded" />
              Connect X (Twitter)
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleOAuthConnect('LinkedIn')}
            >
              <div className="w-4 h-4 mr-2 bg-blue-700 rounded" />
              Connect LinkedIn
            </Button>
          </div>
          <Button 
            onClick={() => {
              setCompletedSteps(prev => new Set([...Array.from(prev), 2]));
              setCurrentStep(3);
            }}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      )
    },
    {
      id: 'review-platforms',
      title: 'Review Platforms',
      description: 'Connect additional review platforms',
      icon: <MessageSquare className="w-5 h-5" />,
      component: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Monitor reviews from multiple platforms in one place
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Google Reviews</span>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => handleOAuthConnect('Yelp')}
            >
              <span>Yelp</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => handleOAuthConnect('Trustpilot')}
            >
              <span>Trustpilot</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            onClick={() => {
              setCompletedSteps(prev => new Set([...Array.from(prev), 3]));
              if (onComplete) onComplete();
            }}
            className="w-full"
          >
            Complete Setup
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Zenith Platform</h1>
        <p className="text-gray-600">Let&apos;s get your online presence set up in just a few steps</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${completedSteps.has(index) 
                  ? 'bg-green-600 text-white' 
                  : index === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }
              `}>
                {completedSteps.has(index) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  h-1 w-full mx-2
                  ${completedSteps.has(index) ? 'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm">
          {steps.map((step, index) => (
            <span 
              key={step.id} 
              className={`
                ${index === currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'}
              `}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl hover:shadow-3xl hover:bg-white/15 hover:border-white/25 p-8 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="text-blue-600">
              {steps[currentStep].icon}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{steps[currentStep].title}</h2>
            <p className="text-white/70">{steps[currentStep].description}</p>
          </div>
        </div>
        {steps[currentStep].component}
      </Card>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Need help?</p>
            <p className="text-gray-600">
              Contact our support team at support@zenithplatform.com or check our{' '}
              <a href="#" className="text-blue-600 underline">setup guide</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
