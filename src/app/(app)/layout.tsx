// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// This sets up the primary font for the application.
const inter = Inter({ subsets: ["latin"] });

// This sets up the site's metadata for SEO and browser tabs.
export const metadata: Metadata = {
  title: "Zenith - Build Apps That Think & Scale",
  description: "Deploy AI-powered applications in minutes, not months.",
};

/**
 * This is the root layout for the entire application.
 * It wraps every page with the <html> and <body> tags.
 * Most importantly, it imports the global CSS file which enables Tailwind CSS.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered.
 * @returns {JSX.Element} The root layout component.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
