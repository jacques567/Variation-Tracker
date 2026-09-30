import { termsAndConditions } from '@/lib/legal-content';

/** Renders [text](https://url) markup in policy text as external links. */
function renderWithLinks(text: string) {
  return text.split(/(\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g).map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    return m ? (
      <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">
        {m[1]}
      </a>
    ) : (
      part
    );
  });
}

export const metadata = {
  title: 'Terms and Conditions — VarTracker',
  description: 'Terms and Conditions governing use of the VarTracker service.',
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
            {renderWithLinks(section.body)}
          </div>
        </section>
      ))}
    </article>
  );
}
