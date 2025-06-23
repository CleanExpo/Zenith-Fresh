// src/components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

/**
 * The main header component for the Zenith marketing site.
 * Includes primary navigation and responsive mobile menu.
 */
export const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const navigationLinks = [
        { href: '/features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/community', label: 'Community' },
        { href: '/academy', label: 'Academy' },
        { href: '/faq', label: 'FAQ' },
    ];

    return (
        <header className="absolute inset-x-0 top-0 z-50">
            <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                {/* Logo */}
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">Zenith</span>
                        <Image className="h-8 w-auto invert" src="https://i.imgur.com/gC3v66I.png" alt="Zenith Logo" width={32} height={32} />
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex lg:gap-x-12">
                    {navigationLinks.map((link) => (
                        <Link 
                            key={link.href}
                            href={link.href} 
                            className="text-sm font-semibold leading-6 text-white hover:text-gray-300 transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop Login */}
                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    <Link href="/dashboard" className="text-sm font-semibold leading-6 text-white hover:text-gray-300 transition-colors">
                        Log in <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>

                {/* Mobile menu button */}
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white hover:text-gray-300 transition-colors"
                        onClick={toggleMobileMenu}
                        aria-expanded={mobileMenuOpen}
                        aria-label="Toggle mobile menu"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6" aria-hidden="true" />
                        ) : (
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
                <div className="lg:hidden">
                    <div className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm" onClick={toggleMobileMenu} />
                    <div className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-black/90 backdrop-blur-xl px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="-m-1.5 p-1.5" onClick={toggleMobileMenu}>
                                <span className="sr-only">Zenith</span>
                                <Image className="h-8 w-auto invert" src="https://i.imgur.com/gC3v66I.png" alt="Zenith Logo" width={32} height={32} />
                            </Link>
                            <button
                                type="button"
                                className="-m-2.5 rounded-md p-2.5 text-white hover:text-gray-300 transition-colors"
                                onClick={toggleMobileMenu}
                                aria-label="Close mobile menu"
                            >
                                <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-white/10">
                                <div className="space-y-2 py-6">
                                    {navigationLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white/10 transition-colors"
                                            onClick={toggleMobileMenu}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                                <div className="py-6">
                                    <Link
                                        href="/dashboard"
                                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-white/10 transition-colors"
                                        onClick={toggleMobileMenu}
                                    >
                                        Log in
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
