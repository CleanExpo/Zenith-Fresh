// src/components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

/**
 * The main header component for the Zenith marketing site.
 * Includes primary navigation and login links.
 */
export const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // NOTE: The mobile menu logic (Dialog from Radix) would be added here
    // for a fully functional mobile experience.

    return (
        <header className="absolute inset-x-0 top-0 z-50">
            <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">Zenith</span>
                        <img className="h-8 w-auto invert" src="https://i.imgur.com/gC3v66I.png" alt="Zenith Logo" />
                    </Link>
                </div>
                <div className="hidden lg:flex lg:gap-x-12">
                    <Link href="/features" className="text-sm font-semibold leading-6 text-white">Features</Link>
                    <Link href="/pricing" className="text-sm font-semibold leading-6 text-white">Pricing</Link>
                    <Link href="/community" className="text-sm font-semibold leading-6 text-white">Community</Link>
                    <Link href="/academy" className="text-sm font-semibold leading-6 text-white">Academy</Link>
                    <Link href="/faq" className="text-sm font-semibold leading-6 text-white">FAQ</Link>
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    <Link href="/dashboard" className="text-sm font-semibold leading-6 text-white">
                        Log in <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>
            </nav>
        </header>
    );
};
