/**
 * Recommendation Card Component
 * Displays individual AI-powered recommendations with ROI insights
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  Target,
  CheckCircle2,
  ExternalLink,
  Code,
  BookOpen
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface RecommendationCardProps {
  recommendation: {
    id: string;
    title: string;
    description: string;
    category: 'seo' | 'performance' | 'content' | 'ux' | 'accessibility' | 'security';
    priority: 'critical' | 'high' | 'medium' | 'low';
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    estimatedImpact: {
      trafficIncrease: number;
      conversionImprovement: number;
      performanceGain: number;
      timeToComplete: string;
    };
    implementation: {
      steps: string[];
      resources: string[];
      codeExamples?: string;
      toolsNeeded: string[];
    };
    roiEstimate: {
      effort: number;
      value: number;
      paybackPeriod: string;
    };
  };
  onImplement?: (id: string) => void;
}

const RecommendationCard = ({ recommendation, onImplement }: RecommendationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'border-green-500 text-green-400';
      case 'medium': return 'border-yellow-500 text-yellow-400';
      case 'hard': return 'border-orange-500 text-orange-400';
      default: return 'border-red-500 text-red-400';
    }
  };

  const getCategoryIcon = () => {
    switch (recommendation.category) {
      case 'seo': return <Target className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'content': return <BookOpen className="w-4 h-4" />;
      case 'ux': return <Users className="w-4 h-4" />;
      case 'accessibility': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const roiScore = (recommendation.roiEstimate.value / recommendation.roiEstimate.effort * 10);

  return (
    <Card className="bg-white/5 border-white/10 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              {getCategoryIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{recommendation.title}</h3>
              <p className="text-gray-400 text-sm mb-3">{recommendation.description}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <Badge className={`${getPriorityColor(recommendation.priority)} text-xs px-2 py-1`}>
                  {recommendation.priority.toUpperCase()}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getDifficultyColor(recommendation.difficulty)}`}>
                  {recommendation.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs text-gray-400">
                  {recommendation.category.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-right ml-4">
            <div className="text-xs text-gray-400 mb-1">ROI Score</div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {roiScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">
              Payback: {recommendation.roiEstimate.paybackPeriod}
            </div>
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-green-400">
              +{recommendation.estimatedImpact.trafficIncrease}%
            </div>
            <div className="text-xs text-gray-400">Traffic</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <DollarSign className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-blue-400">
              +{recommendation.estimatedImpact.conversionImprovement}%
            </div>
            <div className="text-xs text-gray-400">Conversion</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-purple-400">
              {recommendation.estimatedImpact.timeToComplete}
            </div>
            <div className="text-xs text-gray-400">Time</div>
          </div>
        </div>

        {/* ROI Breakdown */}
        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Effort vs Value</span>
            <span className="text-sm text-green-400 font-medium">
              {((recommendation.roiEstimate.value / recommendation.roiEstimate.effort - 1) * 100).toFixed(0)}% ROI
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Effort</span>
              <div className="flex-1 mx-3">
                <Progress value={recommendation.roiEstimate.effort * 10} className="h-1" />
              </div>
              <span className="text-xs text-gray-400">{recommendation.roiEstimate.effort}/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Value</span>
              <div className="flex-1 mx-3">
                <Progress value={recommendation.roiEstimate.value * 10} className="h-1" />
              </div>
              <span className="text-xs text-gray-400">{recommendation.roiEstimate.value}/10</span>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-gray-400 hover:text-white hover:bg-white/10"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Hide Implementation Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show Implementation Guide
            </>
          )}
        </Button>
      </div>

      {/* Expanded Implementation Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10"
          >
            <div className="p-6 space-y-6">
              {/* Implementation Steps */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Implementation Steps
                </h4>
                <div className="space-y-2">
                  {recommendation.implementation.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-medium mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-gray-300 text-sm flex-1">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Examples */}
              {recommendation.implementation.codeExamples && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Code Example
                  </h4>
                  <div className="bg-black/40 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
                      <code>{recommendation.implementation.codeExamples}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Resources */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Resources
                  </h4>
                  <div className="space-y-2">
                    {recommendation.implementation.resources.map((resource, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300 text-sm">{resource}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Tools Needed
                  </h4>
                  <div className="space-y-2">
                    {recommendation.implementation.toolsNeeded.map((tool, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-gray-300 text-sm">{tool}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button
                  onClick={() => onImplement?.(recommendation.id)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Implemented
                </Button>
                <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Learn More
                </Button>
                <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Help
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default RecommendationCard;