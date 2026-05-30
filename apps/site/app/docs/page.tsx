import {
  BookOpenCheckIcon,
  CableIcon,
  ExternalLinkIcon,
  Link2OffIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { buttonVariants } from "@/components/ui/button";

const DOCS_DESCRIPTION =
  "Learn how to add, use, troubleshoot, and remove imeetly for Zoom, Google Meet, and Microsoft Teams.";

export const metadata: Metadata = {
  title: "imeetly Documentation",
  description: DOCS_DESCRIPTION,
  openGraph: {
    title: "imeetly Documentation",
    description: DOCS_DESCRIPTION,
    url: "https://imeetly.app/docs",
  },
  alternates: { canonical: "https://imeetly.app/docs" },
};

const PREREQUISITES = [
  "An active imeetly account",
  "Access to at least one supported meeting platform: Zoom, Google Meet, or Microsoft Teams",
  "Permission to authorize apps or integrations for the meeting platform you want to connect",
  "A supported browser such as Chrome, Edge, Safari, or Firefox",
];

const ADDING_APP_STEPS = [
  "Go to the imeetly listing in the Zoom App Marketplace.",
  "Click Add.",
  "Sign in to your Zoom account if prompted.",
  "Review the permissions requested by imeetly.",
  "Click Allow to authorize the app.",
  "You will be redirected to imeetly.",
  "Sign in to your imeetly account or create one if needed.",
  "Confirm that Zoom is connected in your imeetly account settings or integrations page.",
];

const FEATURE_SECTIONS = [
  {
    title: "Connect a Meeting Platform",
    useCase:
      "Connect Zoom, Google Meet, or Microsoft Teams so imeetly can support meeting-related workflows for that platform.",
    prerequisites: [
      "Active imeetly account",
      "Access to the meeting platform you want to connect",
      "Permission to authorize the relevant integration",
    ],
    steps: [
      "Sign in to imeetly.",
      "Open your account settings or integrations page.",
      "Select the meeting platform you want to connect: Zoom, Google Meet, or Microsoft Teams.",
      "Follow the authorization flow.",
      "Review the requested permissions.",
      "Confirm that the integration status is active.",
    ],
  },
  {
    title: "Use imeetly for Meeting Memory",
    useCase:
      "Use imeetly to help preserve important meeting context, including summaries, decisions, and follow-ups, so users can review what happened after a meeting.",
    prerequisites: [
      "Active imeetly account",
      "A connected supported meeting platform",
      "Meeting access available to the connected account",
      "Any required imeetly permissions or subscription access",
    ],
    steps: [
      "Make sure your meeting platform is connected.",
      "Open imeetly.",
      "Navigate to your meetings or meeting memory area.",
      "Select the relevant meeting.",
      "Review the available meeting summary, notes, decisions, or follow-ups, where available.",
    ],
  },
  {
    title: "Review Meeting Information",
    useCase:
      "After a meeting, use imeetly to review what happened and find relevant context across supported platforms.",
    prerequisites: [
      "The meeting is associated with your connected account",
      "imeetly has access to the required meeting information",
      "The relevant meeting memory feature is available for your account",
    ],
    steps: [
      "Sign in to imeetly.",
      "Open the relevant meeting.",
      "Review the available meeting memory, summary, or follow-up items.",
      "Share or copy relevant information according to your team workflow, if supported.",
    ],
  },
];

const TROUBLESHOOTING_ITEMS = [
  {
    issue: "I cannot add imeetly from the Zoom App Marketplace",
    steps: [
      "Confirm you are signed in to the correct Zoom account",
      "Confirm your Zoom account allows app installation",
      "Ask your Zoom admin to approve the app if required",
      "Try again in a private browser window",
      "Contact support@imeetly.app",
    ],
  },
  {
    issue: "Zoom shows an authorization error",
    steps: [
      "Sign out of Zoom and sign back in",
      "Confirm you are using the correct Zoom account",
      "Retry the authorization flow from imeetly",
      "Contact support if the issue continues",
    ],
  },
  {
    issue: "I cannot connect Google Meet or Microsoft Teams",
    steps: [
      "Confirm you are signed in to the correct Google or Microsoft account",
      "Confirm your organization allows third-party app integrations",
      "Ask your workspace or tenant administrator to approve the integration if required",
      "Try reconnecting from imeetly account settings",
      "Contact support@imeetly.app",
    ],
  },
  {
    issue: "I do not see my meeting in imeetly",
    steps: [
      "Confirm the correct meeting platform is connected",
      "Confirm the meeting belongs to the connected account",
      "Confirm the meeting has ended, if applicable",
      "Refresh imeetly",
      "Contact support with the meeting date, time, platform, and account email",
    ],
  },
  {
    issue: "I need admin approval",
    steps: [
      "Contact your Zoom, Google Workspace, or Microsoft tenant administrator",
      "Ask them to review and approve the imeetly integration",
      "After approval, return to imeetly and try connecting again",
    ],
  },
];

const REMOVAL_STEPS = [
  "Sign in to your Zoom account.",
  "Go to the Zoom App Marketplace.",
  "Click Manage.",
  "Click Added Apps.",
  "Search for imeetly or find it in your added apps.",
  "Click Remove.",
  "Select a reason for removal if prompted.",
  "Confirm removal.",
];

const REMOVAL_IMPACTS = [
  "imeetly will no longer be authorized to access your Zoom account through the removed integration.",
  "Zoom-related functionality in imeetly may stop working.",
  "New Zoom meeting data will no longer be available to imeetly through that authorization.",
  "Existing imeetly account data may remain in imeetly unless you request deletion or delete it through available account controls.",
  'You can request deletion of your imeetly data by emailing support@imeetly.app with the subject line "Data Deletion Request".',
];

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Learn how to connect imeetly to Zoom, Google Meet, and Microsoft Teams, use imeetly with supported meeting platforms, troubleshoot common issues, and manage or remove integrations when needed."
          eyebrow="Documentation"
          title="imeetly Documentation"
        />

        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="flex flex-wrap gap-3">
            <a
              className={buttonVariants({ className: "gap-2" })}
              href="#adding-the-app"
            >
              <ShieldCheckIcon className="size-4" />
              View Zoom Setup Steps
            </a>
            <a
              className={buttonVariants({
                variant: "secondary",
                className: "gap-2",
              })}
              href="/support"
            >
              <ExternalLinkIcon className="size-4" />
              Contact Support
            </a>
          </div>

          <div className="mt-10 space-y-8">
            <DocsSection
              icon={<BookOpenCheckIcon className="mt-1 size-5 text-primary" />}
              title="Overview"
            >
              <p className="text-sm leading-6">
                imeetly helps teams keep track of what happened in meetings by
                creating a memory layer for meeting conversations, summaries,
                decisions, and follow-ups.
              </p>
              <p className="mt-4 text-sm leading-6">
                imeetly supports meetings from Zoom, Google Meet, and Microsoft
                Teams. This documentation includes Zoom-specific installation
                and removal steps for Zoom Marketplace users, along with general
                guidance for using imeetly across supported meeting platforms.
              </p>
            </DocsSection>

            <DocsSection
              icon={<ShieldCheckIcon className="mt-1 size-5 text-primary" />}
              title="Prerequisites"
            >
              <p className="text-sm leading-6">
                Before using imeetly, make sure you have:
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6">
                {PREREQUISITES.map((item) => (
                  <BulletItem key={item}>{item}</BulletItem>
                ))}
              </ul>
              <div className="mt-6">
                <h3 className="font-semibold text-base">For Zoom users</h3>
                <ul className="mt-3 space-y-3 text-sm leading-6">
                  <BulletItem>You need an active Zoom account</BulletItem>
                  <BulletItem>
                    You need access to the Zoom App Marketplace
                  </BulletItem>
                  <BulletItem>
                    If your Zoom administrator restricts app installation, you
                    may need admin approval before adding imeetly
                  </BulletItem>
                </ul>
              </div>
            </DocsSection>

            <DocsSection
              icon={<CableIcon className="mt-1 size-5 text-primary" />}
              id="adding-the-app"
              title="Adding the App"
            >
              <p className="text-sm leading-6">
                Follow these steps to add imeetly to your Zoom account:
              </p>
              <StepList className="mt-4" steps={ADDING_APP_STEPS} />
              <p className="mt-6 text-sm leading-6">
                If your Zoom administrator requires approval for Marketplace
                apps, request approval from your Zoom admin. After approval,
                return to the Zoom App Marketplace and add imeetly again.
              </p>
              <p className="mt-6 text-muted-foreground text-sm leading-6">
                If you cannot add the app, see the Troubleshooting section on
                this page or contact support at{" "}
                <a
                  className="font-medium text-foreground underline underline-offset-4"
                  href="mailto:support@imeetly.app"
                >
                  support@imeetly.app
                </a>
                .
              </p>
            </DocsSection>

            <DocsSection
              icon={<BookOpenCheckIcon className="mt-1 size-5 text-primary" />}
              title="Using imeetly with Supported Meeting Platforms"
            >
              <p className="mb-6 text-sm leading-6">
                imeetly works with Zoom, Google Meet, and Microsoft Teams.
                Availability of specific meeting memory features may depend on
                the meeting platform, your account settings, permissions, and
                subscription access.
              </p>
              <div className="space-y-6">
                {FEATURE_SECTIONS.map((feature) => (
                  <article
                    className="rounded-xl border bg-muted/20 p-6"
                    key={feature.title}
                  >
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6">
                      <span className="font-medium">Use case:</span>{" "}
                      {feature.useCase}
                    </p>
                    <div className="mt-4">
                      <p className="font-medium text-sm">Prerequisites</p>
                      <ul className="mt-3 space-y-2 text-sm leading-6">
                        {feature.prerequisites.map((item) => (
                          <BulletItem key={item}>{item}</BulletItem>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <p className="font-medium text-sm">Steps</p>
                      <StepList className="mt-3" steps={feature.steps} />
                    </div>
                  </article>
                ))}
              </div>
              <p className="mt-6 text-muted-foreground text-sm leading-6">
                Feature availability may vary depending on your account
                settings, permissions, subscription access, and whether a
                specific workflow is enabled.
              </p>
            </DocsSection>

            <DocsSection
              icon={<WrenchIcon className="mt-1 size-5 text-primary" />}
              title="Troubleshooting"
            >
              <p className="mb-6 text-sm leading-6">
                Use the following steps to resolve common setup and usage
                issues. If the issue continues, contact support@imeetly.app.
              </p>
              <div className="space-y-4">
                {TROUBLESHOOTING_ITEMS.map((item) => (
                  <article
                    className="rounded-xl border bg-muted/20 p-6"
                    key={item.issue}
                  >
                    <h3 className="font-semibold text-lg">{item.issue}</h3>
                    <StepList className="mt-4" steps={item.steps} />
                  </article>
                ))}
              </div>
            </DocsSection>

            <DocsSection
              icon={<Link2OffIcon className="mt-1 size-5 text-primary" />}
              id="removing-the-app"
              title="Removing the App from Zoom"
            >
              <p className="text-sm leading-6">
                Follow these steps to remove imeetly from your Zoom account:
              </p>
              <StepList className="mt-4" steps={REMOVAL_STEPS} />
            </DocsSection>

            <DocsSection
              icon={<Link2OffIcon className="mt-1 size-5 text-primary" />}
              title="What Happens When You Remove imeetly"
            >
              <ul className="space-y-3 text-sm leading-6">
                {REMOVAL_IMPACTS.map((item) => (
                  <BulletItem key={item}>{item}</BulletItem>
                ))}
              </ul>
            </DocsSection>

            <DocsSection
              icon={<ShieldCheckIcon className="mt-1 size-5 text-primary" />}
              title="Data Removal After De-authorization"
            >
              <p className="text-sm leading-6">
                After de-authorization, imeetly will process the removal
                according to its app authorization and data retention practices.
                If you want your imeetly account data deleted, contact{" "}
                <a
                  className="font-medium text-foreground underline underline-offset-4"
                  href="mailto:support@imeetly.app"
                >
                  support@imeetly.app
                </a>
                .
              </p>
              <p className="mt-4 text-sm leading-6">
                We may need to verify account ownership before completing
                deletion.
              </p>
              <p className="mt-4 text-muted-foreground text-sm leading-6">
                If Zoom sends imeetly a deauthorization notification, imeetly
                will use that event to update the integration status and stop
                authorized Zoom access for that user.
              </p>
            </DocsSection>

            <DocsSection
              icon={<RotateCcwIcon className="mt-1 size-5 text-primary" />}
              title="Reconnecting the App"
            >
              <p className="text-sm leading-6">
                If you removed imeetly by mistake, you can reconnect it by
                returning to the Zoom App Marketplace and adding imeetly again,
                or by reconnecting Zoom from your imeetly account settings if
                that option is available.
              </p>
              <p className="mt-4 text-muted-foreground text-sm leading-6">
                For Google Meet or Microsoft Teams, reconnect the relevant
                integration from your imeetly account settings or integrations
                page, if available.
              </p>
            </DocsSection>

            <DocsSection
              icon={<ShieldCheckIcon className="mt-1 size-5 text-primary" />}
              title="Contact Support"
            >
              <p className="text-sm leading-6">
                Need help? Visit the imeetly support page or email
                support@imeetly.app.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  className={buttonVariants({
                    variant: "default",
                    className: "gap-2",
                  })}
                  href="/support"
                >
                  <ShieldCheckIcon className="size-4" />
                  Support Page
                </a>
                <a
                  className={buttonVariants({
                    variant: "secondary",
                    className: "gap-2",
                  })}
                  href="mailto:support@imeetly.app"
                >
                  <ExternalLinkIcon className="size-4" />
                  Email Support
                </a>
              </div>
            </DocsSection>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

function DocsSection({
  id,
  title,
  icon,
  children,
}: {
  id?: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border p-8" id={id}>
      <div className="flex items-start gap-3">
        {icon}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-2xl">{title}</h2>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function StepList({
  steps,
  className,
}: {
  steps: string[];
  className?: string;
}) {
  return (
    <ol
      className={["space-y-4 text-sm leading-6", className]
        .filter(Boolean)
        .join(" ")}
    >
      {steps.map((step, index) => (
        <li className="flex gap-4" key={index}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 size-1.5 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}
