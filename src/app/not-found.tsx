import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div>
        <p className="text-5xl font-bold text-gray-900 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-700 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/jobs"
          className="inline-block bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Go to your jobs
        </Link>
      </div>
    </div>
  )
}
