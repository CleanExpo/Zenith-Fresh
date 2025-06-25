'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  ArrowRight,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  Tag,
  Filter,
  Grid,
  List,
  Lightbulb,
  Users,
  Settings,
  Code,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime?: number;
  viewCount: number;
  helpfulVotes: number;
  unhelpfulVotes: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: Lightbulb,
    color: 'bg-blue-500',
    description: 'Learn the basics and get up and running quickly'
  },
  {
    id: 'features',
    name: 'Features',
    icon: BarChart3,
    color: 'bg-green-500',
    description: 'Detailed guides on using all platform features'
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    icon: Settings,
    color: 'bg-yellow-500',
    description: 'Solutions to common problems and issues'
  },
  {
    id: 'api',
    name: 'API Documentation',
    icon: Code,
    color: 'bg-purple-500',
    description: 'Technical documentation for developers'
  },
  {
    id: 'billing',
    name: 'Billing & Plans',
    icon: CreditCard,
    color: 'bg-orange-500',
    description: 'Information about pricing and billing'
  },
  {
    id: 'collaboration',
    name: 'Team Collaboration',
    icon: Users,
    color: 'bg-pink-500',
    description: 'Working with teams and managing permissions'
  }
];

export default function HelpPage() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams?.get('category') || '');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams?.get('q') || '');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'popularity'>('relevance');

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, selectedCategory, searchQuery, sortBy]);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/help/articles');
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles.filter(article => article.isPublished);

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort articles
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'popularity':
        filtered.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'relevance':
      default:
        // Keep original order (featured first, then by helpfulness)
        filtered.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.helpfulVotes - a.helpfulVotes;
        });
        break;
    }

    setFilteredArticles(filtered);
  };

  const handleArticleClick = async (article: HelpArticle) => {
    setSelectedArticle(article);
    
    // Track article view
    try {
      await fetch(`/api/help/articles/${article.id}/view`, {
        method: 'POST'
      });
      
      // Update local view count
      setArticles(prev => prev.map(a => 
        a.id === article.id 
          ? { ...a, viewCount: a.viewCount + 1 }
          : a
      ));
    } catch (error) {
      console.error('Error tracking article view:', error);
    }
  };

  const handleFeedback = async (articleId: string, isHelpful: boolean) => {
    try {
      await fetch('/api/help/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articleId,
          isHelpful,
          page: 'help',
          element: 'article'
        })
      });

      // Update local vote counts
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? {
              ...article,
              helpfulVotes: isHelpful ? article.helpfulVotes + 1 : article.helpfulVotes,
              unhelpfulVotes: !isHelpful ? article.unhelpfulVotes + 1 : article.unhelpfulVotes
            }
          : article
      ));
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const featuredArticles = articles.filter(article => article.isFeatured && article.isPublished);

  if (selectedArticle) {
    return <ArticleView article={selectedArticle} onBack={() => setSelectedArticle(null)} onFeedback={handleFeedback} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find answers, learn new skills, and get the most out of Zenith Platform
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles..."
                className="pl-12 pr-4 py-3 text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        {!searchQuery && !selectedCategory && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center`}>
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {articles.filter(a => a.category === category.id && a.isPublished).length} articles
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Featured Articles */}
        {!searchQuery && !selectedCategory && featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.slice(0, 6).map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => handleArticleClick(article)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search Results / Category Articles */}
        {(searchQuery || selectedCategory) && (
          <div>
            {/* Filters and Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory
                    ? categories.find(c => c.id === selectedCategory)?.name
                    : `Search results for "${searchQuery}"`
                  }
                </h2>
                <Badge variant="secondary">
                  {filteredArticles.length} articles
                </Badge>
              </div>

              <div className="flex items-center space-x-4">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="date">Recently Updated</option>
                  <option value="popularity">Most Popular</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-gray-300 rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {selectedCategory && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCategory('')}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>

            {/* Articles */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading articles...</div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? 'Try adjusting your search terms or browse by category'
                    : 'No articles available in this category'
                  }
                </p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {filteredArticles.map((article) => (
                  viewMode === 'grid' ? (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onClick={() => handleArticleClick(article)}
                    />
                  ) : (
                    <ArticleListItem
                      key={article.id}
                      article={article}
                      onClick={() => handleArticleClick(article)}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article, onClick }: { article: HelpArticle; onClick: () => void }) {
  const category = categories.find(c => c.id === article.category);
  
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-3">
          {category && (
            <div className={`w-6 h-6 rounded ${category.color} flex items-center justify-center`}>
              <category.icon className="h-3 w-3 text-white" />
            </div>
          )}
          <Badge variant="secondary" className="text-xs">
            {article.difficulty}
          </Badge>
          {article.isFeatured && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {article.title}
        </h3>
        
        {article.summary && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {article.summary}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            {article.estimatedReadTime && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{article.estimatedReadTime} min</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <ThumbsUp className="h-3 w-3" />
              <span>{article.helpfulVotes}</span>
            </div>
          </div>
          <span>{article.viewCount} views</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleListItem({ article, onClick }: { article: HelpArticle; onClick: () => void }) {
  const category = categories.find(c => c.id === article.category);
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {category && (
                <div className={`w-5 h-5 rounded ${category.color} flex items-center justify-center`}>
                  <category.icon className="h-3 w-3 text-white" />
                </div>
              )}
              <Badge variant="secondary" className="text-xs">
                {article.difficulty}
              </Badge>
              {article.isFeatured && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1">
              {article.title}
            </h3>
            
            {article.summary && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {article.summary}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end text-xs text-gray-500 ml-4">
            {article.estimatedReadTime && (
              <div className="flex items-center space-x-1 mb-1">
                <Clock className="h-3 w-3" />
                <span>{article.estimatedReadTime} min</span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <ThumbsUp className="h-3 w-3" />
                <span>{article.helpfulVotes}</span>
              </div>
              <span>{article.viewCount} views</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleView({ 
  article, 
  onBack, 
  onFeedback 
}: { 
  article: HelpArticle; 
  onBack: () => void;
  onFeedback: (articleId: string, isHelpful: boolean) => void;
}) {
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const category = categories.find(c => c.id === article.category);
  
  const handleFeedback = (isHelpful: boolean) => {
    onFeedback(article.id, isHelpful);
    setHasVoted(isHelpful);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Back to Help Center
          </Button>
          
          <div className="flex items-center space-x-2 mb-4">
            {category && (
              <div className={`w-6 h-6 rounded ${category.color} flex items-center justify-center`}>
                <category.icon className="h-4 w-4 text-white" />
              </div>
            )}
            <Badge variant="secondary">{article.difficulty}</Badge>
            {article.isFeatured && (
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            {article.estimatedReadTime && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{article.estimatedReadTime} min read</span>
              </div>
            )}
            <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
            <span>{article.viewCount} views</span>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          
          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Feedback */}
          <div className="mt-8 pt-8 border-t">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Was this article helpful?</h4>
            <div className="flex items-center space-x-4">
              <Button
                variant={hasVoted === true ? "default" : "outline"}
                size="sm"
                onClick={() => handleFeedback(true)}
                disabled={hasVoted !== null}
                className="flex items-center space-x-2"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Yes ({article.helpfulVotes})</span>
              </Button>
              <Button
                variant={hasVoted === false ? "default" : "outline"}
                size="sm"
                onClick={() => handleFeedback(false)}
                disabled={hasVoted !== null}
                className="flex items-center space-x-2"
              >
                <ThumbsDown className="h-4 w-4" />
                <span>No ({article.unhelpfulVotes})</span>
              </Button>
            </div>
            {hasVoted !== null && (
              <p className="text-sm text-green-600 mt-2">
                Thank you for your feedback!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}