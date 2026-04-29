export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 prose prose-sm max-w-none">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using VarTracker, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Use License</h2>
            <p className="text-gray-700">
              Permission is granted to temporarily download one copy of the materials (information or software) on VarTracker for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on VarTracker</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Disclaimer</h2>
            <p className="text-gray-700">
              The materials on VarTracker are provided on an 'as is' basis. VarTracker makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Limitations</h2>
            <p className="text-gray-700">
              In no event shall VarTracker or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on VarTracker, even if VarTracker or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Accuracy of Materials</h2>
            <p className="text-gray-700">
              The materials appearing on VarTracker could include technical, typographical, or photographic errors. VarTracker does not warrant that any of the materials on its website are accurate, complete, or current. VarTracker may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitations on Liability</h2>
            <p className="text-gray-700">
              In no event shall VarTracker or its suppliers be liable for any direct, indirect, incidental, special, consequential or exemplary damages arising out of your use of or inability to use VarTracker or the materials, services or information contained on VarTracker, even if advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Termination of Service</h2>
            <p className="text-gray-700">
              VarTracker may terminate or suspend your access to VarTracker immediately, without prior notice or liability, for any reason whatsoever, including if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Signatures and Electronic Documents</h2>
            <p className="text-gray-700">
              Electronic signatures obtained through VarTracker are valid and binding under the Electronic Communications Act 2000 and related legislation. By using the electronic signature feature, you agree that electronic signatures have the same legal effect as original signatures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Governing Law</h2>
            <p className="text-gray-700">
              These terms and conditions are governed by and construed in accordance with the laws of the United Kingdom and you irrevocably submit to the exclusive jurisdiction of the courts located in England.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Information</h2>
            <p className="text-gray-700">
              If you have any questions about these Terms & Conditions, please contact us through the support channels available on VarTracker.
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
