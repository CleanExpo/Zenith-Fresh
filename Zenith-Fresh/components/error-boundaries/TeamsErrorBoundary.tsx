'use client';

import React, { ReactNode } from 'react';
import { BaseErrorBoundary } from './BaseErrorBoundary';
import { Users, AlertTriangle, RefreshCw, UserPlus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamsErrorBoundaryProps {
  children: ReactNode;
  section?: 'list' | 'details' | 'members' | 'settings' | 'invitations';
  teamId?: string;
}

/**
 * Teams Error Boundary
 * 
 * Specialized error boundary for team management components
 */
export function TeamsErrorBoundary({ 
  children, 
  section,
  teamId
}: TeamsErrorBoundaryProps) {
  const sectionName = section ? `Team ${section}` : 'Team Management';

  const teamsFallback = (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-purple-800">Team Feature Unavailable</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-purple-700">
            {getTeamErrorMessage(section, teamId)}
          </p>
          
          <div className="bg-purple-100 border border-purple-200 rounded p-3">
            <p className="text-purple-800 text-sm font-medium mb-2">This might be due to:</p>
            <ul className="text-purple-700 text-sm space-y-1">
              <li>• Network connectivity issues</li>
              <li>• Temporary server unavailability</li>
              <li>• Permission or access restrictions</li>
              <li>• Team data synchronization problems</li>
            </ul>
          </div>

          <div className="flex space-x-2">
            {getTeamErrorActions(section, teamId)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <BaseErrorBoundary
      name={sectionName}
      level="section"
      fallback={teamsFallback}
      enableRetry={true}
      enableReporting={true}
      onError={(error, errorInfo, errorId) => {
        // Teams-specific error handling
        console.error(`Teams Error (${section}):`, {
          error,
          errorInfo,
          errorId,
          section,
          teamId,
          timestamp: new Date().toISOString()
        });

        // Track team errors for collaboration analytics
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('teams-error', {
            detail: { 
              section, 
              errorId, 
              error: error.message,
              teamId,
              userAgent: navigator.userAgent
            }
          }));
        }
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
}

function getTeamErrorMessage(section?: string, teamId?: string): string {
  switch (section) {
    case 'list':
      return 'Unable to load your teams list.';
    case 'details':
      return teamId 
        ? `Unable to load details for team ${teamId}.`
        : 'Unable to load team details.';
    case 'members':
      return 'Unable to load team members information.';
    case 'settings':
      return 'Team settings are temporarily unavailable.';
    case 'invitations':
      return 'Unable to process team invitations at this time.';
    default:
      return 'Team management features are temporarily unavailable.';
  }
}

function getTeamErrorActions(section?: string, teamId?: string): JSX.Element[] {
  const actions: JSX.Element[] = [];

  // Common retry action
  actions.push(
    <Button
      key="retry"
      variant="outline"
      size="sm"
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="w-4 h-4 mr-2" />
      Retry
    </Button>
  );

  switch (section) {
    case 'list':
      actions.push(
        <Button
          key="create-team"
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/teams/create'}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create New Team
        </Button>
      );
      break;

    case 'details':
      actions.push(
        <Button
          key="teams-list"
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/teams'}
        >
          <Users className="w-4 h-4 mr-2" />
          Back to Teams
        </Button>
      );
      break;

    case 'members':
      actions.push(
        <Button
          key="invite-member"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (teamId) {
              window.location.href = `/teams/${teamId}/invite`;
            }
          }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      );
      break;

    case 'settings':
      actions.push(
        <Button
          key="team-overview"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (teamId) {
              window.location.href = `/teams/${teamId}`;
            } else {
              window.location.href = '/teams';
            }
          }}
        >
          <Users className="w-4 h-4 mr-2" />
          Team Overview
        </Button>
      );
      break;

    default:
      actions.push(
        <Button
          key="dashboard"
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/dashboard'}
        >
          Back to Dashboard
        </Button>
      );
  }

  return actions;
}

/**
 * Team List Error Boundary
 */
export function TeamListErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <TeamsErrorBoundary section="list">
      {children}
    </TeamsErrorBoundary>
  );
}

/**
 * Team Details Error Boundary
 */
export function TeamDetailsErrorBoundary({ 
  children, 
  teamId 
}: { 
  children: ReactNode; 
  teamId?: string; 
}) {
  return (
    <TeamsErrorBoundary section="details" teamId={teamId}>
      {children}
    </TeamsErrorBoundary>
  );
}

/**
 * Team Members Error Boundary
 */
export function TeamMembersErrorBoundary({ 
  children, 
  teamId 
}: { 
  children: ReactNode; 
  teamId?: string; 
}) {
  const membersFallback = (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
      <Users className="w-8 h-8 text-gray-400 mx-auto mb-3" />
      <h3 className="text-gray-700 font-medium mb-2">Members List Unavailable</h3>
      <p className="text-gray-600 text-sm mb-4">
        Unable to load team members at this time.
      </p>
      <div className="flex justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload
        </Button>
        {teamId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = `/teams/${teamId}/invite`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <BaseErrorBoundary
      name="Team Members"
      level="component"
      fallback={membersFallback}
      enableRetry={true}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Team Settings Error Boundary
 */
export function TeamSettingsErrorBoundary({ 
  children, 
  teamId 
}: { 
  children: ReactNode; 
  teamId?: string; 
}) {
  const settingsFallback = (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
      <Settings className="w-8 h-8 text-gray-400 mx-auto mb-3" />
      <h3 className="text-gray-700 font-medium mb-2">Settings Unavailable</h3>
      <p className="text-gray-600 text-sm mb-4">
        Team settings cannot be loaded right now.
      </p>
      <div className="flex justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload Settings
        </Button>
        {teamId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = `/teams/${teamId}`}
          >
            <Users className="w-4 h-4 mr-2" />
            Team Overview
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <BaseErrorBoundary
      name="Team Settings"
      level="component"
      fallback={settingsFallback}
      enableRetry={true}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Team Invitations Error Boundary
 */
export function TeamInvitationsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <TeamsErrorBoundary section="invitations">
      {children}
    </TeamsErrorBoundary>
  );
}

export default TeamsErrorBoundary;