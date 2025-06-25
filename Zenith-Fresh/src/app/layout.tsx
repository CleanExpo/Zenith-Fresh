import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { SessionProvider } from '@/components/SessionProvider';
import StructuredData from '@/components/marketing/StructuredData';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Zenith - AI-Powered Website Optimization Platform',
    template: '%s | Zenith'
  },
  description: 'Transform your website performance with AI-powered optimization. Comprehensive analysis, competitive intelligence, and actionable insights to boost conversions and rankings.',
  keywords: ['website optimization', 'AI optimization', 'SEO analysis', 'performance monitoring', 'competitive intelligence', 'website analytics'],
  authors: [{ name: 'Zenith Team' }],
  creator: 'Zenith',
  publisher: 'Zenith',
  metadataBase: new URL('https://zenith.engineer'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zenith.engineer',
    siteName: 'Zenith',
    title: 'Zenith - AI-Powered Website Optimization Platform',
    description: 'Transform your website performance with AI-powered optimization. Comprehensive analysis, competitive intelligence, and actionable insights to boost conversions and rankings.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Zenith - AI-Powered Website Optimization Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zenith - AI-Powered Website Optimization Platform',
    description: 'Transform your website performance with AI-powered optimization. Comprehensive analysis, competitive intelligence, and actionable insights.',
    images: ['/twitter-image.jpg'],
    creator: '@zenithplatform',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <StructuredData type="website" data={{}} />
        <StructuredData type="organization" data={{}} />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="md:pl-64 flex flex-col flex-1">
              <main className="flex-1">
                {children}
              </main>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}