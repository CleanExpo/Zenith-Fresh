'use client';

import { useState, useEffect } from 'react';
import { Search, Book, ArrowRight, Star, Clock, User, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: Date;
  updatedAt: Date;
  views: number;
  rating: number;
  helpful: number;
  notHelpful: number;
  featured: boolean;
}

interface KnowledgeBaseCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  articleCount: number;
  color: string;
}

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgeBaseCategory[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Mock data - in production, this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCategories([
        {
          id: 'getting-started',
          name: 'Getting Started',
          description: 'Learn the basics of Zenith Platform',
          icon: '🚀',
          articleCount: 12,
          color: 'bg-blue-100 text-blue-800',
        },
        {
          id: 'api-docs',
          name: 'API Documentation',
          description: 'Complete API reference and guides',
          icon: '⚡',
          articleCount: 28,
          color: 'bg-purple-100 text-purple-800',
        },
        {
          id: 'integrations',
          name: 'Integrations',
          description: 'Connect with third-party services',
          icon: '🔗',
          articleCount: 15,
          color: 'bg-green-100 text-green-800',
        },
        {
          id: 'troubleshooting',
          name: 'Troubleshooting',
          description: 'Common issues and solutions',
          icon: '🔧',
          articleCount: 22,
          color: 'bg-orange-100 text-orange-800',
        },
        {
          id: 'best-practices',
          name: 'Best Practices',
          description: 'Tips and recommendations',
          icon: '💡',
          articleCount: 18,
          color: 'bg-yellow-100 text-yellow-800',
        },
        {
          id: 'billing',
          name: 'Billing & Plans',
          description: 'Subscription and payment help',
          icon: '💳',
          articleCount: 8,
          color: 'bg-indigo-100 text-indigo-800',
        },
      ]);

      setFeaturedArticles([
        {
          id: '1',
          title: 'Quick Start Guide: Your First Zenith Project',
          excerpt: 'Get up and running with Zenith Platform in under 10 minutes.',
          content: 'Full content would be here...',
          category: 'getting-started',
          tags: ['quickstart', 'tutorial', 'basics'],
          author: 'Zenith Team',
          publishedAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          views: 1250,
          rating: 4.8,
          helpful: 95,
          notHelpful: 5,
          featured: true,
        },
        {
          id: '2',
          title: 'API Authentication & Security Best Practices',
          excerpt: 'Learn how to securely authenticate with the Zenith API.',
          content: 'Full content would be here...',
          category: 'api-docs',
          tags: ['api', 'security', 'authentication'],
          author: 'Security Team',
          publishedAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-18'),
          views: 890,
          rating: 4.9,
          helpful: 88,
          notHelpful: 2,
          featured: true,
        },
        {
          id: '3',
          title: 'Troubleshooting Common Integration Issues',
          excerpt: 'Solutions to the most frequently encountered integration problems.',
          content: 'Full content would be here...',
          category: 'troubleshooting',
          tags: ['troubleshooting', 'integrations', 'common-issues'],
          author: 'Support Team',
          publishedAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-15'),
          views: 720,
          rating: 4.7,
          helpful: 76,
          notHelpful: 8,
          featured: true,
        },
      ]);

      setArticles([
        ...featuredArticles,
        // Add more mock articles...
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Article Header */}
        <div className="mb-6">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Knowledge Base
          </button>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedArticle.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedArticle.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Updated {formatDate(selectedArticle.updatedAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(selectedArticle.rating)}
                    <span className="ml-1">{selectedArticle.rating}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {selectedArticle.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="prose max-w-none">
              <p className="text-lg text-gray-600 mb-6">{selectedArticle.excerpt}</p>
              <div className="border-t border-gray-200 pt-6">
                {/* Article content would be rendered here */}
                <p>Full article content would be rendered here with proper markdown parsing and formatting.</p>
                <p>This is a placeholder for the actual article content that would include:</p>
                <ul>
                  <li>Step-by-step instructions</li>
                  <li>Code examples with syntax highlighting</li>
                  <li>Screenshots and diagrams</li>
                  <li>Interactive elements</li>
                  <li>Related links and resources</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Article Footer */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Was this article helpful?</h3>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              👍 Yes ({selectedArticle.helpful})
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              👎 No ({selectedArticle.notHelpful})
            </Button>
            <span className="text-sm text-gray-600 ml-auto">
              {selectedArticle.views} views
            </span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Book className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
        <p className="text-lg text-gray-600">
          Find answers, tutorials, and guides to help you make the most of Zenith Platform
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search articles, guides, and documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
      </div>

      {/* Featured Articles */}
      {!searchQuery && !selectedCategory && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Articles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredArticles.map(article => (
              <Card
                key={article.id}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Featured
                  </span>
                  <div className="flex items-center gap-1">
                    {renderStars(article.rating)}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{article.views} views</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Articles
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? category.color
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {category.articleCount}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading articles...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <Card className="p-12 text-center">
              <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600">
                Try adjusting your search or browse different categories.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map(article => (
                <Card
                  key={article.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedArticle(article)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {article.title}
                        </h3>
                        {article.featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{article.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {article.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(article.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(article.rating)}
                          <span className="ml-1">{article.rating}</span>
                        </div>
                        <span>{article.views} views</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {article.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{article.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;