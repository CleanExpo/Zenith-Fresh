import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { Providers } from '../providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Authentication - Zenith Platform',
  description: 'Sign in to your Zenith account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <Suspense fallback={<LoadingSpinner />}>
              {children}
            </Suspense>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
} 