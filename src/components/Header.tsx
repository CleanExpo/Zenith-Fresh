'use client';

import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { UserMenu } from './UserMenu';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Zenith Platform
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2.5 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
} 