import type { ProtocolCheckResult, ProtocolDiscovery } from "../types.js";

const DISCOVERY_PATH = "/.well-known/semanticlayer.json";
const DISCOVERY_TIMEOUT_MS = 5_000;

export class ProtocolChecker {
  async check(url: string): Promise<ProtocolCheckResult> {
    const start = Date.now();

    try {
      const origin = new URL(url).origin;
      const discoveryUrl = `${origin}${DISCOVERY_PATH}`;

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        DISCOVERY_TIMEOUT_MS,
      );

      const response = await fetch(discoveryUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "SemanticLayer/0.1.0",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return { supported: false, responseTimeMs: Date.now() - start };
      }

      const body = (await response.json()) as Record<string, unknown>;

      if (!body.version || !body.endpoints) {
        return { supported: false, responseTimeMs: Date.now() - start };
      }

      const discovery = body as unknown as ProtocolDiscovery;

      return {
        supported: true,
        discovery,
        responseTimeMs: Date.now() - start,
      };
    } catch {
      return { supported: false, responseTimeMs: Date.now() - start };
    }
  }
}
