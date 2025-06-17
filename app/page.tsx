export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Welcome to Zenith Platform
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            A modern SaaS platform built with Next.js 14, TypeScript, and Tailwind CSS.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/dashboard"
              className="btn-primary"
            >
              Get started
            </a>
            <a
              href="https://github.com/CleanExpo/Zenith-Fresh"
              className="btn-secondary"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </main>
  )
} 