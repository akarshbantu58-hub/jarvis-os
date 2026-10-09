export type ApiKeys = {
  openai: string;
  elevenlabs: string;
};

const STORAGE_KEY = "jarvis.apiKeys";

export const emptyKeys: ApiKeys = { openai: "", elevenlabs: "" };

export function loadApiKeys(): ApiKeys {
  if (typeof window === "undefined") return emptyKeys;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyKeys;
    return { ...emptyKeys, ...(JSON.parse(raw) as Partial<ApiKeys>) };
  } catch {
    return emptyKeys;
  }
}

export function saveApiKeys(keys: ApiKeys) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

/** Headers that forward the user's own keys to our server routes (never persisted server-side). */
export function keyHeaders(): Record<string, string> {
  const k = loadApiKeys();
  const h: Record<string, string> = {};
  if (k.openai.trim()) h["x-openai-key"] = k.openai.trim();
  if (k.elevenlabs.trim()) h["x-elevenlabs-key"] = k.elevenlabs.trim();
  return h;
}
