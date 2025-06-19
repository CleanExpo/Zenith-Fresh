import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
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
        {/* <GoogleAnalytics /> */}
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <main className="container mx-auto p-4">
              <Suspense fallback={<div>Loading...</div>}>
                {children}
              </Suspense>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
} 