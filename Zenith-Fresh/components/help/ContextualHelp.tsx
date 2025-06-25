'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Book, 
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Search,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  isHelpful?: boolean;
}

interface ContextualHelpProps {
  page: string;
  element?: string;
  trigger?: 'hover' | 'click' | 'focus';
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
}

interface TooltipProps {
  content: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
  isVisible: boolean;
  onClose: () => void;
}

export function ContextualHelp({ 
  page, 
  element, 
  trigger = 'hover', 
  position = 'top',
  children,
  className = ''
}: ContextualHelpProps) {
  const [helpData, setHelpData] = useState<HelpArticle[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && helpData.length === 0) {
      loadHelpContent();
    }
  }, [isVisible, page, element]);

  const loadHelpContent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/help/contextual?page=${page}&element=${element || ''}`);
      if (response.ok) {
        const data = await response.json();
        setHelpData(data.articles || []);
      }
    } catch (error) {
      console.error('Error loading help content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrigger = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus') {
      setIsVisible(true);
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus') {
      setIsVisible(false);
    }
  };

  const handleArticleFeedback = async (articleId: string, isHelpful: boolean) => {
    try {
      await fetch('/api/help/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articleId,
          isHelpful,
          page,
          element
        })
      });

      // Update local state
      setHelpData(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, isHelpful }
          : article
      ));
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const filteredArticles = helpData.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children ? (
        <div onClick={handleTrigger} className="cursor-help">
          {children}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTrigger}
          className="text-gray-500 hover:text-blue-600 p-1"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      )}

      <AnimatePresence>
        {isVisible && (
          <HelpTooltip
            content={
              <HelpContent
                articles={filteredArticles}
                isLoading={isLoading}
                selectedArticle={selectedArticle}
                searchQuery={searchQuery}
                onSelectArticle={setSelectedArticle}
                onSearchChange={setSearchQuery}
                onFeedback={handleArticleFeedback}
                onClose={() => setIsVisible(false)}
              />
            }
            position={position}
            isVisible={isVisible}
            onClose={() => setIsVisible(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function HelpTooltip({ content, position, isVisible, onClose }: TooltipProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 transform -translate-y-1/2';
      default:
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-white border-t-8 border-x-transparent border-x-8 border-b-0';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-white border-b-8 border-x-transparent border-x-8 border-t-0';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-white border-l-8 border-y-transparent border-y-8 border-r-0';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-white border-r-8 border-y-transparent border-y-8 border-l-0';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-white border-t-8 border-x-transparent border-x-8 border-b-0';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`absolute z-50 ${getPositionClasses()}`}
    >
      <div className="relative">
        {/* Arrow */}
        <div className={`absolute w-0 h-0 ${getArrowClasses()}`} />
        
        {/* Content */}
        <Card className="w-80 max-h-96 shadow-lg border border-gray-200">
          {content}
        </Card>
      </div>
    </motion.div>
  );
}

interface HelpContentProps {
  articles: HelpArticle[];
  isLoading: boolean;
  selectedArticle: HelpArticle | null;
  searchQuery: string;
  onSelectArticle: (article: HelpArticle | null) => void;
  onSearchChange: (query: string) => void;
  onFeedback: (articleId: string, isHelpful: boolean) => void;
  onClose: () => void;
}

function HelpContent({
  articles,
  isLoading,
  selectedArticle,
  searchQuery,
  onSelectArticle,
  onSearchChange,
  onFeedback,
  onClose
}: HelpContentProps) {
  if (selectedArticle) {
    return (
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectArticle(null)}
            className="text-blue-600 hover:text-blue-800 p-0"
          >
            ← Back to Help
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm">
            {selectedArticle.title}
          </h4>
          
          <div className="text-sm text-gray-700 max-h-48 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
          </div>

          {/* Feedback */}
          <div className="border-t pt-3">
            <p className="text-xs text-gray-600 mb-2">Was this helpful?</p>
            <div className="flex items-center space-x-2">
              <Button
                variant={selectedArticle.isHelpful === true ? "default" : "outline"}
                size="sm"
                onClick={() => onFeedback(selectedArticle.id, true)}
                className="flex items-center space-x-1"
              >
                <ThumbsUp className="h-3 w-3" />
                <span className="text-xs">Yes</span>
              </Button>
              <Button
                variant={selectedArticle.isHelpful === false ? "default" : "outline"}
                size="sm"
                onClick={() => onFeedback(selectedArticle.id, false)}
                className="flex items-center space-x-1"
              >
                <ThumbsDown className="h-3 w-3" />
                <span className="text-xs">No</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Help & Tips</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search help articles..."
          className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Articles */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-xs text-gray-500">Loading help content...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-xs text-gray-500 mb-2">
              {searchQuery ? 'No articles found' : 'No help content available'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/help', '_blank')}
              className="text-xs"
            >
              <Book className="h-3 w-3 mr-1" />
              Browse All Help
            </Button>
          </div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className="p-2 rounded-md hover:bg-gray-50 cursor-pointer border border-gray-100 transition-colors"
            >
              <h5 className="text-xs font-medium text-gray-900 mb-1">
                {article.title}
              </h5>
              {article.summary && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {article.summary}
                </p>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-blue-600 font-medium">
                  {article.category}
                </span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/help', '_blank')}
            className="text-xs text-blue-600 hover:text-blue-800 p-0"
          >
            View all help articles
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/support', '_blank')}
            className="text-xs text-gray-600 hover:text-gray-800 p-0"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </CardContent>
  );
}

// Helper hook for easy integration
export function useContextualHelp(page: string, element?: string) {
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHelp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/help/contextual?page=${page}&element=${element || ''}`);
      if (response.ok) {
        const data = await response.json();
        setHelpArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Error loading contextual help:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHelp();
  }, [page, element]);

  return { helpArticles, isLoading, loadHelp };
}

// HOC for easy wrapping
export function withContextualHelp<P extends object>(
  Component: React.ComponentType<P>,
  page: string,
  element?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <div className="relative">
        <Component {...props} />
        <ContextualHelp
          page={page}
          element={element}
          trigger="hover"
          position="top"
          className="absolute -top-2 -right-2"
        />
      </div>
    );
  };
}