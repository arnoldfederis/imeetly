import { createFileRoute } from "@tanstack/react-router";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
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
      <LandingHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="font-bold text-4xl tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Last updated: April 7, 2026
          </p>

          <div className="mt-12 space-y-10 text-foreground/90 text-sm leading-relaxed [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:tracking-tight [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            <section>
              <h2>1. Acceptance of Terms</h2>
              <p className="mt-3">
                By accessing or using imeetly (&quot;the Service&quot;), you
                agree to be bound by these Terms of Service (&quot;Terms&quot;).
                If you do not agree to these Terms, do not use the Service.
              </p>
              <p className="mt-3">
                These Terms constitute a legal agreement between you and imeetly
                (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We may
                update these Terms from time to time, and your continued use of
                the Service after any changes constitutes acceptance of the
                revised Terms.
              </p>
            </section>

            <section>
              <h2>2. Description of the Service</h2>
              <p className="mt-3">
                imeetly is an AI-powered meeting notes service. You can upload
                meeting recordings, video files, or text transcripts, and the
                Service uses artificial intelligence to generate structured
                outputs including summaries, decisions, blockers, and action
                items.
              </p>
              <p className="mt-3">
                The Service is provided on a best-effort basis. AI-generated
                outputs may contain errors, omissions, or inaccuracies. You are
                responsible for reviewing all generated content before relying
                on it for any purpose.
              </p>
            </section>

            <section>
              <h2>3. Eligibility and Accounts</h2>
              <p className="mt-3">
                You must be at least 16 years old to use the Service. By
                creating an account, you represent that you meet this age
                requirement.
              </p>
              <p className="mt-3">
                You are responsible for maintaining the security of your account
                credentials. You agree to notify us promptly if you become aware
                of any unauthorized use of your account. We are not liable for
                any loss arising from unauthorized access to your account.
              </p>
              <p className="mt-3">
                You may only maintain one account per person unless otherwise
                agreed.
              </p>
            </section>

            <section>
              <h2>4. User Responsibilities</h2>
              <p className="mt-3">When using the Service, you agree to:</p>
              <ul className="mt-3">
                <li>
                  Provide accurate and complete information when creating your
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
                  content you upload.
                </li>
                <li>
                  Not use the Service in any way that could harm, disable, or
                  impair it.
                </li>
              </ul>
            </section>

            <section>
              <h2>5. Uploaded Content</h2>
              <p className="mt-3">
                You retain ownership of the content you upload to the Service.
                By uploading content, you grant us a limited, non-exclusive
                license to process it solely for the purpose of providing the
                Service to you.
              </p>
              <p className="mt-3">
                You represent and warrant that you have all necessary rights to
                upload and process your content, and that doing so does not
                violate any third-party rights, confidentiality obligations, or
                applicable laws. If you upload recordings of meetings, you are
                responsible for obtaining any required consent from
                participants.
              </p>
              <p className="mt-3">
                Uploaded source files (audio, video, or text) are processed
                temporarily and deleted after successful processing. Generated
                outputs are stored in your account until you delete them or your
                account is terminated.
              </p>
            </section>

            <section>
              <h2>6. Acceptable Use</h2>
              <p className="mt-3">You may not use the Service to:</p>
              <ul className="mt-3">
                <li>
                  Upload content that is unlawful, harmful, threatening,
                  abusive, defamatory, or otherwise objectionable.
                </li>
                <li>
                  Process content that you do not have the right to use or that
                  infringes on any intellectual property or privacy rights.
                </li>
                <li>
                  Attempt to gain unauthorized access to the Service, other
                  accounts, or connected systems.
                </li>
                <li>
                  Interfere with or disrupt the Service, servers, or networks.
                </li>
                <li>
                  Use the Service for automated scraping, data mining, or any
                  purpose other than its intended use.
                </li>
                <li>
                  Circumvent or attempt to circumvent usage limits, access
                  controls, or other restrictions.
                </li>
                <li>
                  Resell, redistribute, or sublicense access to the Service
                  without our written consent.
                </li>
              </ul>
              <p className="mt-3">
                We reserve the right to suspend or terminate accounts that
                violate these acceptable use guidelines.
              </p>
            </section>

            <section>
              <h2>7. Billing and Subscription Terms</h2>
              <p className="mt-3">
                The Service offers both free and paid plans. Paid plans are
                billed on a recurring basis (monthly or annually) as specified
                at the time of purchase. Payment is processed through our
                third-party payment provider.
              </p>
              <p className="mt-3">
                By subscribing to a paid plan, you authorize us to charge your
                selected payment method on a recurring basis until you cancel.
                You may cancel your subscription at any time through your
                account settings. Cancellation takes effect at the end of the
                current billing period — no partial refunds are provided for
                unused time within a billing cycle.
              </p>
              <p className="mt-3">
                We reserve the right to change pricing with reasonable notice.
                Price changes will apply to the next billing cycle after the
                change takes effect.
              </p>
            </section>

            <section>
              <h2>8. Plan Limits and Usage Restrictions</h2>
              <p className="mt-3">
                Each plan includes specific usage limits, such as the number of
                meetings you can process per month. The free plan currently
                includes 5 meetings per month. Paid plans include higher limits
                as described on our pricing page.
              </p>
              <p className="mt-3">
                Once you reach your plan&apos;s limit, additional processing
                will be unavailable until your limit resets or you upgrade to a
                higher plan. Service features and limits may vary by plan and
                are subject to change.
              </p>
              <p className="mt-3">
                We reserve the right to enforce fair use policies and take
                action against usage patterns that are abusive or place
                excessive burden on our infrastructure.
              </p>
            </section>

            <section>
              <h2>9. Intellectual Property</h2>
              <p className="mt-3">
                The Service, including its design, features, code, and branding,
                is owned by imeetly and protected by applicable intellectual
                property laws. These Terms do not grant you any rights to our
                trademarks, logos, or other proprietary materials.
              </p>
              <p className="mt-3">
                You retain ownership of your uploaded content and the generated
                outputs in your account. We do not claim ownership over your
                content or the results produced by the Service.
              </p>
            </section>

            <section>
              <h2>10. Service Availability and Changes</h2>
              <p className="mt-3">
                We strive to keep the Service available and reliable, but we do
                not guarantee uninterrupted or error-free operation. The Service
                may be temporarily unavailable due to maintenance, updates, or
                circumstances beyond our control.
              </p>
              <p className="mt-3">
                We reserve the right to modify, suspend, or discontinue any part
                of the Service at any time, with or without notice. We will make
                reasonable efforts to notify users of significant changes.
              </p>
            </section>

            <section>
              <h2>11. Disclaimers</h2>
              <p className="mt-3">
                The Service is provided &quot;as is&quot; and &quot;as
                available&quot; without warranties of any kind, whether express
                or implied, including but not limited to implied warranties of
                merchantability, fitness for a particular purpose, or
                non-infringement.
              </p>
              <p className="mt-3">
                We do not warrant that AI-generated outputs will be accurate,
                complete, or free of errors. The Service uses artificial
                intelligence, which is inherently probabilistic and may produce
                incorrect or incomplete results. You should not rely on
                generated outputs as a sole source of truth for important
                decisions without independent verification.
              </p>
            </section>

            <section>
              <h2>12. Limitation of Liability</h2>
              <p className="mt-3">
                To the maximum extent permitted by applicable law, imeetly and
                its officers, employees, and affiliates shall not be liable for
                any indirect, incidental, special, consequential, or punitive
                damages, including but not limited to loss of profits, data,
                use, or goodwill, arising out of or related to your use of the
                Service.
              </p>
              <p className="mt-3">
                Our total aggregate liability for any claims arising from or
                related to the Service shall not exceed the amount you have paid
                us in the twelve (12) months preceding the claim, or fifty US
                dollars ($50), whichever is greater.
              </p>
            </section>

            <section>
              <h2>13. Termination</h2>
              <p className="mt-3">
                You may terminate your account at any time through your account
                settings or by contacting us.
              </p>
              <p className="mt-3">
                We may suspend or terminate your access to the Service at any
                time, with or without cause, including for violation of these
                Terms. Upon termination, your right to use the Service ceases
                immediately. We may delete your account data after termination,
                subject to any legal obligations to retain certain information.
              </p>
              <p className="mt-3">
                Sections relating to intellectual property, disclaimers,
                limitation of liability, and governing terms survive
                termination.
              </p>
            </section>

            <section>
              <h2>14. Governing Terms and Disputes</h2>
              <p className="mt-3">
                These Terms shall be governed by and construed in accordance
                with applicable law. Any disputes arising from these Terms or
                your use of the Service shall be resolved through good-faith
                negotiation first. If a resolution cannot be reached, disputes
                shall be submitted to the appropriate courts of competent
                jurisdiction.
              </p>
            </section>

            <section>
              <h2>15. Changes to These Terms</h2>
              <p className="mt-3">
                We may revise these Terms from time to time. When we make
                changes, we will update the &quot;Last updated&quot; date at the
                top of this page. For material changes, we will make reasonable
                efforts to notify you via email or through the Service.
              </p>
              <p className="mt-3">
                Your continued use of the Service after revised Terms take
                effect constitutes your acceptance of the changes. If you do not
                agree with the revised Terms, you should stop using the Service
                and close your account.
              </p>
            </section>

            <section>
              <h2>16. Contact Information</h2>
              <p className="mt-3">
                If you have questions about these Terms of Service, please
                contact us at:
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
