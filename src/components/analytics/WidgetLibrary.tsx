'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X,
  Plus,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Table,
  TrendingDown,
  Thermometer,
  Globe,
  Search
} from 'lucide-react';

interface WidgetLibraryProps {
  onAddWidget: (widgetConfig: any) => void;
  onClose: () => void;
  teamId: string;
}

interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'chart' | 'kpi' | 'table' | 'funnel' | 'heatmap' | 'map';
  type: string;
  config: any;
  previewImage?: string;
}

const widgetTemplates: WidgetTemplate[] = [
  // KPI Widgets
  {
    id: 'kpi-overview',
    name: 'KPI Overview',
    description: 'Display key performance indicators in a grid layout',
    icon: <Activity className="w-6 h-6" />,
    category: 'kpi',
    type: 'kpi',
    config: {
      layout: 'grid',
      showTrends: true,
      showComparison: true
    }
  },
  {
    id: 'kpi-list',
    name: 'KPI List',
    description: 'Show KPIs in a vertical list with detailed metrics',
    icon: <Activity className="w-6 h-6" />,
    category: 'kpi',
    type: 'kpi',
    config: {
      layout: 'list',
      showTrends: true,
      showComparison: true
    }
  },

  // Chart Widgets
  {
    id: 'line-chart',
    name: 'Line Chart',
    description: 'Track trends over time with line visualization',
    icon: <LineChart className="w-6 h-6" />,
    category: 'chart',
    type: 'chart',
    config: {
      chartType: 'line',
      showLegend: true,
      showGrid: true
    }
  },
  {
    id: 'area-chart',
    name: 'Area Chart',
    description: 'Show cumulative values with filled area visualization',
    icon: <BarChart3 className="w-6 h-6" />,
    category: 'chart',
    type: 'chart',
    config: {
      chartType: 'area',
      showLegend: true,
      showGrid: true
    }
  },
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    description: 'Compare values across categories with bar visualization',
    icon: <BarChart3 className="w-6 h-6" />,
    category: 'chart',
    type: 'chart',
    config: {
      chartType: 'bar',
      showLegend: true,
      showGrid: true
    }
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    description: 'Show distribution of values in a circular chart',
    icon: <PieChart className="w-6 h-6" />,
    category: 'chart',
    type: 'chart',
    config: {
      chartType: 'pie',
      showLegend: true
    }
  },

  // Table Widgets
  {
    id: 'data-table',
    name: 'Data Table',
    description: 'Display detailed data in a searchable and sortable table',
    icon: <Table className="w-6 h-6" />,
    category: 'table',
    type: 'table',
    config: {
      columns: ['Page', 'Views', 'Time on Page', 'Bounce Rate'],
      sortable: true,
      searchable: true,
      pagination: true,
      limit: 20
    }
  },
  {
    id: 'top-pages',
    name: 'Top Pages',
    description: 'Show the most popular pages with key metrics',
    icon: <Table className="w-6 h-6" />,
    category: 'table',
    type: 'table',
    config: {
      columns: ['Page', 'Views', 'Conversions'],
      sortable: true,
      limit: 10,
      dataSource: 'pages'
    }
  },

  // Funnel Widgets
  {
    id: 'conversion-funnel',
    name: 'Conversion Funnel',
    description: 'Visualize user journey and conversion rates',
    icon: <TrendingDown className="w-6 h-6" />,
    category: 'funnel',
    type: 'funnel',
    config: {
      orientation: 'vertical',
      showConversionRates: true,
      showDropOffRates: true
    }
  },
  {
    id: 'horizontal-funnel',
    name: 'Horizontal Funnel',
    description: 'Show conversion funnel in horizontal layout',
    icon: <TrendingDown className="w-6 h-6" />,
    category: 'funnel',
    type: 'funnel',
    config: {
      orientation: 'horizontal',
      showConversionRates: true,
      showDropOffRates: true
    }
  },

  // Heatmap Widgets
  {
    id: 'time-heatmap',
    name: 'Time Heatmap',
    description: 'Show activity patterns by hour and day of week',
    icon: <Thermometer className="w-6 h-6" />,
    category: 'heatmap',
    type: 'heatmap',
    config: {
      type: 'time',
      colorScheme: 'blue',
      showValues: true
    }
  },
  {
    id: 'calendar-heatmap',
    name: 'Calendar Heatmap',
    description: 'Display daily activity over the year',
    icon: <Thermometer className="w-6 h-6" />,
    category: 'heatmap',
    type: 'heatmap',
    config: {
      type: 'calendar',
      colorScheme: 'green',
      showValues: false
    }
  },
  {
    id: 'matrix-heatmap',
    name: 'Matrix Heatmap',
    description: 'Compare values across two dimensions',
    icon: <Thermometer className="w-6 h-6" />,
    category: 'heatmap',
    type: 'heatmap',
    config: {
      type: 'matrix',
      colorScheme: 'blue',
      showValues: true
    }
  },

  // Map Widgets
  {
    id: 'world-map',
    name: 'World Map',
    description: 'Show geographic distribution of users or revenue',
    icon: <Globe className="w-6 h-6" />,
    category: 'map',
    type: 'map',
    config: {
      type: 'world',
      colorScheme: 'blue',
      showValues: true
    }
  },
  {
    id: 'country-map',
    name: 'Country Map',
    description: 'Display regional data within a specific country',
    icon: <Globe className="w-6 h-6" />,
    category: 'map',
    type: 'map',
    config: {
      type: 'country',
      colorScheme: 'green',
      showValues: true,
      countryCode: 'US'
    }
  }
];

