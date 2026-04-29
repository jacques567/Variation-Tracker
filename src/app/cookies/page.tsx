export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookies Policy</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 prose prose-sm max-w-none">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What Are Cookies</h2>
            <p className="text-gray-700">
              Cookies are small text files that are stored on your device (computer, tablet, or smartphone) when you visit a website. They help websites remember information about your visit, such as your preferences and login information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Cookies</h2>
            <p className="text-gray-700">
              VarTracker uses cookies for the following purposes:
            </p>

            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Cookies</h3>
              <p className="text-gray-700">
                These cookies are necessary for the website to function properly and cannot be disabled. They enable:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
                <li>User authentication and login functionality</li>
                <li>Session management</li>
                <li>Security and protection against fraud</li>
                <li>CSRF token protection</li>
              </ul>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Cookies</h3>
              <p className="text-gray-700">
                These cookies help us understand how you use VarTracker and allow us to improve the service. They collect information about:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
                <li>Pages you visit</li>
                <li>Actions you take within the service</li>
                <li>Errors encountered</li>
                <li>Time spent on pages</li>
              </ul>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Preference Cookies</h3>
              <p className="text-gray-700">
                These cookies remember your choices and preferences to enhance your experience, such as:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
                <li>Language preferences</li>
                <li>Display settings</li>
                <li>User preferences for the interface</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Third-Party Cookies</h2>
            <p className="text-gray-700">
              VarTracker may use third-party services that set cookies on your device, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
              <li><strong>Payment processors (Stripe)</strong> - for processing payments and subscriptions</li>
              <li><strong>Hosting providers</strong> - for delivering the service</li>
              <li><strong>Analytics providers</strong> - for understanding service usage (if applicable)</li>
            </ul>
            <p className="text-gray-700 mt-3">
              These third parties have their own cookie policies and privacy practices. We encourage you to review their policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Cookie Duration</h2>
            <p className="text-gray-700">
              Cookies may be either:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
              <li><strong>Session cookies</strong> - deleted when you close your browser</li>
              <li><strong>Persistent cookies</strong> - stored on your device for a specified period or until you delete them</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Managing Your Cookie Preferences</h2>
            <p className="text-gray-700">
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
              <li>View what cookies are stored on your device</li>
              <li>Delete cookies</li>
              <li>Block cookies from being set</li>
              <li>Set your browser to alert you when a cookie is being set</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Please note that disabling essential cookies may affect your ability to use VarTracker. You can find more information about managing cookies in your browser settings or by visiting <span className="text-blue-600">aboutcookies.org</span>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Do Not Track</h2>
            <p className="text-gray-700">
              Some browsers include a "Do Not Track" feature. Currently, there is no industry standard for recognizing Do Not Track signals, and VarTracker does not respond to such signals. However, you can use the browser settings mentioned above to manage cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookie Consent</h2>
            <p className="text-gray-700">
              By using VarTracker, you consent to the use of cookies as described in this policy. Essential cookies are necessary for the service to function, while other cookies require your consent, which you can manage through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to This Cookies Policy</h2>
            <p className="text-gray-700">
              We may update this Cookies Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about this Cookies Policy or how we use cookies, please contact us through the support channels available on VarTracker.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Last updated: {new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </main>
    </div>
  )
}
