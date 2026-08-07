import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | WashDeck",
  description:
    "Learn how WashDeck collects, uses, and protects your personal data in compliance with Saudi Arabia PDPL.",
};

const EFFECTIVE_DATE = "1 August 2026";
const COMPANY_NAME = "WashDeck Technologies";
const CONTACT_EMAIL = "privacy@washdeck.app";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-[#0F172A] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href={"/login" as any} className="inline-flex items-center gap-3">
            <img
              src="/brand/washdeck-logo-transparent.png"
              alt="WashDeck"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <Link href={"/terms" as any} className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href={"/privacy" as any} className="text-white">Privacy Policy</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-full mb-4">
            Legal Document
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Effective Date: {EFFECTIVE_DATE} &nbsp;&middot;&nbsp; {COMPANY_NAME}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800 font-medium">
          This Privacy Policy describes how {COMPANY_NAME} collects, uses, stores, and protects your personal data. We are committed to complying with the Kingdom of Saudi Arabia Personal Data Protection Law (PDPL) and other applicable privacy regulations.
        </div>

        <div className="space-y-8">
          <Section title="1. Who We Are">
            <p>{COMPANY_NAME} (&ldquo;WashDeck,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the WashDeck vehicle operations management platform available at washdeck.app. We act as the data controller for personal data processed through the Platform.</p>
            <p>For data protection inquiries, contact our Data Privacy Officer at: <a href={"mailto:" + CONTACT_EMAIL} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a></p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <p><strong>Account Data:</strong> Name, email address, mobile number, and role when you register or are added as a user to a station account.</p>
            <p><strong>Station Business Data:</strong> Station name, address, contact details, branding assets, and configuration settings.</p>
            <p><strong>Customer Vehicle Data:</strong> Customer names, mobile numbers, vehicle registration numbers, service history, invoices, and notes entered by station operators into the Platform.</p>
            <p><strong>Operational Data:</strong> Job cards, appointments, attendance records, expense entries, and audit logs generated through use of the Platform.</p>
            <p><strong>Technical Data:</strong> IP addresses, browser type, device identifiers, pages visited, session duration, and error logs collected automatically when you use the Platform.</p>
            <p><strong>Payment Data:</strong> Subscription billing information. We do not store full payment card numbers; payment processing is handled by our payment providers.</p>
          </Section>

          <Section title="3. How We Use Your Data">
            <p>We use the data we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve the WashDeck Platform and its features</li>
              <li>Process subscription payments and manage your account</li>
              <li>Send transactional communications such as invoices, receipts, OTPs, and service notifications</li>
              <li>Generate reports and analytics visible to station owners and operators</li>
              <li>Detect and prevent fraud, abuse, or security threats</li>
              <li>Comply with legal obligations under Saudi Arabian law and applicable regulations</li>
              <li>Respond to support requests and improve customer service</li>
            </ul>
          </Section>

          <Section title="4. Legal Basis for Processing">
            <p>We process your personal data on the following legal bases as permitted under the Saudi Arabia Personal Data Protection Law (PDPL):</p>
            <ul>
              <li><strong>Contractual Necessity:</strong> Processing required to fulfill our subscription agreement with station owners</li>
              <li><strong>Legitimate Interests:</strong> Processing necessary for platform security, fraud prevention, and service improvement</li>
              <li><strong>Legal Obligation:</strong> Processing required to comply with applicable laws and regulatory requirements</li>
              <li><strong>Consent:</strong> Where we rely on consent (e.g., marketing communications), you may withdraw it at any time</li>
            </ul>
          </Section>

          <Section title="5. Data Sharing and Disclosure">
            <p>We do not sell your personal data. We may share your data with:</p>
            <p><strong>Service Providers:</strong> Third-party vendors who assist in operating the Platform, including cloud hosting providers (e.g., Vercel), database providers, and email delivery services. These providers are contractually bound to protect your data.</p>
            <p><strong>WhatsApp / Meta:</strong> When using WhatsApp communication templates, customer mobile numbers are transmitted to Meta&rsquo;s API infrastructure. This is subject to Meta&rsquo;s own privacy policies.</p>
            <p><strong>Legal Authorities:</strong> We may disclose data to government or regulatory authorities when required by applicable law, court order, or to protect our legal rights.</p>
            <p><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of the transaction.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain your personal data for as long as necessary to fulfill the purposes outlined in this Policy or as required by applicable law:</p>
            <ul>
              <li>Account data is retained for the duration of your subscription and 30 days after termination</li>
              <li>Customer vehicle and operational data is retained for the duration of your subscription and 30 days after termination, unless you request earlier deletion</li>
              <li>Audit logs and financial records may be retained for up to 7 years to comply with legal and regulatory requirements</li>
              <li>Technical logs are retained for up to 90 days</li>
            </ul>
          </Section>

          <Section title="7. Data Security">
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, loss, destruction, or alteration. These measures include:</p>
            <ul>
              <li>HTTPS encryption for all data in transit</li>
              <li>Encrypted database connections and secure credential storage</li>
              <li>Role-based access controls limiting data access to authorized personnel only</li>
              <li>Regular security reviews and monitoring</li>
              <li>Secure session management with JWT token authentication</li>
            </ul>
            <p>While we strive to protect your data, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.</p>
          </Section>

          <Section title="8. Your Rights Under PDPL">
            <p>As a data subject under the Saudi Arabia Personal Data Protection Law (PDPL), you have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete personal data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data, subject to legal retention obligations</li>
              <li><strong>Portability:</strong> Request your data in a structured, machine-readable format where technically feasible</li>
              <li><strong>Objection:</strong> Object to processing of your data based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent, without affecting the lawfulness of prior processing</li>
            </ul>
            <p>To exercise any of these rights, please contact us at <a href={"mailto:" + CONTACT_EMAIL} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>. We will respond within 30 days.</p>
          </Section>

          <Section title="9. Cookies and Tracking">
            <p>WashDeck uses session cookies and browser storage (localStorage/sessionStorage) to maintain your login session and store user preferences. These are strictly necessary for the Platform to function.</p>
            <p>We do not use third-party advertising cookies or cross-site tracking technologies. Technical analytics may be collected for performance monitoring purposes.</p>
          </Section>

          <Section title="10. Children&apos;s Privacy">
            <p>WashDeck is a business-to-business platform and is not directed at individuals under the age of 18. We do not knowingly collect personal data from minors. If you believe we have inadvertently collected data from a minor, please contact us immediately.</p>
          </Section>

          <Section title="11. International Data Transfers">
            <p>Your data may be processed on servers located outside the Kingdom of Saudi Arabia (for example, in the United States via Vercel&rsquo;s global infrastructure). We ensure that such transfers are conducted with appropriate safeguards and in compliance with the PDPL.</p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. When we make material changes, we will notify you by email or by posting a notice on the Platform. Your continued use of WashDeck after the effective date constitutes your acceptance of the updated Policy.</p>
          </Section>

          <Section title="13. Contact Us">
            <p>For any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact:</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 mt-3">
              <p className="font-bold text-slate-900">Data Privacy Officer — {COMPANY_NAME}</p>
              <p>Email: <a href={"mailto:" + CONTACT_EMAIL} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a></p>
            </div>
          </Section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4 font-semibold">
            <Link href={"/terms" as any} className="hover:text-slate-700 transition-colors">Terms of Service</Link>
            <Link href={"/login" as any} className="hover:text-slate-700 transition-colors">Back to Login</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:font-semibold [&_strong]:text-slate-800">
        {children}
      </div>
    </section>
  );
}
