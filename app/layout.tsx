import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zenith Platform',
  description: 'The Complete Local Domination Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
} 