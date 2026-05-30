import { CheckIcon, MailIcon } from "lucide-react";
import type { Metadata } from "next";
import { Stagger, StaggerItem } from "@/components/common/motion";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { buttonVariants } from "@/components/ui/button";

const CONTACT_DESCRIPTION =
  "Contact imeetly for enterprise AI meeting notes, Microsoft Teams admin setup, custom meeting limits, SSO discussions, support requirements, volume discounts, and onboarding.";

export const metadata: Metadata = {
  title: "Contact Sales and Support",
  description: CONTACT_DESCRIPTION,
  openGraph: {
    title: "Contact imeetly",
    description: CONTACT_DESCRIPTION,
    url: "https://imeetly.app/contact",
  },
  alternates: { canonical: "https://imeetly.app/contact" },
};

const ENTERPRISE_FEATURES = [
  "Unlimited meetings per month",
  "Microsoft Teams enterprise admin setup",
  "Data deletion on request",
  "Support requirements review",
  "Volume discounts",
  "Custom integrations on request",
  "Onboarding assistance",
];

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Enterprise plans, MS Teams setup, SSO discussions, or anything else. Reach out and we'll review the best setup for your team."
          eyebrow="Contact"
          title="Let's talk"
        />
        <div className="mx-auto max-w-4xl px-6 py-20">
          <Stagger className="grid gap-8 md:grid-cols-2" staggerDelay={0.12}>
            <StaggerItem className="h-full">
              <div className="h-full rounded-2xl border border-border/50 p-8">
                <h2 className="font-semibold text-xl">Enterprise plan</h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  Built for organizations that need more than our standard tiers
                  offer.
                </p>
                <ul className="mt-6 space-y-3">
                  {ENTERPRISE_FEATURES.map((feature) => (
                    <li
                      className="flex items-start gap-2 text-sm"
                      key={feature}
                    >
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>

            <StaggerItem className="h-full">
              <div className="flex h-full flex-col gap-6">
                <div className="rounded-2xl border border-border/50 p-8">
                  <h2 className="font-semibold text-xl">Get in touch</h2>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Send us an email and tell us about your team size, use case,
                    and any requirements. We&apos;ll put together a plan that
                    fits.
                  </p>
                  <a
                    className={buttonVariants({
                      variant: "default",
                      className: "mt-6 w-full gap-2",
                    })}
                    href="mailto:support@imeetly.app?subject=Enterprise%20plan%20inquiry"
                  >
                    <MailIcon className="size-4" />
                    support@imeetly.app
                  </a>
                </div>

                <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
                  <p className="font-medium text-sm">
                    Using Microsoft Teams with an enterprise account?
                  </p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Enterprise Azure AD tenants require an IT admin to approve
                    imeetly before users can connect. We&apos;ll walk your admin
                    through the approval process.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
                  <p className="font-medium text-sm">Response time</p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    We respond to all enterprise inquiries within one business
                    day.
                  </p>
                </div>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
