import { termsAndConditions } from '@/lib/legal-content';

export const metadata = {
  title: 'Terms and Conditions — Variation Tracker',
  description: 'Terms and Conditions governing use of the Variation Tracker service.',
};

export default function TermsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{termsAndConditions.title}</h1>
      <p className="text-sm text-gray-400 mb-6">Last updated: {termsAndConditions.lastUpdated}</p>
      <p className="text-sm text-gray-600 leading-relaxed mb-10 border-l-4 border-gray-200 pl-4">
        {termsAndConditions.intro}
      </p>

      {termsAndConditions.sections.map((section) => (
        <section key={section.heading} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.heading}</h2>
          <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
            {section.body}
          </div>
        </section>
      ))}
    </article>
  );
}
