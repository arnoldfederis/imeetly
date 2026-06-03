import type { Metadata } from "next";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how imeetly collects, uses, and protects your data when you use our AI meeting notes service.",
  openGraph: {
    title: "Privacy Policy - imeetly",
    url: "https://imeetly.app/privacy",
  },
  alternates: { canonical: "https://imeetly.app/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="font-bold text-4xl tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Last updated: May 17, 2026
          </p>

          <div className="mt-12 space-y-10 text-foreground/90 text-sm leading-relaxed [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:tracking-tight [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            <section>
              <h2>1. Introduction</h2>
              <p className="mt-3">
                imeetly, operated by Arnolfo Laureta Federis (&quot;we,&quot;
                &quot;us,&quot; or &quot;our&quot;), provides an AI-powered
                meeting notes service that turns meeting recordings and
                transcripts into structured summaries, decisions, blockers, and
                action items. This Privacy Policy explains what information we
                collect, how we use it, and the choices you have.
              </p>
              <p className="mt-3">
                By using imeetly, you agree to the practices described in this
                policy. If you do not agree, please do not use the service.
              </p>
            </section>

            <section>
              <h2>2. Information We Collect</h2>
              <p className="mt-3">
                We collect the following categories of information:
              </p>
              <ul className="mt-3">
                <li>
                  <strong>Account information:</strong> your name, email
                  address, and authentication credentials when you sign up,
                  including password credentials if you choose email and
                  password sign-in. If you authenticate via Google OAuth, we
                  receive your name, email address, and profile picture from
                  Google.
                </li>
                <li>
                  <strong>Uploaded content:</strong> audio, video, or text files
                  you submit for processing.
                </li>
                <li>
                  <strong>Generated outputs:</strong> transcripts, summaries,
                  decisions, blockers, action items, and related structured
                  meeting outputs produced by our AI pipeline.
                </li>
                <li>
                  <strong>Memory and search data:</strong> meeting outputs and
                  related metadata that power searchable meeting history,
                  cross-meeting recall, and in-product memory features.
                </li>
                <li>
                  <strong>Meeting metadata:</strong> meeting titles, dates,
                  participant names, and processing status.
                </li>
                <li>
                  <strong>Usage data:</strong> which features you use, how many
                  meetings you have processed, and similar activity information.
                </li>
                <li>
                  <strong>Billing information:</strong> subscription status and
                  plan tier. Payment card details are handled directly by our
                  payment provider (Polar) and are never stored on our servers.
                </li>
                <li>
                  <strong>Integration data:</strong> if you connect a
                  third-party meeting platform (Google Meet, Zoom, or Microsoft
                  Teams), we store OAuth access and refresh tokens - encrypted
                  at rest - to fetch your calendar events and cloud recordings
                  on your behalf. We also store basic metadata about meetings
                  retrieved via those integrations (title, date, participants,
                  join URL).
                </li>
                <li>
                  <strong>Session and authentication data:</strong> session
                  tokens, device identifiers, passkey credentials, and records
                  related to password reset, verification, and account security
                  events used to keep you securely signed in and protect your
                  account.
                </li>
                <li>
                  <strong>Technical and log data:</strong> IP address, browser
                  type, and basic access logs collected automatically when you
                  interact with the service.
                </li>
              </ul>
            </section>

            <section>
              <h2>3. How We Use Your Information</h2>
              <p className="mt-3">We use the information we collect to:</p>
              <ul className="mt-3">
                <li>Provide, operate, and maintain the imeetly service.</li>
                <li>
                  Authenticate your identity and keep your account secure.
                </li>
                <li>
                  Process uploaded content - and recordings retrieved via
                  connected integrations - to generate meeting notes, summaries,
                  and action items using AI.
                </li>
                <li>
                  Store and organize generated meeting outputs so they can be
                  used in searchable history and memory features inside the
                  product.
                </li>
                <li>
                  Access your calendar and cloud recordings through connected
                  integrations, solely to import the meetings you choose to
                  process.
                </li>
                <li>Manage your subscription and process billing.</li>
                <li>
                  Send transactional emails such as verification codes, password
                  reset links, password change confirmations, and account
                  notices. We do not send marketing emails without your consent.
                </li>
                <li>
                  Monitor service performance, investigate errors, and improve
                  reliability.
                </li>
                <li>
                  Detect and prevent abuse, fraud, or unauthorized access.
                </li>
              </ul>
            </section>

            <section>
              <h2>4. AI Processing and Uploaded Content</h2>
              <p className="mt-3">
                When you upload a meeting recording or paste a transcript, our
                service sends that content to AI processing pipelines to produce
                transcripts, summaries, and action items. There are a few
                important things to understand about this:
              </p>
              <ul className="mt-3">
                <li>
                  <strong>
                    We do not use your content to train AI models, and we
                    require our AI providers to do the same.
                  </strong>{" "}
                  Your meeting data is processed solely to deliver the service
                  to you. Where providers offer an explicit opt-out from model
                  training programs, we enable it (for example, we opt out of
                  Deepgram&apos;s Model Improvement Program on all requests).
                </li>
                <li>
                  <strong>AI outputs may not be accurate.</strong> Transcripts
                  and summaries are generated automatically and may contain
                  errors, omissions, or misattributions. You should review all
                  outputs before relying on them or sharing them.
                </li>
                <li>
                  <strong>Memory features depend on saved outputs.</strong> If
                  you use imeetly memory or search features, those experiences
                  rely on meeting transcripts, summaries, and related structured
                  outputs retained in your account.
                </li>
                <li>
                  <strong>
                    Third-party AI providers process your content.
                  </strong>{" "}
                  To deliver the service, your audio, video, or transcript
                  content is sent to one or more of the AI providers listed in
                  Section 6. These providers process content on our behalf under
                  their own data processing terms.
                </li>
                <li>
                  <strong>Uploaded source files are temporary.</strong> After
                  processing, the original uploaded file is deleted from our
                  storage. Only the structured outputs (summaries, transcripts,
                  action items) and associated metadata are retained in your
                  account.
                </li>
              </ul>
              <p className="mt-3">
                If processing fails, the temporary file may be retained briefly
                for retry before being deleted.
              </p>
            </section>

            <section>
              <h2>5. Third-Party Integration Connections</h2>
              <p className="mt-3">
                imeetly allows you to connect your Google Meet or Zoom account
                via OAuth. When you do:
              </p>
              <ul className="mt-3">
                <li>
                  We store encrypted OAuth tokens (access token and refresh
                  token) to authenticate API calls on your behalf.
                </li>
                <li>
                  We access only the data scopes you explicitly authorize during
                  the OAuth flow. We do not request broader permissions than
                  necessary to import your meeting recordings.
                </li>
                <li>
                  Meeting metadata (title, date, join URL) and recordings
                  fetched via integrations are subject to the same data handling
                  practices as content you upload directly.
                </li>
                <li>
                  When you connect Google Meet, we register a Google Calendar
                  push notification channel so we can automatically detect when
                  new recordings are available. This channel is removed when you
                  disconnect the integration.
                </li>
                <li>
                  You can disconnect any integration at any time from{" "}
                  <strong>Settings → Integrations</strong>. Disconnecting
                  revokes our access and deletes the stored OAuth tokens. It
                  does not delete meeting data already imported into your
                  account.
                </li>
              </ul>
              <p className="mt-3">
                Recording downloads via integrations are processed
                server-to-server and are subject to the same temporary storage
                and deletion practices described in Section 4.
              </p>
            </section>

            <section>
              <h2>6. Third-Party Service Providers</h2>
              <p className="mt-3">
                We work with the following third-party providers to operate the
                service. Each receives only the data necessary to perform their
                function:
              </p>
              <ul className="mt-3">
                <li>
                  <strong>Polar</strong> - payment processing and subscription
                  management. Polar handles billing and stores payment card
                  details.
                </li>
                <li>
                  <strong>Resend</strong> - transactional email delivery
                  (verification codes, account notices).
                </li>
                <li>
                  <strong>Cloudflare R2</strong> - object storage for
                  temporarily holding uploaded files during processing.
                </li>
                <li>
                  <strong>Deepgram</strong> - speech-to-text transcription.
                  Rather than uploading your file to Deepgram, we generate a
                  short-lived signed URL pointing to your recording in
                  Cloudflare R2 storage and pass that URL to Deepgram. Deepgram
                  fetches the file directly, transcribes it, and returns the
                  text. We explicitly opt out of Deepgram&apos;s Model
                  Improvement Program on every request, meaning Deepgram does
                  not retain or use your audio to train their models. See{" "}
                  <a
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                    href="https://deepgram.com/privacy"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Deepgram&apos;s Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong>Groq</strong> - AI language model used for meeting
                  summary and action item extraction.
                </li>
                <li>
                  <strong>OpenAI</strong> - AI language model used as a fallback
                  for extraction when the primary provider is unavailable.
                </li>
                <li>
                  <strong>Google</strong> - OAuth 2.0 sign-in and, if you
                  connect the Google Meet integration, Google Calendar API to
                  retrieve calendar events, Google Meet API to find conference
                  recording artifacts, and Google Drive API (
                  <code>drive.meet.readonly</code> scope only) to download
                  Meet-generated recording files. We do not access your full
                  Google Drive.
                </li>
                <li>
                  <strong>Zoom</strong> - if you connect the Zoom integration,
                  we use Zoom&apos;s OAuth API to access your cloud recordings.
                  We request only recording-related scopes.
                </li>
              </ul>
              <p className="mt-3">
                These providers may change over time. We will update this
                section when we add or remove providers that handle personal
                data or uploaded content.
              </p>
            </section>

            <section>
              <h2>7. Cookies and Session Tokens</h2>
              <p className="mt-3">
                We use session cookies and authentication tokens to keep you
                signed in. These are essential for the service to function and
                cannot be disabled without logging out.
              </p>
              <p className="mt-3">
                Specifically, we set an HTTP-only, secure session cookie when
                you authenticate. This cookie does not contain personal data
                beyond an opaque session identifier. We do not use third-party
                advertising cookies or tracking pixels.
              </p>
              <p className="mt-3">
                Depending on how you sign in, we may also process password
                credentials, passkey credentials, verification codes, reset
                tokens, and related security events in order to authenticate
                you, protect your account, and manage your active sessions.
              </p>
              <p className="mt-3">
                You can clear cookies via your browser settings. Doing so will
                sign you out of the service.
              </p>
            </section>

            <section>
              <h2>8. Data Security</h2>
              <p className="mt-3">
                We apply reasonable technical and organizational safeguards to
                protect your information, including encryption in transit
                (HTTPS/TLS), HTTP-only session cookies, access controls, and
                secure infrastructure practices.
              </p>
              <p className="mt-3">
                No method of transmission or storage is completely secure. While
                we work to protect your data, we cannot guarantee absolute
                security and encourage you to use a strong, unique password and
                to notify us immediately if you suspect unauthorized activity on
                your account.
              </p>
            </section>

            <section>
              <h2>9. Data Retention</h2>
              <p className="mt-3">
                We retain your account data and generated meeting outputs for as
                long as your account is active. Uploaded source files are
                deleted after successful processing as described in Section 4.
              </p>
              <p className="mt-3">
                If you delete your account, we will remove your personal data
                and meeting content from our active systems. We do not currently
                maintain long-term database backups, so deletion from active
                systems is effectively permanent.
              </p>
              <p className="mt-3">
                We may retain certain minimal records where required by law or
                legitimate business interest (for example, billing records or
                security logs).
              </p>
            </section>

            <section>
              <h2>10. International Data Transfers</h2>
              <p className="mt-3">
                imeetly is operated from the Philippines, and our infrastructure
                and third-party providers are primarily based in the United
                States. If you access the service from outside the United
                States, your information - including uploaded meeting content -
                will be transferred to and processed in the United States and
                potentially other countries where our providers operate.
              </p>
              <p className="mt-3">
                By using the service, you acknowledge that your data may be
                processed in countries with different data protection laws than
                your own.
              </p>
            </section>

            <section>
              <h2>11. Your Rights and Choices</h2>
              <p className="mt-3">
                You have the following rights regarding your personal data:
              </p>
              <ul className="mt-3">
                <li>
                  <strong>Access:</strong> You can view the account information
                  and meeting data stored in your account at any time.
                </li>
                <li>
                  <strong>Correction:</strong> You can update your name and
                  profile information through account settings.
                </li>
                <li>
                  <strong>Deletion:</strong> You can delete individual meetings
                  from your account, or delete your entire account through
                  account settings. Account deletion removes your personal data
                  and all meeting content from our active systems.
                </li>
                <li>
                  <strong>Other requests:</strong> For requests about accessing
                  a copy of your data or other privacy matters, contact us at{" "}
                  <a
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                    href="mailto:privacy@imeetly.app"
                  >
                    privacy@imeetly.app
                  </a>
                  .
                </li>
              </ul>
            </section>

            <section>
              <h2>12. Children&apos;s Privacy</h2>
              <p className="mt-3">
                imeetly is not intended for use by anyone under the age of 16.
                We do not knowingly collect personal information from children.
                If you believe a child has provided us with personal
                information, please contact us and we will promptly remove it.
              </p>
            </section>

            <section>
              <h2>13. Changes to This Policy</h2>
              <p className="mt-3">
                We may update this Privacy Policy from time to time. When we do,
                we will update the &quot;Last updated&quot; date at the top of
                this page. For material changes, we will make reasonable efforts
                to notify you via email or through the service before the
                changes take effect. Continued use of the service after a change
                constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2>14. Contact</h2>
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
