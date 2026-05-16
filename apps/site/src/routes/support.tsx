import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpenIcon,
  CircleHelpIcon,
  Clock3Icon,
  ExternalLinkIcon,
  LifeBuoyIcon,
  MailIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbJsonLd, seo, webPageJsonLd } from "@/lib/seo";

const SUPPORT_DESCRIPTION =
  "Get help with imeetly, including support hours, response times, documentation, troubleshooting, and contact options for Zoom, Google Meet, and Microsoft Teams.";

const SUPPORT_OPTIONS = [
  {
    title: "Support email",
    value: "support@imeetly.app",
    href: "mailto:support@imeetly.app",
  },
  {
    title: "Create a support request",
    value: "Email us with your issue details",
    href: "mailto:support@imeetly.app?subject=imeetly%20Support%20Request",
  },
  {
    title: "Documentation",
    value: "Read the imeetly documentation",
    href: "/docs",
  },
  {
    title: "Knowledge base",
    value: "Browse the public help documentation",
    href: "/docs",
  },
  {
    title: "WhatsApp",
    value: "+639172437180",
    href: "https://wa.me/639172437180",
  },
  {
    title: "LinkedIn",
    value: "linkedin.com/in/arnoldfederis",
    href: "https://linkedin.com/in/arnoldfederis",
  },
  {
    title: "X (Twitter)",
    value: "x.com/arnoldfederis",
    href: "https://x.com/arnoldfederis",
  },
];

const SUPPORT_AREAS = [
  "Installing or authorizing imeetly for Zoom",
  "Connecting Google Meet or Microsoft Teams",
  "Understanding how imeetly works with supported meeting platforms",
  "Meeting summary or meeting memory issues",
  "Account access issues",
  "Removing the Zoom app integration",
  "Disconnecting Google Meet or Microsoft Teams",
  "Data deletion and privacy requests",
  "Billing or subscription questions, if applicable",
  "Bug reports and product feedback",
];

const BEFORE_CONTACTING_SUPPORT = [
  "Confirm you are signed in to the correct imeetly account",
  "Confirm you are signed in to the correct Zoom, Google, or Microsoft account",
  "Confirm the correct meeting platform is connected",
  "Try reconnecting the integration from your imeetly account settings",
  "Review the documentation at /docs",
  "Check whether the meeting is available in your meeting platform account, if applicable",
];

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    ...seo({
      title: "imeetly Support",
      description: SUPPORT_DESCRIPTION,
      path: "/support",
      keywords: [
        "imeetly support",
        "Zoom app support",
        "Zoom marketplace support",
        "Google Meet support",
        "Microsoft Teams support",
        "imeetly documentation",
      ],
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          webPageJsonLd({
            path: "/support",
            name: "imeetly Support",
            description: SUPPORT_DESCRIPTION,
            type: "ContactPage",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ name: "Support", path: "/support" }]),
        ),
      },
    ],
  }),
});

