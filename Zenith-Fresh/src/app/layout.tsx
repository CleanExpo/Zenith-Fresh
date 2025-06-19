import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <div className="md:pl-64 flex flex-col flex-1">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}