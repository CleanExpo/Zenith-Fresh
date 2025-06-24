import type { Metadata } from 'next';
import './globals.css';

// Environment validation moved to API routes to avoid build issues

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