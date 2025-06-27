/**
 * Experiment Management Dashboard
 * Main dashboard for managing A/B testing experiments
 */

'use client';

import React, { useState } from 'react';
import { ExperimentStatus, ExperimentType } from '@prisma/client';
import { useExperimentList, useExperimentFilters, useExperimentStats } from '../../lib/hooks/useExperimentList';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  BarChart3, 
  Users, 
  Target, 
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { CreateExperimentModal } from './CreateExperimentModal';
import { ExperimentResults } from './ExperimentResults';
import { ExperimentCard } from './ExperimentCard';

interface ExperimentDashboardProps {
  className?: string;
}

export function ExperimentDashboard({ className }: ExperimentDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    experiments,
    isLoading,
    error,
    refetch,
    createExperiment,
    updateExperiment,
    deleteExperiment
  } = useExperimentList();

  const {
    filteredExperiments,
    filters,
    setFilters,
    sortBy,
    setSortBy
  } = useExperimentFilters(experiments);

  const stats = useExperimentStats(experiments);

  const handleCreateExperiment = async (experimentData: any) => {
    try {
      await createExperiment(experimentData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating experiment:', error);
    }
  };

  const handleStatusChange = async (experimentId: string, newStatus: ExperimentStatus) => {
    try {
      // In a real implementation, you'd have separate API endpoints for start/stop/pause
      await updateExperiment({
        id: experimentId,
        // Status change logic would be handled by the API
      });
    } catch (error) {
      console.error('Error updating experiment status:', error);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading experiments: {error.message}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">A/B Testing Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage and analyze your experiments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Experiment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Experiments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Running
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Play className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-2xl font-bold">{stats.running}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              With Winners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Target className="h-4 w-4 text-purple-600 mr-2" />
              <span className="text-2xl font-bold">{stats.withWinners}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-orange-600 mr-2" />
              <span className="text-2xl font-bold">{stats.avgParticipants.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="running">Running</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ExperimentOverview
            experiments={filteredExperiments}
            filters={filters}
            setFilters={setFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onSelectExperiment={setSelectedExperiment}
            onStatusChange={handleStatusChange}
            onDelete={deleteExperiment}
          />
        </TabsContent>

        <TabsContent value="running" className="space-y-4">
          <ExperimentList
            experiments={filteredExperiments.filter(e => e.status === ExperimentStatus.RUNNING)}
            onSelectExperiment={setSelectedExperiment}
            onStatusChange={handleStatusChange}
            onDelete={deleteExperiment}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <ExperimentList
            experiments={filteredExperiments.filter(e => e.status === ExperimentStatus.COMPLETED)}
            onSelectExperiment={setSelectedExperiment}
            onStatusChange={handleStatusChange}
            onDelete={deleteExperiment}
          />
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <ExperimentList
            experiments={filteredExperiments.filter(e => e.status === ExperimentStatus.DRAFT)}
            onSelectExperiment={setSelectedExperiment}
            onStatusChange={handleStatusChange}
            onDelete={deleteExperiment}
          />
        </TabsContent>
      </Tabs>

      {/* Experiment Results Modal */}
      {selectedExperiment && (
        <ExperimentResults
          experimentId={selectedExperiment}
          isOpen={!!selectedExperiment}
          onClose={() => setSelectedExperiment(null)}
        />
      )}

      {/* Create Experiment Modal */}
      <CreateExperimentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateExperiment}
      />
    </div>
  );
}

interface ExperimentOverviewProps {
  experiments: any[];
  filters: any;
  setFilters: any;
  sortBy: any;
  setSortBy: any;
  onSelectExperiment: (id: string) => void;
  onStatusChange: (id: string, status: ExperimentStatus) => void;
  onDelete: (id: string) => void;
}

function ExperimentOverview({
  experiments,
  filters,
  setFilters,
  sortBy,
  setSortBy,
  onSelectExperiment,
  onStatusChange,
  onDelete
}: ExperimentOverviewProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search experiments..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ 
                ...filters, 
                status: value === 'all' ? undefined : value 
              })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={ExperimentStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={ExperimentStatus.RUNNING}>Running</SelectItem>
                <SelectItem value={ExperimentStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={ExperimentStatus.PAUSED}>Paused</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => setFilters({ 
                ...filters, 
                type: value === 'all' ? undefined : value 
              })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={ExperimentType.AB_TEST}>A/B Test</SelectItem>
                <SelectItem value={ExperimentType.MULTIVARIATE}>Multivariate</SelectItem>
                <SelectItem value={ExperimentType.HOLDOUT}>Holdout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Experiment List */}
      <ExperimentList
        experiments={experiments}
        onSelectExperiment={onSelectExperiment}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />
    </div>
  );
}

interface ExperimentListProps {
  experiments: any[];
  onSelectExperiment: (id: string) => void;
  onStatusChange: (id: string, status: ExperimentStatus) => void;
  onDelete: (id: string) => void;
}

function ExperimentList({
  experiments,
  onSelectExperiment,
  onStatusChange,
  onDelete
}: ExperimentListProps) {
  if (experiments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No experiments found
            </h3>
            <p className="text-gray-600">
              Create your first A/B test to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {experiments.map((experiment) => (
        <ExperimentCard
          key={experiment.id}
          experiment={experiment}
          onSelect={onSelectExperiment}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default ExperimentDashboard;