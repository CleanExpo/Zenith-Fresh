'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  FolderIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  BoltIcon,
  TargetIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Teams', href: '/teams', icon: UserGroupIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Competitive Intel', href: '/competitive-intelligence', icon: TargetIcon },
  { name: 'Integrations', href: '/integrations', icon: BoltIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white w-64 lg:w-64 md:w-56 sm:w-48 glass-morphism animate-slide-up">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl lg:text-xl md:text-lg sm:text-base font-bold text-gradient animate-pulse-glow">Zenith Platform</h1>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm lg:text-sm md:text-xs font-medium rounded-md transition-all duration-300 hover:scale-105 ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-glow'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white hover-glow'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
