import { privacyPolicy } from '@/lib/legal-content';

export const metadata = {
  title: 'Privacy Policy — Variation Tracker',
  description: 'How Variation Tracker collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{privacyPolicy.title}</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: {privacyPolicy.lastUpdated}</p>

      {privacyPolicy.sections.map((section) => (
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
