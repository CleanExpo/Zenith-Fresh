'use client';

import { useState, useRef } from 'react';
import { MessageSquare, Camera, Paperclip, Send, X, Bug, Lightbulb, Heart, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FeedbackData {
  type: 'bug' | 'feature' | 'general' | 'urgent';
  message: string;
  screenshot?: string;
  attachments?: File[];
  email?: string;
  url: string;
  userAgent: string;
  timestamp: Date;
}

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackData['type']>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const feedbackTypes = [
    {
      id: 'bug',
      label: 'Bug Report',
      icon: Bug,
      color: 'text-red-600 bg-red-50 border-red-200',
      description: 'Something is broken or not working',
    },
    {
      id: 'feature',
      label: 'Feature Request',
      icon: Lightbulb,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      description: 'Suggest a new feature or improvement',
    },
    {
      id: 'general',
      label: 'General Feedback',
      icon: Heart,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      description: 'Share your thoughts or experience',
    },
    {
      id: 'urgent',
      label: 'Urgent Issue',
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      description: 'Critical issue affecting your work',
    },
  ];

  const captureScreenshot = async () => {
    try {
      if ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' },
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          const dataURL = canvas.toDataURL('image/png');
          setScreenshot(dataURL);
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        });
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      // Fallback to basic screenshot if available
      try {
        // @ts-ignore - html2canvas would be imported if available
        if (typeof html2canvas !== 'undefined') {
          const canvas = await html2canvas(document.body);
          setScreenshot(canvas.toDataURL('image/png'));
        }
      } catch (fallbackError) {
        console.error('Screenshot fallback failed:', fallbackError);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/', 'text/', 'application/pdf', 'application/json'];
      
      return file.size <= maxSize && allowedTypes.some(type => file.type.startsWith(type));
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const submitFeedback = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        type: feedbackType,
        message: message.trim(),
        screenshot: screenshot || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        email: email.trim() || undefined,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
      };

      // Submit feedback to API
      const response = await fetch('/api/support/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          resetForm();
        }, 2000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFeedbackType('general');
    setMessage('');
    setEmail('');
    setScreenshot(null);
    setAttachments([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
        aria-label="Send feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl rounded-xl overflow-hidden">
        {isSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
            <p className="text-gray-600">
              Your feedback has been submitted. We'll review it and get back to you if needed.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Send Feedback</h2>
                <p className="text-sm text-gray-600">Help us improve your experience</p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of feedback is this?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setFeedbackType(type.id as FeedbackData['type'])}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          feedbackType === type.id
                            ? type.color
                            : 'text-gray-600 bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{type.label}</span>
                        </div>
                        <p className="text-xs opacity-80">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us more *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your feedback in detail..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {message.length}/1000 characters
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll only use this to follow up on your feedback
                </p>
              </div>

              {/* Screenshot */}
              {screenshot && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Screenshot
                  </label>
                  <div className="relative">
                    <img
                      src={screenshot}
                      alt="Screenshot"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => setScreenshot(null)}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={captureScreenshot}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Screenshot
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                  Attach
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.txt,.pdf,.json"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Feedback helps us improve Zenith Platform
              </p>
              <Button
                onClick={submitFeedback}
                disabled={!message.trim() || isSubmitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Feedback
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default FeedbackWidget;