import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

// Blueprint/architectural diamond line pattern — full intensity, per DESIGN.md
// ("full intensity on login/auth/marketing screens"). dark-neutral (#0F1720) lines.
const diamondPattern = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(15,23,32,0.06) 0, rgba(15,23,32,0.06) 1px, transparent 1px, transparent 24px), ' +
    'repeating-linear-gradient(-45deg, rgba(15,23,32,0.06) 0, rgba(15,23,32,0.06) 1px, transparent 1px, transparent 24px)',
};

export const metadata = {
  title: 'What is VarTracker? — Variation Order Tracking for Contractors',
  description:
    'VarTracker is a variation-tracking app that lets contractors log job variations, notify clients instantly, and collect legally binding electronic sign-off before work proceeds.',
};

const faqs = [
  {
    question: 'What is a variation order in construction?',
    answer:
      "A variation order (also called a change order) is any extra work or cost that falls outside a job's original fixed-price agreement — an unexpected repair, a client-requested upgrade, or a change to the original spec. Without a written record and client sign-off, that extra work is hard to bill for and easy to dispute later.",
  },
  {
    question: 'How do I track variation orders on a construction job?',
    answer:
      "Log each variation in VarTracker as it comes up — scope, cost, and photos — then send it to the client for review. VarTracker keeps a timestamped record of every variation on the job, so you always have a single source of truth instead of scattered texts and emails. Every variation stays attached to the original job, so nothing gets lost between the quote and the final invoice.",
  },
  {
    question: "What's the best app for construction variation tracking?",
    answer:
      'VarTracker is built specifically for variation orders on construction and trade jobs — not general project management. It focuses on three things: logging the variation, notifying the client, and capturing their electronic sign-off, so disputes over "who approved what" don\'t happen. It runs on your phone on site, not just at a desk, since that\'s when variations actually come up.',
  },
  {
    question: 'How do I get client sign-off on a job variation?',
    answer:
      'VarTracker sends the client a link to review the variation details and sign off electronically from their phone or computer. The signed record is timestamped and stored against the job, giving you proof of approval before you carry out the extra work. No app download or account needed on the client\'s end — they just open the link and sign.',
  },
  {
    question: 'Can I invoice for variations after they\'re signed off?',
    answer:
      "Yes — once a variation is signed off, VarTracker rolls its cost into the job's running total, and you can export an invoice that reflects the original contract value plus every signed variation. That way nothing agreed on site gets forgotten or left off the final bill.",
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function AboutPage() {
  return (
    <div className={`${poppins.className} min-h-screen`} style={{ backgroundColor: '#E6EAF0' }}>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#0057B8' }}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </header>

      <section className="px-4 py-16 sm:px-6" style={diamondPattern}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <Image
              src="/VarTrackerLogo3Trans.png"
              alt=""
              width={1108}
              height={929}
              className="h-8 w-auto"
            />
            <span className="text-xl font-semibold" style={{ color: '#0F1720' }}>
              VarTracker
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold mb-4" style={{ color: '#0F1720' }}>
            What is VarTracker?
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: '#0F1720' }}>
            VarTracker is a variation-tracking app that helps contractors log job variations,
            notify clients, and collect legally binding electronic sign-off before extra work
            proceeds.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: '#0F1720' }}>
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <section
              key={faq.question}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0F1720' }}>
                {faq.question}
              </h3>
              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
