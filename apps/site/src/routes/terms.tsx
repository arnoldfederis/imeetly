import { createFileRoute } from "@tanstack/react-router";
import { LandingFooter } from "@/components/landing/landing-footer";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    ...seo({
      title: "Terms of Service",
      description:
        "Read the terms and conditions that govern your use of imeetly, our AI meeting notes service.",
      path: "/terms",
    }),
  }),
});

function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="font-bold text-4xl tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Last updated: April 28, 2026
          </p>

          <div className="mt-12 space-y-10 text-foreground/90 text-sm leading-relaxed [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:tracking-tight [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            <section>
              <h2>1. Acceptance of Terms</h2>
              <p className="mt-3">
                By accessing or using imeetly (&quot;the Service&quot;), you
                agree to be bound by these Terms of Service (&quot;Terms&quot;).
                If you do not agree, do not use the Service.
              </p>
              <p className="mt-3">
                These Terms form a legal agreement between you and imeetly,
                operated by Arnolfo Laureta Federis (&quot;we,&quot;
                &quot;us,&quot; or &quot;our&quot;). We may update these Terms
                from time to time. Your continued use of the Service after any
                changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2>2. Description of the Service</h2>
              <p className="mt-3">
                imeetly is an AI-powered meeting notes service. You can upload
                meeting recordings, video files, or text transcripts - or
                connect your Google Meet or Zoom account to import recordings
                automatically, or connect Microsoft Teams to manually import
                recordings. The Service uses artificial intelligence to generate
                structured outputs including transcripts, summaries, decisions,
                blockers, and action items.
              </p>
              <p className="mt-3">
                The Service is provided on a best-effort basis. Features and
                availability may change over time.
              </p>
              <p className="mt-3">
                To improve the Service, we collect aggregated usage data - such
                as which features are used and how users navigate the product -
                using PostHog analytics. This data is used solely to understand
                usage patterns and improve the product. It is not sold, shared
                for advertising, or used for any purpose unrelated to operating
                and improving the Service.
              </p>
            </section>

            <section>
              <h2>3. Eligibility and Accounts</h2>
              <p className="mt-3">
                You must be at least 16 years old to use the Service. By
                creating an account, you confirm you meet this requirement.
              </p>
              <p className="mt-3">
                You are responsible for maintaining the confidentiality of your
                account credentials. Notify us promptly at{" "}
                <a
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                  href="mailto:support@imeetly.app"
                >
                  support@imeetly.app
                </a>{" "}
                if you suspect unauthorized access to your account. We are not
                liable for losses caused by unauthorized use of your account.
              </p>
              <p className="mt-3">
                You are responsible for ensuring that any information you
                provide to us is accurate and kept up to date.
              </p>
            </section>

            <section>
              <h2>4. User Responsibilities</h2>
              <p className="mt-3">When using the Service, you agree to:</p>
              <ul className="mt-3">
                <li>
                  Provide accurate information when creating or maintaining your
                  account.
                </li>
                <li>
                  Use the Service in compliance with all applicable laws and
                  regulations.
                </li>
                <li>
                  Review AI-generated outputs for accuracy before relying on
                  them or sharing them with others.
                </li>
                <li>
                  Ensure you have the necessary rights and permissions for any
                  content you upload or process.
                </li>
                <li>
                  Not use the Service in any way that could harm, disable, or
                  impair its operation.
                </li>
              </ul>
            </section>

            <section>
              <h2>5. Uploaded Content and Recording Consent</h2>
              <p className="mt-3">
                You retain ownership of the content you upload to the Service.
                By uploading content, you grant us a limited, non-exclusive,
                royalty-free license to process it solely for the purpose of
                delivering the Service to you. We do not claim ownership over
                your content or the AI-generated outputs in your account.
              </p>
              <p className="mt-3">You represent and warrant that:</p>
              <ul className="mt-3">
                <li>
                  You have all rights, licenses, and permissions necessary to
                  upload and process the content.
                </li>
                <li>
                  Your content does not infringe any third-party intellectual
                  property rights, privacy rights, or contractual obligations.
                </li>
                <li>
                  If you upload recordings of meetings or conversations, you
                  have obtained all legally required consents from all
                  participants. Recording consent requirements vary
                  significantly by jurisdiction - some require all-party
                  consent. You are solely responsible for complying with
                  applicable recording and wiretapping laws in your location and
                  the locations of all participants.
                </li>
              </ul>
              <p className="mt-3">
                If you connect a third-party integration (Google Meet, Zoom, or
                Microsoft Teams), recordings retrieved via that integration are
                subject to the same representations, warranties, and consent
                obligations described above. You are responsible for ensuring
                you have the right to import and process those recordings.
              </p>
              <p className="mt-3">
                Uploaded or imported source files are processed and then deleted
                from our systems. Generated outputs are stored in your account
                until you delete them or your account is terminated.
              </p>
            </section>

            <section>
              <h2>6. Third-Party Integrations</h2>
              <p className="mt-3">
                The Service allows you to connect third-party meeting platforms
                (currently Google Meet, Zoom, and Microsoft Teams) via OAuth. By
                connecting an integration, you authorize imeetly to access your
                calendar events and cloud recordings through that platform's API
                on your behalf.
              </p>
              <ul className="mt-3">
                <li>
                  You may disconnect any integration at any time from{" "}
                  <strong>Settings → Integrations</strong>. Disconnecting
                  revokes our API access but does not delete meeting data
                  already imported.
                </li>
                <li>
                  We are not responsible for the availability, accuracy, or
                  content of data provided by third-party platforms via their
                  APIs.
                </li>
                <li>
                  Your use of connected platforms remains subject to those
                  platforms' own terms of service.
                </li>
              </ul>
            </section>

            <section>
              <h2>7. AI-Generated Outputs</h2>
              <p className="mt-3">
                The Service uses artificial intelligence to produce transcripts,
                summaries, and other structured outputs. You acknowledge and
                agree that:
              </p>
              <ul className="mt-3">
                <li>
                  AI-generated outputs may contain errors, omissions, or
                  inaccuracies. They are provided for convenience, not as a
                  definitive record.
                </li>
                <li>
                  You should not rely on generated outputs as a sole source of
                  truth for important decisions without independent review.
                </li>
                <li>
                  We do not warrant that any output will be accurate, complete,
                  or fit for any specific purpose.
                </li>
                <li>
                  Your uploaded content is processed by third-party AI providers
                  on our behalf. We do not use your content to train AI models.
                </li>
              </ul>
            </section>

            <section>
              <h2>8. Acceptable Use</h2>
              <p className="mt-3">You may not use the Service to:</p>
              <ul className="mt-3">
                <li>
                  Upload content that is unlawful, harmful, threatening,
                  abusive, defamatory, obscene, or otherwise objectionable.
                </li>
                <li>
                  Process content that you do not have the right to use or that
                  infringes on intellectual property or privacy rights.
                </li>
                <li>
                  Attempt to gain unauthorized access to the Service, other user
                  accounts, or connected systems.
                </li>
                <li>
                  Interfere with or disrupt the Service, servers, or networks.
                </li>
                <li>
                  Use automated tools to scrape, extract, or copy data from the
                  Service beyond its intended use.
                </li>
                <li>
                  Circumvent or attempt to circumvent usage limits, access
                  controls, or other technical restrictions.
                </li>
                <li>
                  Resell, sublicense, or provide access to the Service to third
                  parties without our written consent.
                </li>
              </ul>
              <p className="mt-3">
                We reserve the right to suspend or terminate accounts that
                violate these guidelines.
              </p>
            </section>

            <section>
              <h2>9. Billing and Subscriptions</h2>
              <p className="mt-3">
                The Service offers free and paid plans. Paid plans are billed on
                a recurring basis (monthly or annually) as specified at the time
                of purchase. All payments are processed through our payment
                provider, Polar.
              </p>
              <p className="mt-3">
                By subscribing to a paid plan, you authorize us to charge your
                payment method on a recurring basis until you cancel.
                Cancellation takes effect at the end of the current billing
                period - you retain access to paid features until then. We do
                not provide partial refunds for unused time within a billing
                cycle.
              </p>
              <p className="mt-3">
                We reserve the right to change pricing with reasonable advance
                notice. Price changes will apply starting with the next billing
                cycle after notice is provided.
              </p>
            </section>

            <section>
              <h2>10. Plan Limits and Fair Use</h2>
              <p className="mt-3">
                Each plan includes usage limits such as the number of meetings
                you can process per month (e.g., 5 meetings/month on the Free
                plan). Once you reach your limit, additional processing is
                unavailable until your quota resets or you upgrade.
              </p>
              <p className="mt-3">
                We reserve the right to enforce fair use policies and act
                against usage patterns that place excessive or abusive load on
                our infrastructure.
              </p>
            </section>

            <section>
              <h2>11. Intellectual Property</h2>
              <p className="mt-3">
                The Service - including its design, features, code, and branding
                - is owned by imeetly and protected by applicable intellectual
                property laws. These Terms do not grant you any rights to our
                trademarks, logos, or other proprietary materials.
              </p>
              <p className="mt-3">
                You retain ownership of your uploaded content and the
                AI-generated outputs stored in your account. We do not claim
                ownership over your content or outputs.
              </p>
            </section>

            <section>
              <h2>12. Service Availability and Changes</h2>
              <p className="mt-3">
                We aim to keep the Service available and reliable, but we do not
                guarantee uninterrupted or error-free operation. The Service may
                be temporarily unavailable due to maintenance, updates, or
                factors beyond our control.
              </p>
              <p className="mt-3">
                We reserve the right to modify, suspend, or discontinue any part
                of the Service at any time. We will make reasonable efforts to
                notify users of significant changes.
              </p>
            </section>

            <section>
              <h2>13. Disclaimers</h2>
              <p className="mt-3">
                The Service is provided &quot;as is&quot; and &quot;as
                available&quot; without warranties of any kind, whether express
                or implied, including but not limited to implied warranties of
                merchantability, fitness for a particular purpose, or
                non-infringement, to the fullest extent permitted by applicable
                law.
              </p>
              <p className="mt-3">
                We do not warrant that the Service will meet your requirements,
                that AI outputs will be accurate or complete, or that any
                particular feature will be available or remain unchanged.
              </p>
            </section>

            <section>
              <h2>14. Limitation of Liability</h2>
              <p className="mt-3">
                To the maximum extent permitted by applicable law, imeetly and
                its officers, employees, and affiliates shall not be liable for
                any indirect, incidental, special, consequential, or punitive
                damages - including but not limited to loss of profits, data, or
                goodwill - arising out of or related to your use of or inability
                to use the Service.
              </p>
              <p className="mt-3">
                Our total aggregate liability for claims arising from or related
                to the Service shall not exceed the greater of: (a) the amount
                you paid us in the twelve (12) months preceding the claim, or
                (b) fifty US dollars ($50).
              </p>
            </section>

            <section>
              <h2>15. Termination</h2>
              <p className="mt-3">
                You may close your account at any time through your account
                settings or by contacting{" "}
                <a
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                  href="mailto:support@imeetly.app"
                >
                  support@imeetly.app
                </a>
                . Closing your account deletes your personal data and meeting
                content from our active systems.
              </p>
              <p className="mt-3">
                We may suspend or terminate your access to the Service at any
                time, with or without cause, including for violation of these
                Terms. Upon termination, your right to use the Service ceases
                immediately.
              </p>
              <p className="mt-3">
                Sections relating to intellectual property, AI output
                disclaimers, disclaimers of warranty, limitation of liability,
                and governing terms survive termination.
              </p>
            </section>

            <section>
              <h2>16. Governing Law and Disputes</h2>
              <p className="mt-3">
                These Terms are governed by and construed in accordance with
                applicable law. Any disputes arising from these Terms or your
                use of the Service should first be raised with us directly at{" "}
                <a
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                  href="mailto:support@imeetly.app"
                >
                  support@imeetly.app
                </a>{" "}
                so we can attempt to resolve them in good faith. If a resolution
                cannot be reached, disputes shall be submitted to the courts of
                competent jurisdiction in the Philippines.
              </p>
            </section>

            <section>
              <h2>17. Changes to These Terms</h2>
              <p className="mt-3">
                We may revise these Terms from time to time. When we do, we will
                update the &quot;Last updated&quot; date at the top of this
                page. For material changes, we will make reasonable efforts to
                notify you via email or through the Service before the changes
                take effect.
              </p>
              <p className="mt-3">
                Your continued use of the Service after revised Terms take
                effect constitutes acceptance. If you do not agree with the
                revised Terms, stop using the Service and close your account.
              </p>
            </section>

            <section>
              <h2>18. Contact</h2>
              <p className="mt-3">
                Questions about these Terms? Contact us at:
              </p>
              <p className="mt-3">
                <strong>Email:</strong>{" "}
                <a
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                  href="mailto:support@imeetly.app"
                >
                  support@imeetly.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
