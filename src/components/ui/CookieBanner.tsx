'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ConsentValue = 'accepted' | 'declined';

const CONSENT_KEY = 'cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // SSR guard — localStorage is only available in the browser
    if (typeof window === 'undefined') return;

    const existing = localStorage.getItem(CONSENT_KEY);
    if (!existing) {
      setVisible(true);
    }
  }, []);

  const handleConsent = (value: ConsentValue) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONSENT_KEY, value);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 leading-snug">
            We use essential cookies to keep you signed in, and store your cookie preference.{' '}
            <Link
              href="/cookies"
              className="underline text-gray-800 hover:text-gray-900 transition-colors"
            >
              Cookie policy
            </Link>
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleConsent('declined')}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Necessary only
            </button>
            <button
              onClick={() => handleConsent('accepted')}
              className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
