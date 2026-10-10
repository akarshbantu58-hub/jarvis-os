export type AiProviderId = "gemini" | "openai-compatible" | "local";
export type AiProviderConfig = { id: AiProviderId; endpoint?: string; model: string; apiKey?: string };
export class AiProviderManager {
  private providers = new Map<AiProviderId, AiProviderConfig>();
  configure(config: AiProviderConfig): void { this.providers.set(config.id, config); }
  get(id: AiProviderId): AiProviderConfig | undefined { return this.providers.get(id); }
  list(): AiProviderConfig[] { return [...this.providers.values()]; }
  /** Keys are kept in memory by this manager; do not log or commit them. */
  clearSecrets(): void {
    for (const [id, config] of this.providers) this.providers.set(id, { ...config, apiKey: undefined });
  }
}
export const aiProviderManager = new AiProviderManager();
