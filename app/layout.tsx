import type React from "react"
import type { Metadata } from "next"
import { Inter, Tektur } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const tektur = Tektur({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-heading",
})

export const metadata: Metadata = {
  title: "Zenith.engineer - Autonomous Web Engineering",
  description: "Deploy AI-powered applications in minutes, not months.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable, tektur.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