export default function WidgetLibrary({ onAddWidget, onClose, teamId }: WidgetLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWidget, setSelectedWidget] = useState<WidgetTemplate | null>(null);
  const [widgetConfig, setWidgetConfig] = useState({
    title: '',
    description: ''
  });

  const categories = [
    { id: 'all', name: 'All Widgets', count: widgetTemplates.length },
    { id: 'kpi', name: 'KPI', count: widgetTemplates.filter(w => w.category === 'kpi').length },
    { id: 'chart', name: 'Charts', count: widgetTemplates.filter(w => w.category === 'chart').length },
    { id: 'table', name: 'Tables', count: widgetTemplates.filter(w => w.category === 'table').length },
    { id: 'funnel', name: 'Funnels', count: widgetTemplates.filter(w => w.category === 'funnel').length },
    { id: 'heatmap', name: 'Heatmaps', count: widgetTemplates.filter(w => w.category === 'heatmap').length },
    { id: 'map', name: 'Maps', count: widgetTemplates.filter(w => w.category === 'map').length }
  ];

  const filteredWidgets = widgetTemplates.filter(widget => {
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    const matchesSearch = widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddWidget = () => {
    if (!selectedWidget) return;

    const newWidgetConfig = {
      type: selectedWidget.type,
      title: widgetConfig.title || selectedWidget.name,
      description: widgetConfig.description || selectedWidget.description,
      config: selectedWidget.config,
      dataSource: 'metrics'
    };

    onAddWidget(newWidgetConfig);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Widget Library</h2>
            <p className="text-gray-600 mt-1">Choose from pre-built widgets or create custom ones</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="p-2">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <div className="space-y-1">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {category.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Widget Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filteredWidgets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <BarChart3 className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets found</h3>
                <p className="text-gray-600">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWidgets.map(widget => (
                  <Card
                    key={widget.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedWidget?.id === widget.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedWidget(widget)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        {widget.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{widget.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{widget.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {widget.category}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          {selectedWidget && (
            <div className="w-80 border-l bg-gray-50 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Widget</h3>
              
              <div className="space-y-4">
                {/* Widget Info */}
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {selectedWidget.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedWidget.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {selectedWidget.category}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{selectedWidget.description}</p>
                </div>

                {/* Configuration Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="widget-title">Widget Title</Label>
                    <Input
                      id="widget-title"
                      value={widgetConfig.title}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, title: e.target.value })}
                      placeholder={selectedWidget.name}
                    />
                  </div>

                  <div>
                    <Label htmlFor="widget-description">Description (Optional)</Label>
                    <Input
                      id="widget-description"
                      value={widgetConfig.description}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, description: e.target.value })}
                      placeholder={selectedWidget.description}
                    />
                  </div>

                  {/* Widget-specific configuration would go here */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Additional configuration options will be available after adding the widget to your dashboard.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddWidget} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Widget
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedWidget(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}