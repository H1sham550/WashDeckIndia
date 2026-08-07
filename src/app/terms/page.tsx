import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | WashDeck",
  description:
    "Review the Terms of Service governing your use of the WashDeck vehicle operations management platform.",
};

const EFFECTIVE_DATE = "1 August 2026";
const COMPANY_NAME = "WashDeck Technologies";
const CONTACT_EMAIL = "legal@washdeck.app";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-[#0F172A] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={"/login" as any} className="inline-flex items-center gap-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-700 transition">
            <span>← Return to Sign In</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
            <Link href={"/terms" as any} className="text-white underline underline-offset-4">Terms of Service</Link>
            <Link href={"/privacy" as any} className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-full mb-4">
            Legal Document
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Effective Date: {EFFECTIVE_DATE} &nbsp;&middot;&nbsp; {COMPANY_NAME}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800 font-medium">
          Please read these Terms carefully before using WashDeck. By accessing or using the platform, you agree to be bound by these Terms.
        </div>

        <div className="space-y-8">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using WashDeck (the &ldquo;Platform&rdquo;), operated by {COMPANY_NAME} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, you must not use the Platform.</p>
            <p>These Terms apply to all users, including station owners, staff members, and any individuals accessing the Platform in any capacity.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>WashDeck is a cloud-based vehicle operations and relationship management platform designed for car wash and detailing businesses. The Platform provides tools including:</p>
            <ul>
              <li>Job card and queue management</li>
              <li>Customer vehicle history and CRM</li>
              <li>Invoicing and payment tracking</li>
              <li>Staff and attendance management</li>
              <li>Appointment scheduling and booking portals</li>
              <li>Analytics and operational reporting</li>
              <li>WhatsApp communication templates</li>
            </ul>
          </Section>

          <Section title="3. Account Registration">
            <p>To use WashDeck, you must register a station account. You represent that all registration information you provide is accurate, current, and complete. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</p>
            <p>You must notify us immediately at <a href={"mailto:" + CONTACT_EMAIL} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a> if you suspect unauthorized access to your account.</p>
          </Section>

          <Section title="4. Subscription Plans and Billing">
            <p>WashDeck operates on a subscription-based model. Features and usage limits vary by plan. By subscribing, you authorize us to charge the subscription fee to your chosen payment method on the applicable billing cycle.</p>
            <p><strong>Trial Period:</strong> New stations may receive a free trial period. At the end of the trial, the station will transition to a paid plan or become read-only unless a subscription is activated.</p>
            <p><strong>Grace Period:</strong> If a subscription lapses, a grace period may be granted at our discretion. During the grace period, write operations are restricted.</p>
            <p><strong>Suspension:</strong> Accounts with overdue payments may be suspended. Suspended accounts cannot access any operational features.</p>
            <p>All fees are non-refundable unless otherwise required by applicable law. Prices are subject to change with 30 days&rsquo; written notice.</p>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any unlawful purpose or in violation of any applicable laws or regulations in the Kingdom of Saudi Arabia or any other jurisdiction</li>
              <li>Upload, transmit, or store any malicious code, viruses, or harmful software</li>
              <li>Attempt to gain unauthorized access to the Platform, its servers, or any connected systems</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
              <li>Sell, resell, or sublicense access to the Platform without our prior written consent</li>
              <li>Use automated scripts or bots to scrape, crawl, or extract data from the Platform</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
            </ul>
          </Section>

          <Section title="6. Data and Privacy">
            <p>Your use of the Platform is also governed by our <Link href={"/privacy" as any} className="text-blue-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference. By using the Platform, you consent to the collection and use of your information as described in the Privacy Policy.</p>
            <p>You retain ownership of all customer data and business data you input into WashDeck. You grant us a limited, non-exclusive license to process this data solely to provide and improve the Platform.</p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>All intellectual property rights in the Platform — including the software, design, trademarks, logos, and content — are owned by or licensed to {COMPANY_NAME}. Nothing in these Terms transfers any intellectual property rights to you.</p>
            <p>You may not use our trademarks, trade names, or logos without our prior written consent.</p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>To the maximum extent permitted by applicable law, {COMPANY_NAME} and its directors, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, goodwill, or business interruption, arising out of or relating to your use of or inability to use the Platform.</p>
            <p>In no event shall our total liability to you exceed the total fees paid by you in the three (3) months preceding the claim.</p>
          </Section>

          <Section title="9. Indemnification">
            <p>You agree to indemnify, defend, and hold harmless {COMPANY_NAME} and its affiliates, officers, agents, and employees from and against any claims, liabilities, damages, losses, and expenses arising out of or in connection with: (a) your use of the Platform; (b) your violation of these Terms; or (c) your violation of any rights of a third party.</p>
          </Section>

          <Section title="10. Termination">
            <p>We reserve the right to suspend or terminate your access to the Platform at our discretion, including for violation of these Terms, non-payment of fees, or any activity we determine to be harmful to other users, the Platform, or third parties.</p>
            <p>Upon termination, your right to access the Platform ceases immediately. We will retain your data for 30 days after termination before permanently deleting it, unless required by law to retain it longer.</p>
          </Section>

          <Section title="11. Modifications to Terms">
            <p>We may update these Terms from time to time. When we make material changes, we will notify you by email or by posting a prominent notice on the Platform. Your continued use of the Platform after the effective date constitutes your acceptance of the changes.</p>
          </Section>

          <Section title="12. Governing Law and Dispute Resolution">
            <p>These Terms shall be governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia. Any dispute arising out of or in connection with these Terms shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be submitted to the competent courts in the Kingdom of Saudi Arabia.</p>
          </Section>

          <Section title="13. Contact Information">
            <p>If you have any questions about these Terms, please contact us at:</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 mt-3">
              <p className="font-bold text-slate-900">{COMPANY_NAME}</p>
              <p>Email: <a href={"mailto:" + CONTACT_EMAIL} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a></p>
            </div>
          </Section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4 font-semibold">
            <Link href={"/privacy" as any} className="hover:text-slate-700 transition-colors">Privacy Policy</Link>
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
