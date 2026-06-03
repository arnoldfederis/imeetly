import { CheckIcon, MailIcon } from "lucide-react";
import type { Metadata } from "next";
import { Stagger, StaggerItem } from "@/components/common/motion";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { buttonVariants } from "@/components/ui/button";

const CONTACT_DESCRIPTION =
  "Contact imeetly for enterprise plans, onboarding guidance, support requirements, and general support.";

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

const SUPPORT_TOPICS = [
  "Enterprise plans and onboarding help",
  "Custom support requirements",
  "Meeting import and upload troubleshooting",
  "Account, billing, and subscription support",
  "Data deletion requests",
  "General product feedback",
  "Integration help",
];

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Need help with an enterprise setup, billing, or anything else? Reach out and we'll point you in the right direction."
          eyebrow="Contact"
          title="Let's talk"
        />
        <div className="mx-auto max-w-4xl px-6 py-20">
          <Stagger className="grid gap-8 md:grid-cols-2" staggerDelay={0.12}>
            <StaggerItem className="h-full">
              <div className="h-full rounded-2xl border border-border/50 p-8">
                <h2 className="font-semibold text-xl">Enterprise support</h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  Reach out if you need help planning an enterprise rollout or
                  getting imeetly working smoothly.
                </p>
                <ul className="mt-6 space-y-3">
                  {SUPPORT_TOPICS.map((feature) => (
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
                    Send us an email with your use case, support needs, or
                    question and we&apos;ll reply with the next step.
                  </p>
                  <a
                    className={buttonVariants({
                      variant: "default",
                      className: "mt-6 w-full gap-2",
                    })}
                    href="mailto:support@imeetly.app?subject=imeetly%20enterprise%20inquiry"
                  >
                    <MailIcon className="size-4" />
                    support@imeetly.app
                  </a>
                </div>
                <div className="h-full rounded-2xl bg-muted/30 p-6">
                  <p className="font-medium text-sm">Response time</p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    We respond to enterprise and support inquiries within one
                    business day.
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
