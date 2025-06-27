/**
 * Experiment Card Component
 * Individual experiment card for the dashboard
 */

'use client';

import React, { useState } from 'react';
import { ExperimentStatus, ExperimentType } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  Play,
  Pause,
  Square,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye
} from 'lucide-react';
import { ExperimentSummary } from '../../types/ab-testing';

interface ExperimentCardProps {
  experiment: ExperimentSummary;
  onSelect: (id: string) => void;
  onStatusChange: (id: string, status: ExperimentStatus) => void;
  onDelete: (id: string) => void;
}

export function ExperimentCard({
  experiment,
  onSelect,
  onStatusChange,
  onDelete
}: ExperimentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getStatusColor = (status: ExperimentStatus) => {
    switch (status) {
      case ExperimentStatus.RUNNING:
        return 'bg-green-100 text-green-800';
      case ExperimentStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case ExperimentStatus.PAUSED:
        return 'bg-yellow-100 text-yellow-800';
      case ExperimentStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case ExperimentStatus.STOPPED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: ExperimentType) => {
    switch (type) {
      case ExperimentType.AB_TEST:
        return 'bg-purple-100 text-purple-800';
      case ExperimentType.MULTIVARIATE:
        return 'bg-orange-100 text-orange-800';
      case ExperimentType.HOLDOUT:
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canStart = experiment.status === ExperimentStatus.DRAFT || experiment.status === ExperimentStatus.PAUSED;
  const canPause = experiment.status === ExperimentStatus.RUNNING;
  const canStop = experiment.status === ExperimentStatus.RUNNING || experiment.status === ExperimentStatus.PAUSED;
  const canDelete = experiment.status !== ExperimentStatus.RUNNING;

  const handleStatusAction = (action: 'start' | 'pause' | 'stop') => {
    let newStatus: ExperimentStatus;
    switch (action) {
      case 'start':
        newStatus = ExperimentStatus.RUNNING;
        break;
      case 'pause':
        newStatus = ExperimentStatus.PAUSED;
        break;
      case 'stop':
        newStatus = ExperimentStatus.STOPPED;
        break;
    }
    onStatusChange(experiment.id, newStatus);
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {experiment.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(experiment.status)}>
                {experiment.status}
              </Badge>
              <Badge variant="outline" className={getTypeColor(experiment.type)}>
                {experiment.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSelect(experiment.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Results
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelect(experiment.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canStart && (
                <DropdownMenuItem onClick={() => handleStatusAction('start')}>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </DropdownMenuItem>
              )}
              {canPause && (
                <DropdownMenuItem onClick={() => handleStatusAction('pause')}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </DropdownMenuItem>
              )}
              {canStop && (
                <DropdownMenuItem onClick={() => handleStatusAction('stop')}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center text-sm text-gray-500 mb-1">
              <Users className="h-4 w-4 mr-1" />
              Participants
            </div>
            <div className="text-xl font-semibold">
              {formatNumber(experiment.totalParticipants)}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-sm text-gray-500 mb-1">
              <Target className="h-4 w-4 mr-1" />
              Variants
            </div>
            <div className="text-xl font-semibold">
              {experiment.variants || 2}
            </div>
          </div>
        </div>

        {/* Progress */}
        {experiment.status === ExperimentStatus.RUNNING && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(experiment.progressPercent)}%</span>
            </div>
            <Progress value={experiment.progressPercent} className="h-2" />
          </div>
        )}

        {/* Lift/Results */}
        {experiment.primaryMetricLift !== null && experiment.primaryMetricLift !== undefined && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {experiment.primaryMetricLift > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
              )}
              <span className="text-sm font-medium">
                {experiment.primaryMetric}
              </span>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${
                experiment.primaryMetricLift > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {experiment.primaryMetricLift > 0 ? '+' : ''}
                {experiment.primaryMetricLift.toFixed(1)}%
              </div>
              {experiment.confidence && (
                <div className="text-xs text-gray-500">
                  {Math.round(experiment.confidence * 100)}% confidence
                </div>
              )}
            </div>
          </div>
        )}

        {/* Winner */}
        {experiment.winningVariant && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-800">
                Winner Detected
              </span>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {experiment.winningVariant}
            </Badge>
          </div>
        )}

        {/* Timeline */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Started:</span>
            <span>{formatDate(experiment.startDate)}</span>
          </div>
          {experiment.endDate && (
            <div className="flex justify-between">
              <span>Ended:</span>
              <span>{formatDate(experiment.endDate)}</span>
            </div>
          )}
          {experiment.daysRunning && (
            <div className="flex justify-between">
              <span>Running:</span>
              <span>{experiment.daysRunning} days</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onSelect(experiment.id)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Results
          </Button>
          {canStart && (
            <Button
              size="sm"
              onClick={() => handleStatusAction('start')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {canPause && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusAction('pause')}
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          {canStop && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusAction('stop')}
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experiment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{experiment.name}"? This action cannot be undone.
              All experiment data and results will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(experiment.id);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default ExperimentCard;