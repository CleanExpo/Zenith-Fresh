// src/components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
                    <Link href="/features/agentic-workforce" className="text-sm font-semibold leading-6 text-white">Features</Link>
                    <Link href="/pricing" className="text-sm font-semibold leading-6 text-white">Pricing</Link>
                    <Link href="/faq" className="text-sm font-semibold leading-6 text-white">FAQ</Link>
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    <Link href="/dashboard" className="text-sm font-semibold leading-6 text-white">Log in <span aria-hidden="true">&rarr;</span></Link>
                </div>
            </nav>
        </header>
    );
};


// src/components/layout/Footer.tsx
import React from 'react';

export const Footer = () => {
    return (
        <footer className="bg-gray-900" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">Footer</h2>
            <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
                <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
                    <p className="text-xs leading-5 text-gray-400">&copy; 2025 Zenith, Inc. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};
