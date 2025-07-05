import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
// TEMPORARILY DISABLED FOR DEBUGGING
// import { StagingBanner } from '@/components/StagingBanner';
// import { ErrorBoundary } from '@/components/ErrorBoundary';
// import { LoadingSpinner } from '@/components/ui/loading-spinner';
// import { Sidebar } from '@/components/Sidebar';
// import { Header } from '@/components/Header';
// import { GoogleAnalytics } from '@/components/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Zenith Platform',
  description: 'AI-Powered Content Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* ALL PROVIDERS DISABLED FOR ULTRA MINIMAL TEST */}
        {/* <GoogleAnalytics /> */}
        {/* <StagingBanner /> */}
        {/* <Providers> */}
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        {/* </Providers> */}
      </body>
    </html>
  );
}
