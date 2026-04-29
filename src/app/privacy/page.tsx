export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 prose prose-sm max-w-none">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-700">
              VarTracker ("we," "our," "us," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="text-gray-700 font-semibold mt-3">We collect information you provide directly:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
              <li>Account registration information (name, email, company details)</li>
              <li>Job and project information you create in VarTracker</li>
              <li>Client information you add to your jobs</li>
              <li>Digital signatures and signature data</li>
              <li>Payment and billing information</li>
              <li>Communication with our support team</li>
            </ul>

            <p className="text-gray-700 font-semibold mt-4">We collect information automatically:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
              <li>Log data (IP address, browser type, pages visited, timestamps)</li>
              <li>Device information (device type, operating system)</li>
              <li>Usage information (features used, interactions with the service)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-700">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
              <li>Provide and maintain the VarTracker service</li>
              <li>Process your account and transactions</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your inquiries and requests</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Monitor and analyze usage trends and service improvements</li>
              <li>Detect and prevent fraud or illegal activity</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Information Sharing</h2>
            <p className="text-gray-700">
              We do not sell or rent your personal information to third parties. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
              <li><strong>Service providers</strong> - vendors who assist us in operating our website and conducting our business (e.g., payment processors, hosting providers)</li>
              <li><strong>Legal requirements</strong> - when required by law, court order, or government request</li>
              <li><strong>Business transfers</strong> - in connection with a merger, sale, bankruptcy, or other business transaction</li>
              <li><strong>Your consent</strong> - when you explicitly authorize sharing of your information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Retention of Information</h2>
            <p className="text-gray-700">
              We retain your personal information for as long as necessary to provide the service, comply with legal obligations, or until you request deletion. You can delete your account and associated data at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="text-gray-700">Under applicable data protection laws, you have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Restrict processing of your information</li>
              <li>Request a copy of your information in a portable format</li>
              <li>Opt-out of marketing communications</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, please contact us through the support channels available on VarTracker.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. International Users</h2>
            <p className="text-gray-700">
              Your information may be transferred to, stored in, and processed in countries other than your country of residence. By using VarTracker, you consent to the transfer of your information to countries outside your country of residence.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Children's Privacy</h2>
            <p className="text-gray-700">
              VarTracker is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that a child has provided us with personal information, we will take steps to delete such information immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us through the support channels available on VarTracker.
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
