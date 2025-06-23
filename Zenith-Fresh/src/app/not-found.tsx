import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-400 mb-2">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Page not found</h2>
          <p className="text-gray-600 mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go home
          </Link>
          
          <Link 
            href="/dashboard"
            className="inline-block w-full px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
        
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick links:</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/features" className="text-blue-600 hover:text-blue-700">Features</Link>
            <Link href="/contact" className="text-blue-600 hover:text-blue-700">Contact</Link>
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}