import { cookiePolicy } from '@/lib/legal-content';

export const metadata = {
  title: 'Cookie Policy — Variation Tracker',
  description: 'What cookies Variation Tracker uses and how to control them.',
};

export default function CookiesPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{cookiePolicy.title}</h1>
      <p className="text-sm text-gray-400 mb-6">Last updated: {cookiePolicy.lastUpdated}</p>
      <p className="text-gray-600 leading-relaxed mb-10 text-sm sm:text-base">{cookiePolicy.intro}</p>

      {cookiePolicy.sections.map((section) => {
        // The "Cookies we use" section gets a table treatment
        if ('cookies' in section) {
          return (
            <section key={section.heading} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{section.heading}</h2>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Cookie / Key</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Purpose</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {section.cookies.map((cookie) => (
                      <tr key={cookie.name}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 align-top whitespace-nowrap">
                          {cookie.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 align-top whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              cookie.type === 'Necessary'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-yellow-50 text-yellow-700'
                            }`}
                          >
                            {cookie.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 align-top text-xs leading-relaxed">
                          {cookie.purpose}
                          {cookie.note && (
                            <span className="block mt-1 italic text-gray-400">{cookie.note}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 align-top text-xs whitespace-nowrap">
                          {cookie.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        }

        return (
          <section key={section.heading} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.heading}</h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {section.body}
            </div>
          </section>
        );
      })}
    </article>
  );
}
