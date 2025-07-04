// src/components/competitive/CompetitiveAlerts.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Eye,
  TrendingUp,
  TrendingDown,
  Target,
  Link,
  FileText,
  Clock,
  Filter,
  Settings
} from 'lucide-react';

interface CompetitiveAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data: Record<string, any>;
  targetDomain: string;
  isRead: boolean;
  isActionable: boolean;
  createdAt: string;
  readAt?: string;
}

interface AlertSummary {
  total: number;
  unread: number;
  critical: number;
  high: number;
  medium: number;
  byType: Record<string, number>;
}

interface CompetitiveAlertsProps {
  teamId: string;
  onAlertClick?: (alert: CompetitiveAlert) => void;
  showSettings?: boolean;
}

const CompetitiveAlerts: React.FC<CompetitiveAlertsProps> = ({ 
  teamId, 
  onAlertClick,
  showSettings = false 
}) => {
  const [alerts, setAlerts] = useState<CompetitiveAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'high'>('unread');

  useEffect(() => {
    loadAlerts();
  }, [teamId, filter]);

  const loadAlerts = async () => {
    try {
      const includeRead = filter === 'all';
      const severity = filter === 'critical' || filter === 'high' ? filter : undefined;
      
      const params = new URLSearchParams({
        limit: '20',
        includeRead: includeRead.toString()
      });
      
      if (severity) {
        params.set('severity', severity);
      }

      const response = await fetch(`/api/competitive/intelligence/alerts?${params}`, {
        headers: {
          'x-team-id': teamId
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAlerts(result.data.alerts);
        setSummary(result.data.summary);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const response = await fetch('/api/competitive/intelligence/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-team-id': teamId
        },
        body: JSON.stringify({
          alertId,
          action: 'mark_read'
        })
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        ));
        
        if (summary) {
          setSummary(prev => prev ? { ...prev, unread: prev.unread - 1 } : null);
        }
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'keyword_opportunity': return Target;
      case 'backlink_gain':
      case 'backlink_loss': return Link;
      case 'content_published': return FileText;
      case 'ranking_change': return TrendingUp;
      case 'traffic_change': return TrendingDown;
      default: return AlertTriangle;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Competitive Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Competitive Alerts
            {summary && summary.unread > 0 && (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                {summary.unread} new
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showSettings && (
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Monitor competitive changes and opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{summary.unread}</div>
              <p className="text-xs text-muted-foreground">Unread</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-orange-600">{summary.high}</div>
              <p className="text-xs text-muted-foreground">High</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-4">
          {[
            { id: 'unread', label: 'Unread', count: summary?.unread },
            { id: 'critical', label: 'Critical', count: summary?.critical },
            { id: 'high', label: 'High', count: summary?.high },
            { id: 'all', label: 'All', count: summary?.total }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No alerts match your current filter</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                      alert.isRead 
                        ? 'bg-muted/20 border-muted' 
                        : 'bg-background border-border shadow-sm'
                    }`}
                    onClick={() => onAlertClick?.(alert)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className={`font-medium text-sm ${
                              alert.isRead ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {alert.title}
                            </h4>
                            <p className={`text-xs mt-1 ${
                              alert.isRead ? 'text-muted-foreground/80' : 'text-muted-foreground'
                            }`}>
                              {alert.description}
                            </p>
                            
                            {alert.targetDomain && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Domain: {alert.targetDomain}
                              </p>
                            )}
                            
                            {alert.data && Object.keys(alert.data).length > 0 && (
                              <div className="mt-2 text-xs">
                                {alert.data.changePercent && (
                                  <span className={`inline-flex items-center gap-1 ${
                                    alert.data.changePercent > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {alert.data.changePercent > 0 ? 
                                      <TrendingUp className="h-3 w-3" /> : 
                                      <TrendingDown className="h-3 w-3" />
                                    }
                                    {Math.abs(alert.data.changePercent).toFixed(1)}% change
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            
                            {!alert.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(alert.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(alert.createdAt)}
                          </div>
                          
                          {alert.isActionable && (
                            <Badge variant="outline" className="text-xs">
                              Actionable
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {alerts.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" onClick={loadAlerts}>
              Refresh Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompetitiveAlerts;