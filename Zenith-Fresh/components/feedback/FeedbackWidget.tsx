'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Star,
  ThumbsUp,
  ThumbsDown,
  Bug,
  Lightbulb,
  Heart,
  Camera,
  Upload,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface FeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  page?: string;
  feature?: string;
  trigger?: 'floating' | 'inline' | 'modal';
  onClose?: () => void;
  isVisible?: boolean;
}

interface FeedbackData {
  type: string;
  category?: string;
  title?: string;
  message: string;
  rating?: number;
  experience?: string;
  screenshot?: string;
}

const feedbackTypes = [
  {
    id: 'feature-request',
    label: 'Feature Request',
    icon: Lightbulb,
    color: 'bg-blue-500',
    description: 'Suggest a new feature or improvement'
  },
  {
    id: 'bug-report',
    label: 'Bug Report',
    icon: Bug,
    color: 'bg-red-500',
    description: 'Report a problem or issue'
  },
  {
    id: 'general',
    label: 'General Feedback',
    icon: MessageCircle,
    color: 'bg-green-500',
    description: 'Share your thoughts and suggestions'
  },
  {
    id: 'nps',
    label: 'Rate Experience',
    icon: Heart,
    color: 'bg-pink-500',
    description: 'How likely are you to recommend us?'
  }
];

const experienceOptions = [
  { value: 'poor', label: 'Poor', emoji: '😞' },
  { value: 'fair', label: 'Fair', emoji: '😐' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'very-good', label: 'Very Good', emoji: '😊' },
  { value: 'excellent', label: 'Excellent', emoji: '🤩' }
];

export function FeedbackWidget({ 
  position = 'bottom-right',
  page,
  feature,
  trigger = 'floating',
  onClose,
  isVisible = false
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(isVisible);
  const [currentStep, setCurrentStep] = useState(1);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    type: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  useEffect(() => {
    setIsOpen(isVisible);
  }, [isVisible]);

  const handleOpen = () => {
    setIsOpen(true);
    setCurrentStep(1);
    setIsSubmitted(false);
    setFeedbackData({ type: '', message: '' });
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleTypeSelect = (type: string) => {
    setFeedbackData({ ...feedbackData, type });
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    if (!feedbackData.message.trim() && !feedbackData.rating) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...feedbackData,
          page,
          feature,
          screenshot
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
        setCurrentStep(4);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScreenshot = async () => {
    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/png');
        setScreenshot(imageData);
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      };
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  if (trigger === 'floating' && !isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`fixed ${getPositionClasses()} z-50`}
      >
        <Button
          onClick={handleOpen}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${
            trigger === 'floating' ? '' : 'relative'
          }`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          >
            <Card className="border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Share Your Feedback</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-white' : 'bg-white/50'}`} />
                  <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-white' : 'bg-white/50'}`} />
                  <div className={`w-3 h-3 rounded-full ${currentStep >= 3 ? 'bg-white' : 'bg-white/50'}`} />
                  <div className={`w-3 h-3 rounded-full ${currentStep >= 4 ? 'bg-white' : 'bg-white/50'}`} />
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Step 1: Type Selection */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">
                      What would you like to share?
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {feedbackTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleTypeSelect(type.id)}
                          className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className={`w-8 h-8 rounded-lg ${type.color} flex items-center justify-center mb-2`}>
                            <type.icon className="h-4 w-4 text-white" />
                          </div>
                          <h4 className="font-medium text-sm">{type.label}</h4>
                          <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Rating/Experience */}
                {currentStep === 2 && feedbackData.type === 'nps' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">
                        How likely are you to recommend Zenith?
                      </h3>
                      <p className="text-sm text-gray-600">Rate from 0 (not likely) to 10 (very likely)</p>
                    </div>

                    <div className="flex justify-center space-x-2">
                      {Array.from({ length: 11 }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setFeedbackData({ ...feedbackData, rating: i })}
                          className={`w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors ${
                            feedbackData.rating === i
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:border-blue-500'
                          }`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>

                    <div className="text-center">
                      <h4 className="font-medium mb-3">How was your overall experience?</h4>
                      <div className="flex justify-center space-x-2">
                        {experienceOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setFeedbackData({ ...feedbackData, experience: option.value })}
                            className={`p-2 rounded-lg border transition-colors ${
                              feedbackData.experience === option.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-500'
                            }`}
                          >
                            <div className="text-lg">{option.emoji}</div>
                            <div className="text-xs">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={!feedbackData.rating && !feedbackData.experience}
                      className="w-full"
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {/* Step 2: Other Types - Go directly to message */}
                {currentStep === 2 && feedbackData.type !== 'nps' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">Tell us more</h3>
                      <p className="text-sm text-gray-600">
                        {feedbackData.type === 'bug-report' 
                          ? 'Describe the issue you encountered'
                          : feedbackData.type === 'feature-request'
                          ? 'What feature would you like to see?'
                          : 'Share your thoughts with us'
                        }
                      </p>
                    </div>

                    {feedbackData.type === 'feature-request' && (
                      <input
                        type="text"
                        value={feedbackData.title || ''}
                        onChange={(e) => setFeedbackData({ ...feedbackData, title: e.target.value })}
                        placeholder="Feature title (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    <Textarea
                      value={feedbackData.message}
                      onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                      placeholder={
                        feedbackData.type === 'bug-report' 
                          ? 'Steps to reproduce the issue...'
                          : 'Your feedback...'
                      }
                      rows={4}
                      className="resize-none"
                    />

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handleScreenshot}
                        className="flex items-center space-x-2"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Screenshot</span>
                      </Button>
                      
                      <Button
                        onClick={() => setCurrentStep(3)}
                        disabled={!feedbackData.message.trim()}
                      >
                        Continue
                      </Button>
                    </div>

                    {screenshot && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Screenshot attached:</p>
                        <div className="relative">
                          <img 
                            src={screenshot} 
                            alt="Screenshot" 
                            className="w-full h-32 object-cover rounded-md border"
                          />
                          <button
                            onClick={() => setScreenshot(null)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Additional Details */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">
                        {feedbackData.type === 'nps' ? 'Any additional comments?' : 'Review your feedback'}
                      </h3>
                    </div>

                    {feedbackData.type === 'nps' && (
                      <Textarea
                        value={feedbackData.message}
                        onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                        placeholder="Tell us more about your experience (optional)"
                        rows={3}
                        className="resize-none"
                      />
                    )}

                    {feedbackData.type !== 'nps' && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Your feedback:</h4>
                        {feedbackData.title && (
                          <p className="text-sm font-medium text-gray-900">{feedbackData.title}</p>
                        )}
                        <p className="text-sm text-gray-700">{feedbackData.message}</p>
                        {screenshot && (
                          <p className="text-xs text-gray-500 mt-2">📷 Screenshot attached</p>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Success */}
                {currentStep === 4 && (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Thank you!</h3>
                    <p className="text-gray-600">
                      We appreciate your feedback and will review it carefully.
                    </p>
                    <Button onClick={handleClose} className="w-full">
                      Close
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline feedback component
export function InlineFeedback({ 
  page, 
  feature, 
  className = '',
  size = 'default' 
}: { 
  page?: string; 
  feature?: string; 
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}) {
  const [showWidget, setShowWidget] = useState(false);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowWidget(true)}
        className={`${sizeClasses[size]} ${className}`}
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        Feedback
      </Button>

      <FeedbackWidget
        trigger="modal"
        page={page}
        feature={feature}
        isVisible={showWidget}
        onClose={() => setShowWidget(false)}
      />
    </>
  );
}