function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Need help with imeetly for Zoom, Google Meet, or Microsoft Teams? Our support team can help with installation, authorization, meeting summaries, account access, data removal, and troubleshooting."
          eyebrow="Support"
          title="imeetly Support"
        />

        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="flex flex-wrap gap-3 pb-8">
            <a
              className={buttonVariants({
                className: "gap-2",
              })}
              href="mailto:support@imeetly.app"
            >
              <MailIcon className="size-4" />
              Email Support
            </a>
            <a
              className={buttonVariants({
                variant: "secondary",
                className: "gap-2",
              })}
              href="/docs"
            >
              <BookOpenIcon className="size-4" />
              Read Documentation
            </a>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl border bg-card p-8 shadow-sm">
              <div className="flex items-start gap-3">
                <LifeBuoyIcon className="mt-1 size-5 text-primary" />
                <div>
                  <h2 className="font-semibold text-2xl">Contact Support</h2>
                  <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-6">
                    For the fastest help, email us at{" "}
                    <a
                      className="font-medium text-foreground underline underline-offset-4"
                      href="mailto:support@imeetly.app"
                    >
                      support@imeetly.app
                    </a>{" "}
                    or create a support request using the link below. Please
                    include your imeetly account email, your meeting platform
                    account email if different, the platform you are using, a
                    short description of the issue, screenshots if helpful, and
                    the steps you already tried.
                  </p>
                </div>
              </div>

              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                {SUPPORT_OPTIONS.map((item) => (
                  <div
                    className="rounded-xl border bg-muted/30 p-4"
                    key={item.title}
                  >
                    <dt className="font-medium text-sm">{item.title}</dt>
                    <dd className="mt-2 text-muted-foreground text-sm leading-6">
                      <a
                        className="inline-flex items-center gap-1 text-foreground underline underline-offset-4"
                        href={item.href}
                      >
                        {item.value}
                        {item.href.startsWith("mailto:") ? null : (
                          <ExternalLinkIcon className="size-3.5" />
                        )}
                      </a>
                    </dd>
                  </div>
                ))}
                <div className="rounded-xl border bg-muted/30 p-4">
                  <dt className="font-medium text-sm">Live chat</dt>
                  <dd className="mt-2 text-muted-foreground text-sm leading-6">
                    Not currently available
                  </dd>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <dt className="font-medium text-sm">Phone support</dt>
                  <dd className="mt-2 text-muted-foreground text-sm leading-6">
                    Available via WhatsApp at{" "}
                    <a
                      className="text-foreground underline underline-offset-4"
                      href="https://wa.me/639172437180"
                    >
                      +639172437180
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  className={buttonVariants({
                    className: "gap-2",
                  })}
                  href="mailto:support@imeetly.app"
                >
                  <MailIcon className="size-4" />
                  Email Support
                </a>
                <a
                  className={buttonVariants({
                    variant: "secondary",
                    className: "gap-2",
                  })}
                  href="mailto:support@imeetly.app?subject=imeetly%20Support%20Request"
                >
                  <CircleHelpIcon className="size-4" />
                  Create Support Request
                </a>
                <a
                  className={buttonVariants({
                    variant: "secondary",
                    className: "gap-2",
                  })}
                  href="/docs"
                >
                  <BookOpenIcon className="size-4" />
                  Read Documentation
                </a>
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <Clock3Icon className="mt-1 size-5 text-primary" />
                  <div>
                    <h2 className="font-semibold text-lg">Support Hours</h2>
                    <p className="mt-3 text-sm leading-6">
                      Monday to Friday, 9:00 AM to 6:00 PM Philippine Time,
                      excluding Philippine public holidays.
                    </p>
                    <p className="mt-3 text-muted-foreground text-sm leading-6">
                      You may contact us outside support hours, and we will
                      respond during the next business day.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="mt-1 size-5 text-primary" />
                  <div>
                    <h2 className="font-semibold text-lg">
                      First Response SLA
                    </h2>
                    <p className="mt-3 text-sm leading-6">
                      We aim to provide a first response within 1 business day
                      for standard support requests.
                    </p>
                    <p className="mt-3 text-muted-foreground text-sm leading-6">
                      For urgent account access, authorization, or data removal
                      issues, we aim to respond as soon as possible during
                      business hours.
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-8 shadow-sm">
              <h2 className="font-semibold text-2xl">What We Can Help With</h2>
              <ul className="mt-6 space-y-3 text-sm leading-6">
                {SUPPORT_AREAS.map((item) => (
                  <li className="flex gap-3" key={item}>
                    <span className="mt-2 size-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border bg-card p-8 shadow-sm">
              <h2 className="font-semibold text-2xl">
                Before Contacting Support
              </h2>
              <ol className="mt-6 space-y-4 text-sm leading-6">
                {BEFORE_CONTACTING_SUPPORT.map((item, index) => (
                  <li className="flex gap-4" key={item}>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section className="mt-10 rounded-2xl border bg-card p-8 shadow-sm">
            <h2 className="font-semibold text-2xl">
              Data and Privacy Requests
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6">
              For data deletion or privacy-related requests, email{" "}
              <a
                className="font-medium text-foreground underline underline-offset-4"
                href="mailto:support@imeetly.app?subject=Data%20Request"
              >
                support@imeetly.app
              </a>{" "}
              with the subject line &quot;Data Request&quot;. We may need to
              verify account ownership before processing the request.
            </p>
            <p className="mt-4 text-muted-foreground text-sm leading-6">
              You can also review the public app documentation at{" "}
              <a
                className="font-medium text-foreground underline underline-offset-4"
                href="/docs"
              >
                /docs
              </a>{" "}
              or read our{" "}
              <a
                className="font-medium text-foreground underline underline-offset-4"
                href="/privacy"
              >
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <section className="mt-10 rounded-2xl border bg-card p-8 shadow-sm">
            <h2 className="font-semibold text-2xl">
              Documentation and Troubleshooting
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6">
              For setup instructions, usage guidance, troubleshooting steps, and
              app removal instructions, visit the imeetly documentation.
            </p>
            <a
              className={buttonVariants({
                variant: "secondary",
                className: "mt-6 gap-2",
              })}
              href="/docs"
            >
              <BookOpenIcon className="size-4" />
              Read the Documentation
            </a>
          </section>

          <section className="mt-10 rounded-2xl border bg-card p-8 shadow-sm">
            <h2 className="font-semibold text-2xl">Support Summary</h2>
            <div className="mt-6 overflow-hidden rounded-xl border">
              <table className="w-full text-left text-sm">
                <tbody className="[&_tr:not(:last-child)]:border-b">
                  <tr className="align-top">
                    <th className="w-44 bg-muted/30 px-4 py-3 font-medium">
                      Support email
                    </th>
                    <td className="px-4 py-3">
                      <a
                        className="underline underline-offset-4"
                        href="mailto:support@imeetly.app"
                      >
                        support@imeetly.app
                      </a>
                    </td>
                  </tr>
                  <tr className="align-top">
                    <th className="bg-muted/30 px-4 py-3 font-medium">
                      Support request
                    </th>
                    <td className="px-4 py-3">
                      <a
                        className="break-all underline underline-offset-4"
                        href="mailto:support@imeetly.app?subject=imeetly%20Support%20Request"
                      >
                        Support request
                      </a>
                    </td>
                  </tr>
                  <tr className="align-top">
                    <th className="bg-muted/30 px-4 py-3 font-medium">
                      Support hours
                    </th>
                    <td className="px-4 py-3">
                      Monday to Friday, 9:00 AM to 6:00 PM Philippine Time,
                      excluding Philippine public holidays
                    </td>
                  </tr>
                  <tr className="align-top">
                    <th className="bg-muted/30 px-4 py-3 font-medium">
                      First response SLA
                    </th>
                    <td className="px-4 py-3">
                      Within 1 business day for standard support requests
                    </td>
                  </tr>
                  <tr className="align-top">
                    <th className="bg-muted/30 px-4 py-3 font-medium">
                      Live chat
                    </th>
                    <td className="px-4 py-3">Not currently available</td>
                  </tr>
                  <tr className="align-top">
                    <th className="bg-muted/30 px-4 py-3 font-medium">
                      Phone support
                    </th>
                    <td className="px-4 py-3">
                      <a
                        className="underline underline-offset-4"
                        href="https://wa.me/639172437180"
                      >
                        WhatsApp: +639172437180
                      </a>
                    </td>
                  </tr>
                  <tr className="align-top">
                    <th className="bg-muted/30 px-4 py-3 font-medium">
                      LinkedIn
                    </th>
                    <td className="px-4 py-3">
                      <a
                        className="underline underline-offset-4"
                        href="https://linkedin.com/in/arnoldfederis"
                      >
                        https://linkedin.com/in/arnoldfederis
                      </a>
                    </td>
                  </tr>
                  <tr className="align-top">
                    <th className="bg-muted/30 px-4 py-3 font-medium">
                      X (Twitter)
                    </th>
                    <td className="px-4 py-3">
                      <a
                        className="underline underline-offset-4"
                        href="https://x.com/arnoldfederis"
                      >
                        https://x.com/arnoldfederis
                      </a>
                    </td>
                  </tr>
                  <tr className="align-top">
                    <th className="bg-muted/30 px-4 py-3 font-medium">
                      Knowledge base
                    </th>
                    <td className="px-4 py-3">
                      <a className="underline underline-offset-4" href="/docs">
                        https://imeetly.app/docs
                      </a>
                    </td>
                  </tr>
                  <tr className="align-top">
                    <th className="bg-muted/30 px-4 py-3 font-medium">
                      Documentation
                    </th>
                    <td className="px-4 py-3">
                      <a className="underline underline-offset-4" href="/docs">
                        https://imeetly.app/docs
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
