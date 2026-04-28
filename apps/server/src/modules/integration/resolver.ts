import { GoogleIntegrationProvider } from "./providers/google";
import { MicrosoftIntegrationProvider } from "./providers/microsoft";
import { ZoomIntegrationProvider } from "./providers/zoom";
import type {
  IMeetingIntegrationProvider,
  IntegrationProviderType,
} from "./types";

const providers = new Map<IntegrationProviderType, IMeetingIntegrationProvider>(
  [
    ["google", new GoogleIntegrationProvider()],
    ["zoom", new ZoomIntegrationProvider()],
    ["microsoft", new MicrosoftIntegrationProvider()],
  ],
);

export function getProvider(
  type: IntegrationProviderType,
): IMeetingIntegrationProvider {
  const provider = providers.get(type);
  if (!provider) throw new Error(`Unknown integration provider: ${type}`);
  return provider;
}
