import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Poppins } from 'next/font/google';
import { appUrl } from '@/lib/app-url';

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
  alternates: { canonical: '/about' },
  title: 'VarTracker — Variation Order Tracking App for UK Contractors',
  description:
    'VarTracker is a variation order tracking app for UK contractors. Log extra work on site, send it to the client for electronic sign-off, and export an invoice with every signed variation. £15/month after a 7-day free trial.',
  openGraph: {
    title: 'VarTracker — Variation Order Tracking App for UK Contractors',
    description:
      'Log variations on site, get client sign-off by link, and export an invoice that includes every signed variation.',
    url: `${appUrl}/about`,
    siteName: 'VarTracker',
    type: 'website',
  },
};

const steps = [
  {
    title: 'Log the variation',
    body: 'Add the extra work, the cost and photos from your phone while you are still on site.',
  },
  {
    title: 'Send it to the client',
    body: 'VarTracker emails the client a link. They open it on their phone or computer, with no app and no account.',
  },
  {
    title: 'Get it signed',
    body: 'The client signs electronically. The name, time and signature are stored against the job before you start the work.',
  },
  {
    title: 'Invoice it',
    body: 'Export an invoice showing the original contract value plus every signed variation.',
  },
];

const audience = [
  'Electricians, plumbers, builders, kitchen fitters and other trades working to a fixed price',
  'Self-employed contractors and small teams in the UK',
  'Anyone who has done extra work on a job and then struggled to get paid for it',
];

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
  {
    question: 'Can a signed variation be changed or deleted afterwards?',
    answer:
      "No — once a client signs, VarTracker locks the variation so it can't be edited or deleted, and a job holding signed variations can't be hard-deleted either; you archive it instead. Signed variations are kept as a contractual record for up to six years, so if a dispute comes up, the approved wording and signature are still there.",
  },
  {
    question: 'Is an electronic sign-off valid evidence in the UK?',
    answer:
      'VarTracker records the client\'s electronic signature, name, IP address and the time of signing. Under the Electronic Communications Act 2000 s.7, electronic signatures are admissible as evidence in the UK. The full record is reproduced on the exported variation PDF and invoice. VarTracker is not a law firm, so for a large or contested sum take legal advice.',
  },
  {
    question: 'How much does VarTracker cost?',
    answer:
      'VarTracker costs £15 per month after a 7-day free trial. No card is needed to start the trial, and you can cancel any time.',
  },
  {
    question: 'Who is VarTracker for?',
    answer:
      'VarTracker is for UK contractors and small construction businesses working to a fixed price, such as electricians, plumbers, builders and kitchen fitters. It is built for use on a phone, on site.',
  },
];

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VarTracker',
  url: `${appUrl}/about`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Variation order tracking for UK contractors: log variations, collect client electronic sign-off, and export invoices.',
  offers: {
    '@type': 'Offer',
    price: '15.00',
    priceCurrency: 'GBP',
  },
};

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
      <script type="application/ld+json">{JSON.stringify(softwareSchema)}</script>

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
            Variation order tracking for UK contractors
          </h1>
          <p className="text-lg leading-relaxed mb-6" style={{ color: '#0F1720' }}>
            VarTracker is a variation order (change order) tracking app. You log extra work on
            site, the client signs it off electronically from a link, and you export an invoice
            that includes every signed variation.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-lg px-5 py-3 text-base font-medium text-white"
            style={{ backgroundColor: '#0057B8' }}
          >
            Start your 7-day free trial
          </Link>
          <p className="text-sm mt-3" style={{ color: '#4B5563' }}>
            No card needed. £15/month after the trial, cancel any time.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: '#0F1720' }}>
          How VarTracker works
        </h2>
        <ol className="space-y-4 mb-12">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex gap-4"
            >
              <span
                className="flex-none w-8 h-8 rounded-full text-white text-sm font-semibold flex items-center justify-center"
                style={{ backgroundColor: '#0057B8' }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#0F1720' }}>
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F1720' }}>
          Who it is for
        </h2>
        <ul className="list-disc pl-6 space-y-2 mb-12 text-gray-600 leading-relaxed">
          {audience.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

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

        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-block rounded-lg px-5 py-3 text-base font-medium text-white"
            style={{ backgroundColor: '#0057B8' }}
          >
            Start your 7-day free trial
          </Link>
          <p className="text-sm mt-3 text-gray-600">No card needed. Cancel any time.</p>
        </div>
      </main>
    </div>
  );
}
