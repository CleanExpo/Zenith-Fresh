import './globals.css'

export const metadata = {
  title: 'Zenith Fresh - AI SaaS Platform',
  description: 'AI-driven optimization platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}