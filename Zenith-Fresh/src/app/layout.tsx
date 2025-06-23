import type { Metadata } from 'next';
import './globals.css';

// Environment validation - runs on app startup
if (typeof window === 'undefined') {
  // Server-side only
  try {
    const { initializeEnvironment } = require('../lib/env-validation.js');
    initializeEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', (error as Error).message);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export const metadata: Metadata = {
  title: 'Zenith Fresh - AI-Driven SaaS Platform',
  description: 'Complete AI-driven optimization platform for websites and businesses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}