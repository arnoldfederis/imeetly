import {
  BriefcaseIcon,
  BuildingIcon,
  RocketIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

const audiences = [
  { label: "Product teams", icon: BuildingIcon },
  { label: "Startups", icon: RocketIcon },
  { label: "Agencies", icon: BriefcaseIcon },
  { label: "Founders", icon: UserIcon },
  { label: "Recruiters", icon: UsersIcon },
];

export function TrustBar() {
  return (
    <section className="border-b bg-muted/30 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-muted-foreground text-sm">
          Built for teams that cannot afford to forget
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {audiences.map((a) => (
            <div
              className="flex items-center gap-2 font-medium text-muted-foreground text-sm"
              key={a.label}
            >
              <a.icon className="size-4" />
              {a.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
