// src/components/layout/Footer.tsx
import React from 'react';

/**
 * The main footer component for the Zenith marketing site.
 */
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
