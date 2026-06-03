import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntegrationProviderContainer } from "@/components/integrations/container";
import { server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";

type Provider = "google" | "zoom";

const PROVIDER_NAMES: Record<Provider, string> = {
  google: "Google Meet",
  zoom: "Zoom",
};

function isProvider(value: string): value is Provider {
  return value === "google" || value === "zoom";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provider: string }>;
}): Promise<Metadata> {
  const { provider } = await params;

  return {
    title: isProvider(provider) ? PROVIDER_NAMES[provider] : "Integrations",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider } = await params;

  if (!isProvider(provider)) {
    return notFound();
  }

  const integrations = await requireAuth(() => server.integration.list());

  return (
    <IntegrationProviderContainer
      initialIntegrations={integrations}
      provider={provider}
    />
  );
}
