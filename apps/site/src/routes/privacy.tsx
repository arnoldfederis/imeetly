import { createFileRoute } from "@tanstack/react-router";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    ...seo({
      title: "Privacy Policy",
      description:
        "Learn how imeetly collects, uses, and protects your data when you use our AI meeting notes service.",
      path: "/privacy",
    }),
  }),
});

function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="font-bold text-4xl tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Last updated: April 7, 2026
          </p>

          <div className="mt-12 space-y-10 text-foreground/90 text-sm leading-relaxed [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:tracking-tight [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            <section>
              <h2>1. Introduction</h2>
              <p className="mt-3">
                imeetly (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
                provides an AI-powered meeting notes service that helps you turn
                meeting recordings and transcripts into structured summaries,
                decisions, blockers, and action items. This Privacy Policy
                explains how we collect, use, and protect your information when
                you use our website and service.
              </p>
              <p className="mt-3">
                By using imeetly, you agree to the practices described in this
                policy.
              </p>
            </section>

            <section>
              <h2>2. Information We Collect</h2>
              <p className="mt-3">
                We collect the following types of information:
              </p>
              <ul className="mt-3">
                <li>
                  <strong>Account information:</strong> your name, email
                  address, and authentication credentials when you create an
                  account.
                </li>
                <li>
                  <strong>Uploaded content:</strong> audio, video, or text files
                  you upload for processing.
                </li>
                <li>
                  <strong>Generated outputs:</strong> summaries, decisions,
                  blockers, action items, and transcripts produced by our AI
                  processing.
                </li>
                <li>
                  <strong>Usage data:</strong> information about how you
                  interact with the service, including features used and meeting
                  counts.
                </li>
                <li>
                  <strong>Billing information:</strong> payment details
                  processed through our payment provider. We do not store full
                  payment card details on our servers.
                </li>
                <li>
                  <strong>Device and log data:</strong> IP address, browser
                  type, and basic access logs collected automatically.
                </li>
              </ul>
            </section>

            <section>
              <h2>3. How We Use Information</h2>
              <p className="mt-3">We use the information we collect to:</p>
              <ul className="mt-3">
                <li>Provide, maintain, and improve the imeetly service.</li>
                <li>
                  Process your uploaded content and generate meeting notes,
                  summaries, and action items.
                </li>
                <li>Manage your account and billing.</li>
                <li>
                  Communicate with you about your account, service updates, or
                  support requests.
                </li>
                <li>
                  Monitor usage for security, abuse prevention, and service
                  reliability.
                </li>
              </ul>
            </section>

            <section>
              <h2>4. Uploaded Content and Processing</h2>
              <p className="mt-3">
                When you upload audio, video, or text files, our service
                processes them using AI to extract structured meeting notes. It
                is important to understand the distinction between your uploaded
                source files and the outputs we generate:
              </p>
              <ul className="mt-3">
                <li>
                  <strong>Uploaded source files</strong> (audio, video, or raw
                  text) are used solely for processing and are not retained
                  permanently.
                </li>
                <li>
                  <strong>Generated outputs</strong> (summaries, transcripts,
                  decisions, blockers, and action items) are stored in your
                  account so you can access and manage them.
                </li>
              </ul>
              <p className="mt-3">
                We do not use your uploaded content or generated outputs to
                train AI models. Your meeting data is processed to provide the
                service to you and is not shared with other users.
              </p>
            </section>

            <section>
              <h2>5. Temporary File Handling and Retention</h2>
              <p className="mt-3">
                Uploaded source files are temporary. After your file has been
                successfully processed, the original uploaded file is deleted
                from our systems. We retain only the structured outputs
                (summaries, transcripts, action items, etc.) and associated
                metadata in your account.
              </p>
              <p className="mt-3">
                If processing fails, temporary files may be retained briefly for
                retry purposes before being deleted.
              </p>
            </section>

            <section>
              <h2>6. Third-Party Services</h2>
              <p className="mt-3">
                We use third-party service providers to help operate and deliver
                our service. These may include:
              </p>
              <ul className="mt-3">
                <li>
                  <strong>Cloud infrastructure providers</strong> for hosting,
                  storage, and content delivery.
                </li>
                <li>
                  <strong>AI processing providers</strong> for transcription and
                  natural language processing.
                </li>
                <li>
                  <strong>Payment processors</strong> for handling billing and
                  subscriptions.
                </li>
                <li>
                  <strong>Email service providers</strong> for transactional
                  communications.
                </li>
              </ul>
              <p className="mt-3">
                These providers have access to information only as necessary to
                perform their functions and are obligated to handle it in
                accordance with their own privacy and security practices.
              </p>
            </section>

            <section>
              <h2>7. Cookies and Analytics</h2>
              <p className="mt-3">
                We may use cookies and similar technologies to maintain your
                session, remember your preferences, and understand how you use
                the service. We do not use third-party advertising trackers.
              </p>
              <p className="mt-3">
                You can control cookie preferences through your browser
                settings. Disabling cookies may affect certain functionality.
              </p>
            </section>

            <section>
              <h2>8. Data Security</h2>
              <p className="mt-3">
                We implement reasonable technical and organizational measures to
                protect your information against unauthorized access, loss, or
                misuse. These include encryption in transit, access controls,
                and secure infrastructure practices.
              </p>
              <p className="mt-3">
                However, no method of transmission or storage is completely
                secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            <section>
              <h2>9. Data Retention</h2>
              <p className="mt-3">
                We retain your account information and generated meeting outputs
                for as long as your account is active. Uploaded source files are
                deleted after processing as described in Section 5.
              </p>
              <p className="mt-3">
                If you delete your account, we will remove your personal data
                and meeting outputs from our active systems. Some data may be
                retained in backups for a limited period before being fully
                purged.
              </p>
            </section>

            <section>
              <h2>10. Your Rights</h2>
              <p className="mt-3">
                Depending on your location, you may have certain rights
                regarding your personal data, including the right to:
              </p>
              <ul className="mt-3">
                <li>Access the personal data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your data.</li>
                <li>Export your data in a portable format.</li>
              </ul>
              <p className="mt-3">
                You can manage and delete your meeting data directly from your
                account settings. For other requests, contact us using the
                information below.
              </p>
            </section>

            <section>
              <h2>11. Children&apos;s Privacy</h2>
              <p className="mt-3">
                imeetly is not intended for use by individuals under the age of
                16. We do not knowingly collect personal information from
                children. If you believe a child has provided us with personal
                information, please contact us and we will take steps to remove
                it.
              </p>
            </section>

            <section>
              <h2>12. Changes to This Policy</h2>
              <p className="mt-3">
                We may update this Privacy Policy from time to time. When we
                make changes, we will update the &quot;Last updated&quot; date
                at the top of this page. We encourage you to review this policy
                periodically. Continued use of the service after changes
                constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2>13. Contact Information</h2>
              <p className="mt-3">
                If you have questions or concerns about this Privacy Policy or
                our data practices, please contact us at:
              </p>
              <p className="mt-3">
                <strong>Email:</strong>{" "}
                <a
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                  href="mailto:privacy@imeetly.app"
                >
                  privacy@imeetly.app
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
