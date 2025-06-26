'use client';

import React, { ReactNode } from 'react';
import { BaseErrorBoundary } from './BaseErrorBoundary';
import { Shield, AlertTriangle, LogIn, UserX, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthErrorBoundaryProps {
  children: ReactNode;
  authType?: 'signin' | 'signup' | 'signout' | 'session' | 'oauth';
}

/**
 * Authentication Error Boundary
 * 
 * Specialized error boundary for authentication flows with
 * auth-specific fallback UI and security-focused error handling
 */
export function AuthErrorBoundary({ children, authType }: AuthErrorBoundaryProps) {
  const authTypeName = authType ? `Authentication (${authType})` : 'Authentication';

  const authFallback = (
    <Card className="border-red-200 bg-red-50 max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-red-600" />
          <CardTitle className="text-red-800">Authentication Error</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-red-700">
            {getAuthErrorMessage(authType)}
          </p>
          
          <div className="bg-red-100 border border-red-200 rounded p-3">
            <p className="text-red-800 text-sm font-medium mb-2">Possible causes:</p>
            <ul className="text-red-700 text-sm space-y-1">
              {getAuthErrorCauses(authType)}
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            {getAuthErrorActions(authType)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <BaseErrorBoundary
      name={authTypeName}
      level={authType === 'session' ? 'page' : 'section'}
      fallback={authFallback}
      enableRetry={true}
      enableReporting={true}
      onError={(error, errorInfo, errorId) => {
        // Auth-specific error handling - be careful with sensitive data
        console.error(`Auth Error (${authType}):`, {
          errorId,
          authType,
          errorMessage: error.message, // Don't log sensitive auth details
          timestamp: new Date().toISOString()
        });

        // Track auth errors for security monitoring
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { 
              authType, 
              errorId, 
              error: error.message,
              timestamp: new Date().toISOString()
            }
          }));

          // Clear potentially corrupted auth state
          if (authType === 'session') {
            sessionStorage.removeItem('auth-state');
            localStorage.removeItem('auth-backup');
          }
        }
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
}

function getAuthErrorMessage(authType?: string): string {
  switch (authType) {
    case 'signin':
      return 'We encountered an issue while trying to sign you in.';
    case 'signup':
      return 'There was a problem creating your account.';
    case 'signout':
      return 'We had trouble signing you out securely.';
    case 'session':
      return 'Your session encountered an error and needs to be refreshed.';
    case 'oauth':
      return 'There was an issue with the social login provider.';
    default:
      return 'An authentication error occurred.';
  }
}

function getAuthErrorCauses(authType?: string): JSX.Element[] {
  const commonCauses = [
    <li key="network">• Network connectivity issues</li>,
    <li key="server">• Temporary server problems</li>
  ];

  const specificCauses: Record<string, JSX.Element[]> = {
    signin: [
      <li key="credentials">• Invalid email or password</li>,
      <li key="account">• Account may be suspended or deleted</li>,
      <li key="rate-limit">• Too many failed login attempts</li>,
      ...commonCauses
    ],
    signup: [
      <li key="email-exists">• Email address already registered</li>,
      <li key="validation">• Invalid email or password format</li>,
      <li key="rate-limit">• Rate limiting on account creation</li>,
      ...commonCauses
    ],
    signout: [
      <li key="session">• Session already expired</li>,
      <li key="server">• Server-side logout processing issue</li>,
      ...commonCauses
    ],
    session: [
      <li key="expired">• Session has expired</li>,
      <li key="invalid">• Session token is invalid or corrupted</li>,
      <li key="security">• Security policy violation detected</li>,
      ...commonCauses
    ],
    oauth: [
      <li key="provider">• Social login provider is unavailable</li>,
      <li key="config">• OAuth configuration issue</li>,
      <li key="permissions">• Insufficient permissions granted</li>,
      ...commonCauses
    ]
  };

  return specificCauses[authType || 'default'] || commonCauses;
}

function getAuthErrorActions(authType?: string): JSX.Element[] {
  const actions: JSX.Element[] = [];

  switch (authType) {
    case 'signin':
      actions.push(
        <Button
          key="retry-signin"
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Try Signing In Again
        </Button>,
        <Button
          key="forgot-password"
          variant="ghost"
          onClick={() => window.location.href = '/auth/forgot-password'}
          className="w-full"
        >
          Forgot Password?
        </Button>,
        <Button
          key="signup"
          variant="ghost"
          onClick={() => window.location.href = '/auth/signup'}
          className="w-full"
        >
          Create New Account
        </Button>
      );
      break;

    case 'signup':
      actions.push(
        <Button
          key="retry-signup"
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>,
        <Button
          key="signin"
          variant="ghost"
          onClick={() => window.location.href = '/auth/signin'}
          className="w-full"
        >
          Sign In Instead
        </Button>
      );
      break;

    case 'signout':
      actions.push(
        <Button
          key="force-signout"
          variant="outline"
          onClick={() => {
            // Force clear all auth data and redirect
            if (typeof window !== 'undefined') {
              sessionStorage.clear();
              localStorage.removeItem('auth-backup');
              window.location.href = '/auth/signin';
            }
          }}
          className="w-full"
        >
          <UserX className="w-4 h-4 mr-2" />
          Force Sign Out
        </Button>
      );
      break;

    case 'session':
      actions.push(
        <Button
          key="refresh-session"
          variant="outline"
          onClick={() => window.location.href = '/auth/signin'}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Sign In Again
        </Button>
      );
      break;

    case 'oauth':
      actions.push(
        <Button
          key="retry-oauth"
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Social Login Again
        </Button>,
        <Button
          key="email-signin"
          variant="ghost"
          onClick={() => window.location.href = '/auth/signin'}
          className="w-full"
        >
          Use Email Instead
        </Button>
      );
      break;

    default:
      actions.push(
        <Button
          key="retry"
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>,
        <Button
          key="home"
          variant="ghost"
          onClick={() => window.location.href = '/'}
          className="w-full"
        >
          Go to Home Page
        </Button>
      );
  }

  return actions;
}

/**
 * Sign In Error Boundary
 */
export function SignInErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary authType="signin">
      {children}
    </AuthErrorBoundary>
  );
}

/**
 * Sign Up Error Boundary
 */
export function SignUpErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary authType="signup">
      {children}
    </AuthErrorBoundary>
  );
}

/**
 * Session Error Boundary
 */
export function SessionErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary authType="session">
      {children}
    </AuthErrorBoundary>
  );
}

/**
 * OAuth Error Boundary
 */
export function OAuthErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary authType="oauth">
      {children}
    </AuthErrorBoundary>
  );
}

export default AuthErrorBoundary;