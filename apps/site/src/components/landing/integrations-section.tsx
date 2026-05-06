import { PlusIcon } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";
import { GoogleMeetIcon } from "@/components/svgs/google-meet-icon";
import { MicrosoftTeamsIcon } from "@/components/svgs/microsoft-teams-icon";
import { ZoomIcon } from "@/components/svgs/zoom-icon";

const integrations = [
  {
    name: "Zoom",
    description:
      "Sync Zoom cloud recordings automatically - no uploads needed.",
    icon: <ZoomIcon className="size-6" />,
    accent: "group-hover:border-blue-500/40",
    dot: "bg-blue-500",
    comingSoon: false,
  },
  {
    name: "Google Meet",
    description:
      "Sync Google Calendar events and import Meet recordings automatically.",
    icon: <GoogleMeetIcon className="size-6" />,
    accent: "group-hover:border-green-500/40",
    dot: "bg-green-500",
    comingSoon: false,
  },
  {
    name: "Microsoft Teams",
    description: "Pull Teams meeting recordings directly via Microsoft Graph.",
    icon: <MicrosoftTeamsIcon className="size-6" />,
    accent: "group-hover:border-indigo-500/40",
    dot: "bg-indigo-500",
    comingSoon: false,
  },
];

export function IntegrationsSection() {
  return (
    <section className="pb-20" id="integrations">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-medium text-primary text-xs uppercase tracking-wider">
            Integrations
          </span>
          <h2 className="mt-3 font-bold text-3xl tracking-tight sm:text-4xl">
            Works with your favorite meeting tools
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect Zoom or Google Meet for automatic recording import.
            Microsoft Teams integration available for manual import.
          </p>
        </FadeIn>

        <Stagger
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.1}
        >
          {integrations.map((integration) => (
            <StaggerItem key={integration.name}>
              <div
                className={`group relative flex h-full flex-col rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5 ${integration.accent}`}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                    {integration.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 rounded-full ${integration.comingSoon ? "bg-muted-foreground/40" : integration.dot}`}
                    />
                    <span className="font-medium text-muted-foreground text-xs">
                      {integration.comingSoon ? "Coming soon" : "Available"}
                    </span>
                  </div>
                </div>
                <h3 className="mb-1.5 font-semibold">{integration.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {integration.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn className="mt-8 flex justify-center" delay={0.4}>
          <div className="flex items-center gap-2.5 rounded-full border border-dashed px-5 py-2.5 text-muted-foreground text-sm">
            <PlusIcon className="size-4" />
            More integrations coming soon
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
