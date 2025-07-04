import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '../ui/button';

interface TeamLayoutProps {
  children: React.ReactNode;
  teamId: string;
}

export function TeamLayout({ children, teamId }: TeamLayoutProps) {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    { href: `/team/${teamId}`, label: 'Overview' },
    { href: `/team/${teamId}/analytics`, label: 'Analytics' },
    { href: `/team/${teamId}/billing`, label: 'Billing' },
    { href: `/team/${teamId}/settings`, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold">
                Zenith
              </Link>
              <nav className="hidden md:flex space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPath === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                Support
              </Button>
              <Button size="sm">New Project</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 