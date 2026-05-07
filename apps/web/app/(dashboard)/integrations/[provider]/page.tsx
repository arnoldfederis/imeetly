import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntegrationProviderContainer } from "@/components/integrations/container";

type Provider = "google" | "zoom" | "microsoft";

const PROVIDER_NAMES: Record<Provider, string> = {
  google: "Google Meet",
  zoom: "Zoom",
  microsoft: "Microsoft Teams",
};

function isProvider(value: string): value is Provider {
  return value === "google" || value === "zoom" || value === "microsoft";
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

  return <IntegrationProviderContainer provider={provider} />;
}
