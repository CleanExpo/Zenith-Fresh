/**
 * Integration Marketplace Component
 * Browse, install, and manage integration connectors
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ShoppingBag,
  Star,
  Download,
  Search,
  Filter,
  CheckCircle,
  ExternalLink,
  Heart,
  Share2,
  Zap,
  Shield,
  Globe,
  Package,
  Users,
  TrendingUp,
  Award,
  BookOpen,
  MessageSquare,
  DollarSign,
  Gift,
  Settings
} from 'lucide-react';
import { MarketplaceConnector } from '@/types/integrations';

// Mock marketplace connectors
const mockConnectors: MarketplaceConnector[] = [
  {
    id: '1',
    name: 'Salesforce Advanced Sync',
    description: 'Advanced bidirectional sync with custom field mapping and real-time updates',
    provider: 'Zenith Labs',
    category: 'CRM',
    version: '2.1.0',
    price: 49,
    currency: 'USD',
    rating: 4.8,
    downloads: 12456,
    screenshots: ['screenshot1.jpg', 'screenshot2.jpg'],
    features: ['Real-time sync', 'Custom field mapping', 'Advanced filtering', 'Bulk operations'],
    requirements: ['Salesforce Enterprise', 'API Access'],
    installation: 'One-click install with OAuth setup',
    documentation: 'https://docs.zenith.com/salesforce-sync',
    support: 'premium@zenith.com',
    verified: true,
    lastUpdated: new Date('2024-06-20')
  },
  {
    id: '2',
    name: 'HubSpot Marketing Pro',
    description: 'Complete marketing automation integration with advanced analytics and reporting',
    provider: 'Marketing Labs',
    category: 'Marketing',
    version: '1.5.2',
    price: 0,
    currency: 'USD',
    rating: 4.6,
    downloads: 8923,
    screenshots: ['screenshot3.jpg'],
    features: ['Email campaigns', 'Lead scoring', 'Analytics dashboard', 'A/B testing'],
    requirements: ['HubSpot Professional', 'Marketing Hub'],
    installation: 'Manual configuration required',
    documentation: 'https://docs.marketinglabs.com',
    support: 'support@marketinglabs.com',
    verified: true,
    lastUpdated: new Date('2024-06-15')
  },
  {
    id: '3',
    name: 'Slack Team Notifications',
    description: 'Enhanced Slack integration with smart notifications and team collaboration features',
    provider: 'Zenith Community',
    category: 'Communication',
    version: '3.0.1',
    price: 19,
    currency: 'USD',
    rating: 4.9,
    downloads: 15789,
    screenshots: ['screenshot4.jpg', 'screenshot5.jpg'],
    features: ['Smart notifications', 'Custom channels', 'Thread management', 'File sharing'],
    requirements: ['Slack Workspace', 'Admin permissions'],
    installation: 'Automated setup with Slack OAuth',
    documentation: 'https://community.zenith.com/slack',
    support: 'community@zenith.com',
    verified: false,
    lastUpdated: new Date('2024-06-22')
  },
  {
    id: '4',
    name: 'Google Analytics 4 Enhanced',
    description: 'Advanced GA4 integration with custom events, e-commerce tracking, and detailed reporting',
    provider: 'Analytics Pro',
    category: 'Analytics',
    version: '4.2.0',
    price: 79,
    currency: 'USD',
    rating: 4.7,
    downloads: 6234,
    screenshots: ['screenshot6.jpg'],
    features: ['Custom events', 'E-commerce tracking', 'Real-time data', 'Custom reports'],
    requirements: ['Google Analytics 4', 'Google Tag Manager'],
    installation: 'Guided setup with Google OAuth',
    documentation: 'https://analyticspro.com/docs',
    support: 'help@analyticspro.com',
    verified: true,
    lastUpdated: new Date('2024-06-18')
  }
];

const categories = ['All', 'CRM', 'Marketing', 'Analytics', 'Communication', 'E-commerce', 'Social Media'];
const sortOptions = ['Featured', 'Most Downloads', 'Highest Rated', 'Recently Updated', 'Price: Low to High', 'Price: High to Low'];

export default function IntegrationMarketplace() {
  const [connectors, setConnectors] = useState<MarketplaceConnector[]>(mockConnectors);
  const [selectedConnector, setSelectedConnector] = useState<MarketplaceConnector | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [installedConnectors, setInstalledConnectors] = useState<string[]>(['2']);
  const [favorites, setFavorites] = useState<string[]>(['1', '3']);
  
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    priceType: 'all', // all, free, paid
    verified: false,
    sort: 'Featured'
  });

  // Filter and sort connectors
  const filteredConnectors = connectors
    .filter(connector => {
      if (filters.search && !connector.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !connector.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category !== 'All' && connector.category !== filters.category) {
        return false;
      }
      if (filters.priceType === 'free' && connector.price > 0) {
        return false;
      }
      if (filters.priceType === 'paid' && connector.price === 0) {
        return false;
      }
      if (filters.verified && !connector.verified) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case 'Most Downloads':
          return b.downloads - a.downloads;
        case 'Highest Rated':
          return b.rating - a.rating;
        case 'Recently Updated':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case 'Price: Low to High':
          return a.price - b.price;
        case 'Price: High to Low':
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const handleInstall = (connectorId: string) => {
    setInstalledConnectors(prev => [...prev, connectorId]);
  };

  const handleUninstall = (connectorId: string) => {
    setInstalledConnectors(prev => prev.filter(id => id !== connectorId));
  };

  const toggleFavorite = (connectorId: string) => {
    setFavorites(prev => 
      prev.includes(connectorId) 
        ? prev.filter(id => id !== connectorId)
        : [...prev, connectorId]
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integration Marketplace</h2>
          <p className="text-gray-600">Discover and install powerful integration connectors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Integrations
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Developer Guide
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search integrations..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="flex-1"
              />
            </div>

            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.priceType} onValueChange={(value) => setFilters(prev => ({ ...prev, priceType: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verified"
                checked={filters.verified}
                onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="verified" className="text-sm">Verified only</label>
            </div>

            <Select value={filters.sort} onValueChange={(value) => setFilters(prev => ({ ...prev, sort: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Featured Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <Award className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-2">Editor's Choice</h3>
            <p className="text-sm opacity-90">Hand-picked integrations by our team</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <TrendingUp className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-2">Trending</h3>
            <p className="text-sm opacity-90">Most popular integrations this week</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
          <CardContent className="p-6">
            <Gift className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-2">New Releases</h3>
            <p className="text-sm opacity-90">Latest integrations and updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Showing {filteredConnectors.length} of {connectors.length} integrations
        </p>
        <div className="text-sm text-gray-500">
          {installedConnectors.length} installed
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConnectors.map((connector) => {
          const isInstalled = installedConnectors.includes(connector.id);
          const isFavorite = favorites.includes(connector.id);

          return (
            <Card key={connector.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{connector.name}</CardTitle>
                      {connector.verified && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <CardDescription className="text-sm mb-2">
                      {connector.description}
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {connector.category}
                      </Badge>
                      <span className="text-xs text-gray-500">by {connector.provider}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(connector.id)}
                    className="p-1"
                  >
                    <Heart
                      className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Rating and Downloads */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      {renderStars(connector.rating)}
                      <span className="ml-1 text-gray-600">({connector.rating})</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Download className="h-3 w-3" />
                      <span>{connector.downloads.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    {connector.features.slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {connector.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{connector.features.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {connector.price === 0 ? (
                        <Badge className="bg-green-100 text-green-800">Free</Badge>
                      ) : (
                        <div className="text-lg font-semibold">
                          ${connector.price}
                          <span className="text-sm text-gray-600">/month</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">v{connector.version}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isInstalled ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUninstall(connector.id)}
                          className="flex-1"
                        >
                          Uninstall
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleInstall(connector.id)}
                          size="sm"
                          className="flex-1"
                        >
                          Install
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedConnector(connector);
                            setShowDetailsDialog(true);
                          }}
                        >
                          Details
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connector Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedConnector && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-2xl">{selectedConnector.name}</DialogTitle>
                  {selectedConnector.verified && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <DialogDescription className="text-base">
                  {selectedConnector.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-center mb-1">
                      {renderStars(selectedConnector.rating)}
                    </div>
                    <p className="text-sm font-medium">{selectedConnector.rating} Rating</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <Download className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                    <p className="text-sm font-medium">{selectedConnector.downloads.toLocaleString()} Downloads</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <Package className="h-6 w-6 mx-auto mb-1 text-green-500" />
                    <p className="text-sm font-medium">v{selectedConnector.version}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <DollarSign className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                    <p className="text-sm font-medium">
                      {selectedConnector.price === 0 ? 'Free' : `$${selectedConnector.price}/mo`}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-semibold mb-3">Features</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedConnector.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="font-semibold mb-3">Requirements</h3>
                  <ul className="space-y-1">
                    {selectedConnector.requirements.map((requirement) => (
                      <li key={requirement} className="text-sm text-gray-600">
                        • {requirement}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Installation */}
                <div>
                  <h3 className="font-semibold mb-3">Installation</h3>
                  <p className="text-sm text-gray-600">{selectedConnector.installation}</p>
                </div>

                {/* Provider Info */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold mb-3">Provider Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Developer:</strong> {selectedConnector.provider}</p>
                      <p><strong>Last Updated:</strong> {selectedConnector.lastUpdated.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p><strong>Support:</strong> {selectedConnector.support}</p>
                      <p><strong>Documentation:</strong> 
                        <Button variant="link" className="p-0 h-auto ml-1" asChild>
                          <a href={selectedConnector.documentation} target="_blank" rel="noopener noreferrer">
                            View Docs <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {!installedConnectors.includes(selectedConnector.id) ? (
                  <Button onClick={() => {
                    handleInstall(selectedConnector.id);
                    setShowDetailsDialog(false);
                  }}>
                    Install Integration
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => {
                    handleUninstall(selectedConnector.id);
                    setShowDetailsDialog(false);
                  }}>
                    Uninstall
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}