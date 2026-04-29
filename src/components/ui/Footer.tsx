import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-gray-50 border-t border-gray-200">
      <div className="max-w-full mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600">
          <Link href="/terms" className="hover:text-gray-900 transition-colors">
            Terms & Conditions
          </Link>
          <span className="hidden sm:inline text-gray-300">•</span>
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">
            Privacy Policy
          </Link>
          <span className="hidden sm:inline text-gray-300">•</span>
          <Link href="/cookies" className="hover:text-gray-900 transition-colors">
            Cookies Policy
          </Link>
          <span className="hidden sm:inline text-gray-300">•</span>
          <p>© {currentYear} VarTracker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
