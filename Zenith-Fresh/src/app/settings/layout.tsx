'use client';

import { useEffect, useState } from 'react';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for session cookie
        const sessionId = document.cookie
          .split('; ')
          .find(row => row.startsWith('sessionId='))
          ?.split('=')[1];

        if (!sessionId) {
          // No session cookie, redirect to login
          window.location.href = '/auth/signin';
          return;
        }

        // Validate session with API
        const response = await fetch(`/api/auth?sessionId=${sessionId}`);
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Invalid session, redirect to login
          window.location.href = '/auth/signin';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/auth/signin';
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show the settings content
  return <>{children}</>;
}