// legal-content.ts — Source of truth for all policy text in Variation Tracker.
// Pages import from here so content is managed in one place.

export const COMPANY_NAME = "Variation Tracker";
export const COMPANY_EMAIL = "hello@variationtracker.co.uk";
export const LAST_UPDATED = "April 2026";

type PolicySection = {
  heading: string;
  body: string;
};

type CookieEntry = {
  name: string;
  type: string;
  purpose: string;
  duration: string;
  note?: string;
};

type CookiePolicySection =
  | PolicySection
  | { heading: string; body: null; cookies: CookieEntry[] };

type Policy = {
  title: string;
  lastUpdated: string;
  sections: PolicySection[];
};

type PolicyWithIntro = Policy & { intro: string };

type CookiePolicy = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: CookiePolicySection[];
};

// ---------------------------------------------------------------------------
// PRIVACY POLICY
// ---------------------------------------------------------------------------

export const privacyPolicy: Policy = {
  title: "Privacy Policy",
  lastUpdated: LAST_UPDATED,
  sections: [
    {
      heading: "Who we are",
      body: `${COMPANY_NAME} is a web application built for UK contractors and small construction businesses to log variations, obtain client sign-off, and export invoices. We are the data controller for the personal data you provide when using this service. If you have any questions about how we handle your data, contact us at ${COMPANY_EMAIL}.`,
    },
    {
      heading: "What data we collect",
      body: `We collect the following categories of personal data:

• Account information — your name and email address, provided when you register or sign in.
• Job and variation data — project names, client names, site addresses, variation descriptions, amounts, and any notes or attachments you upload. This is data you enter yourself.
• Usage data — pages visited, actions taken within the app, and error logs. This is collected to help us fix bugs and improve the product.
• Device and connection data — IP address, browser type, and operating system, collected automatically when you use the service.

We do not collect payment card details. Any billing is handled by a third-party payment processor (Stripe) under their own privacy policy.`,
    },
    {
      heading: "How we use your data",
      body: `We use your data to:

• Provide the Variation Tracker service — authenticating you, storing your jobs and variations, and generating exports.
• Communicate with you — sending account-related emails (e.g. password reset, sign-off notifications).
• Improve the product — analysing usage patterns to understand what works and what needs fixing.
• Meet legal obligations — retaining records as required by UK law.

We do not sell your data to third parties. We do not use your data for advertising.`,
    },
    {
      heading: "Legal basis for processing",
      body: `Under the UK GDPR, we rely on the following lawful bases:

• Contract performance — processing your account data is necessary to provide the service you signed up for.
• Legitimate interests — analysing usage data to improve the product, where this does not override your rights.
• Legal obligation — retaining certain records as required by law.`,
    },
    {
      heading: "Who we share data with",
      body: `We share data only with the following trusted processors, all operating under appropriate data processing agreements:

• Supabase — our database and authentication provider. Data is hosted on servers in the EU.
• Vercel — our hosting provider. Handles request routing and edge functions.
• Stripe — payment processing (if applicable to your plan).

We do not share your data with your clients or any other third party without your explicit instruction.`,
    },
    {
      heading: "How long we keep your data",
      body: `We retain your account and project data for as long as your account is active. If you close your account, we will delete or anonymise your personal data within 30 days, except where we are required to retain it by law (for example, financial records which may be kept for up to 6 years under UK tax law).`,
    },
    {
      heading: "Your rights",
      body: `Under UK GDPR you have the right to:

• Access — request a copy of the personal data we hold about you.
• Rectification — ask us to correct inaccurate data.
• Erasure — ask us to delete your data (subject to legal retention requirements).
• Restriction — ask us to limit how we use your data in certain circumstances.
• Portability — receive your data in a machine-readable format.
• Object — object to processing based on legitimate interests.

To exercise any of these rights, email us at ${COMPANY_EMAIL}. We will respond within 30 days. If you are unhappy with our response, you have the right to complain to the Information Commissioner's Office (ICO) at ico.org.uk.`,
    },
    {
      heading: "Cookies",
      body: `We use a small number of cookies necessary for the service to function. See our Cookie Policy for details.`,
    },
    {
      heading: "Changes to this policy",
      body: `We may update this policy from time to time. We will notify you of significant changes by email or by displaying a notice in the app. The date at the top of this page shows when it was last updated.`,
    },
  ],
};

// ---------------------------------------------------------------------------
// TERMS AND CONDITIONS
// ---------------------------------------------------------------------------

