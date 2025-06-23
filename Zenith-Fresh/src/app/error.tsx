'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to monitoring service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-red-500 mb-2">⚠️</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'An unexpected error occurred while processing your request.'}
          </p>
          {error.digest && (
            <p className="text-sm text-gray-400 mb-6">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go home
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>If this problem persists, please contact support:</p>
          <a 
            href="mailto:support@zenithfresh.com" 
            className="text-blue-600 hover:text-blue-700"
          >
            support@zenithfresh.com
          </a>
        </div>
      </div>
    </div>
  );
}