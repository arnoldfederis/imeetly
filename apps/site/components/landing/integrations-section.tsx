"use client";

import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";
import { GoogleMeetIcon } from "@/components/svgs/google-meet-icon";
import { ZoomIcon } from "@/components/svgs/zoom-icon";

const integrations = [
  {
    name: "Zoom",
    description:
      "Sync Zoom recordings and import cloud recordings into imeetly. Your meetings and notes in one place.",
    icon: <ZoomIcon className="size-6" />,
    dot: "bg-blue-500",
    comingSoon: false,
  },
  {
    name: "Google Meet",
    description:
      "Sync Google Calendar events and import Meet recordings when they are available. Notes and history organized alongside your schedule.",
    icon: <GoogleMeetIcon className="size-6" />,
    dot: "bg-green-500",
    comingSoon: false,
  },
];

export function IntegrationsSection() {
  return (
    <section className="border-t py-32 sm:py-40" id="integrations">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-widest">
            Integrations
          </p>
          <h2 className="font-bold text-4xl tracking-tight sm:text-5xl">
            Works with the tools your team already uses
          </h2>
          <p className="mt-5 text-muted-foreground text-xl leading-relaxed">
            Connect Zoom or Google Meet. imeetly syncs your meetings and lets
            you import recordings without replacing the tools you already rely
            on.
          </p>
        </FadeIn>
        <Stagger
          className="mx-auto grid max-w-4xl gap-4 border-t sm:grid-cols-2"
          staggerDelay={0.1}
        >
          {integrations.map((integration) => (
            <StaggerItem key={integration.name}>
              <div className="flex h-full flex-col gap-4 border-b pt-8 pb-8">
                <div className="w-fit rounded-xl bg-muted/50 p-2">
                  {integration.icon}
                </div>
                <h3 className="mt-3 font-semibold">{integration.name}</h3>
                <div className="mt-1.5 mb-3 flex items-center gap-2">
                  <span
                    className={`size-1.5 rounded-full ${integration.comingSoon ? "bg-muted-foreground/40" : integration.dot}`}
                  />
                  <span className="text-muted-foreground text-xs">
                    {integration.comingSoon ? "Coming soon" : "Available"}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {integration.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