export const termsAndConditions: PolicyWithIntro = {
  title: "Terms and Conditions",
  lastUpdated: LAST_UPDATED,
  intro: `These Terms and Conditions ("Terms") govern your use of ${COMPANY_NAME} (the "Service"). By creating an account you agree to these Terms. Please read them carefully.`,
  sections: [
    {
      heading: "1. The Service",
      body: `${COMPANY_NAME} is a software-as-a-service (SaaS) tool that allows contractors and construction businesses to record variations, request client sign-off, and generate documentation. We provide the Service on a subscription basis.`,
    },
    {
      heading: "2. Your account",
      body: `You must be at least 18 years old and a business user (sole trader, partnership, or limited company) to use the Service. You are responsible for keeping your login credentials secure and for all activity that occurs under your account. If you suspect unauthorised access, contact us immediately at ${COMPANY_EMAIL}.`,
    },
    {
      heading: "3. Acceptable use",
      body: `You agree not to:

• Use the Service for any unlawful purpose or in breach of any regulation.
• Upload content that is fraudulent, defamatory, or infringes third-party rights.
• Attempt to reverse-engineer, copy, or resell the Service.
• Use automated tools to scrape or overload our systems.

We reserve the right to suspend or terminate accounts that breach these rules.`,
    },
    {
      heading: "4. Your data",
      body: `You own the data you enter into Variation Tracker. We process it on your behalf to provide the Service. You are responsible for ensuring that any personal data you upload (for example, client contact details) is handled lawfully under UK GDPR. See our Privacy Policy for how we handle your data.`,
    },
    {
      heading: "5. Subscription and billing",
      body: `Access to the Service may require a paid subscription. Pricing is displayed in the app. Subscriptions renew automatically unless cancelled before the renewal date. Refunds are handled in accordance with our Billing & Cancellation Policy. We reserve the right to change pricing with 30 days' notice.`,
    },
    {
      heading: "6. Availability and support",
      body: `We aim to keep the Service available at all times but cannot guarantee uninterrupted access. We may carry out maintenance which temporarily affects availability. We will give reasonable notice where possible. Support is provided via email at ${COMPANY_EMAIL}.`,
    },
    {
      heading: "7. Limitation of liability",
      body: `To the fullest extent permitted by law, Variation Tracker is not liable for:

• Loss of profits, contracts, or business opportunities.
• Loss or corruption of data caused by your actions or third-party failures.
• Any indirect or consequential loss arising from use of the Service.

Our total liability to you in any 12-month period shall not exceed the fees you paid to us in that period. Nothing in these Terms limits liability for death or personal injury caused by our negligence, or for fraud.`,
    },
    {
      heading: "8. Intellectual property",
      body: `The ${COMPANY_NAME} software, design, and branding are our intellectual property. We grant you a non-exclusive, non-transferable licence to use the Service for your business purposes. You may not copy, modify, or distribute any part of the Service without our written consent.`,
    },
    {
      heading: "9. Termination",
      body: `You may close your account at any time from within the app or by emailing us. We may terminate or suspend your account if you breach these Terms. On termination, your data will be handled as described in our Privacy Policy.`,
    },
    {
      heading: "10. Governing law",
      body: `These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.`,
    },
    {
      heading: "11. Changes to these Terms",
      body: `We may update these Terms from time to time. We will notify you of material changes by email or in-app notice at least 14 days before they take effect. Continued use of the Service after that date constitutes acceptance of the updated Terms.`,
    },
  ],
};

// ---------------------------------------------------------------------------
// COOKIE POLICY
// ---------------------------------------------------------------------------

export const cookiePolicy: CookiePolicy = {
  title: "Cookie Policy",
  lastUpdated: LAST_UPDATED,
  intro: `This Cookie Policy explains what cookies Variation Tracker uses, why we use them, and how you can control them.`,
  sections: [
    {
      heading: "What are cookies?",
      body: `Cookies are small text files placed on your device by a website. They allow the site to remember information about your visit — for example, keeping you logged in between pages.`,
    },
    {
      heading: "Cookies we use",
      body: null, // rendered as a table below
      cookies: [
        {
          name: "sb-* (Supabase auth session)",
          type: "Necessary",
          purpose:
            "Keeps you authenticated. Set by Supabase when you log in and cleared when you log out. Without this cookie the app cannot function.",
          duration: "Session / up to 1 week",
        },
        {
          name: "cookie_consent",
          type: "Necessary",
          purpose:
            "Stores your cookie preference (accepted or necessary only) so we don't show the consent banner on every visit.",
          duration: "1 year (localStorage)",
          note: "Stored in localStorage, not a traditional cookie.",
        },
        {
          name: "Analytics cookies",
          type: "Analytics (not yet active)",
          purpose:
            "We may add privacy-respecting analytics in future to understand how the app is used. These are not currently active. We will update this policy and request consent before enabling them.",
          duration: "N/A",
        },
      ],
    },
    {
      heading: "Your choices",
      body: `When you first visit ${COMPANY_NAME} you will see a consent banner. You can choose:

• Accept all — we set any optional cookies in addition to necessary ones.
• Necessary only — we only set the cookies required for the app to work.

You can change your preference at any time by clearing your browser's localStorage for this site. Necessary cookies cannot be disabled because the app cannot function without them.`,
    },
    {
      heading: "Third-party cookies",
      body: `We use Supabase for authentication, which sets its own session cookies. We do not use Facebook Pixel, Google Ads, or any advertising-network cookies.`,
    },
    {
      heading: "Changes to this policy",
      body: `If we introduce new cookies we will update this page and, where required, ask for your consent again.`,
    },
    {
      heading: "Contact",
      body: `If you have questions about our use of cookies, email us at ${COMPANY_EMAIL}.`,
    },
  ],
};
