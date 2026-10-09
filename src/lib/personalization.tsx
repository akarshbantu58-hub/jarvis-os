import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import logoAsset from "@/assets/akarsh-logo.png.asset.json";

export type BootStyle = "rings" | "scan" | "particles" | "minimal";

export type Profile = {
  id: string;
  name: string;
  // Branding
  assistantName: string;
  osName: string;
  userName: string;
  welcomeMessage: string;
  greeting: string;
  startupMessage: string;
  avatarUrl: string | null;
  wallpaperUrl: string | null;
  // Theme
  accent: string; // hex
  accent2: string;
  fontFamily: string;
  radius: number; // px
  blur: number; // px
  transparency: number; // 0..1
  particles: boolean;
  // Boot
  bootEnabled: boolean;
  bootStyle: BootStyle;
  bootLogoUrl: string | null;
  bootVideoUrl: string | null;
  bootDurationMs: number;
  bootSoundEnabled: boolean;
  bootSoundUrl: string | null;
  bootColor: string;
};

const DEFAULT_PROFILE: Profile = {
  id: "default",
  name: "Default",
  assistantName: "JARVIS",
  osName: "JARVIS Ultimate",
  userName: "Operator",
  welcomeMessage: "Welcome back",
  greeting: "How can I help you today?",
  startupMessage: "Engaging JARVIS…",
  avatarUrl: null,
  wallpaperUrl: null,
  accent: "#38bdf8",
  accent2: "#a855f7",
  fontFamily: "system",
  radius: 16,
  blur: 24,
  transparency: 0.6,
  particles: true,
  bootEnabled: true,
  bootStyle: "rings",
  bootLogoUrl: logoAsset.url,
  bootVideoUrl: null,
  bootDurationMs: 3200,
  bootSoundEnabled: false,
  bootSoundUrl: null,
  bootColor: "#38bdf8",
};

type State = {
  profiles: Profile[];
  activeId: string;
};

type Ctx = {
  profile: Profile;
  profiles: Profile[];
  activeId: string;
  update: (patch: Partial<Profile>) => void;
  reset: () => void;
  addProfile: (name: string) => void;
  selectProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
  exportProfile: () => string;
  importProfile: (json: string) => void;
  replayBoot: () => void;
  bootKey: number;
};

const PCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "jarvis:personalization:v1";

function loadState(): State {
  if (typeof window === "undefined") return { profiles: [DEFAULT_PROFILE], activeId: "default" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { profiles: [DEFAULT_PROFILE], activeId: "default" };
    const parsed = JSON.parse(raw) as State;
    // merge defaults for forward-compat
    parsed.profiles = parsed.profiles.map((p) => ({ ...DEFAULT_PROFILE, ...p }));
    return parsed;
  } catch {
    return { profiles: [DEFAULT_PROFILE], activeId: "default" };
  }
}

function hexToOklch(hex: string): string {
  // fallback: just return hex; CSS accepts hex for colors
  return hex;
}

function applyTheme(p: Profile) {
  const r = document.documentElement;
  r.style.setProperty("--primary", hexToOklch(p.accent));
  r.style.setProperty("--accent", hexToOklch(p.accent2));
  r.style.setProperty("--ring", p.accent);
  r.style.setProperty("--jarvis", p.accent);
  r.style.setProperty("--jarvis-glow", p.accent + "8c");
  r.style.setProperty("--radius", `${p.radius}px`);
  r.style.setProperty(
    "--gradient-jarvis",
    `linear-gradient(135deg, ${p.accent}, ${p.accent2})`,
  );
  r.style.setProperty("--glass", `oklch(1 0 0 / ${(p.transparency * 0.12).toFixed(3)})`);
  r.style.setProperty("--glass-strong", `oklch(1 0 0 / ${(p.transparency * 0.22).toFixed(3)})`);
  r.style.setProperty("--jarvis-blur", `${p.blur}px`);
  if (p.fontFamily && p.fontFamily !== "system") {
    document.body.style.fontFamily = p.fontFamily;
  } else {
    document.body.style.fontFamily = "";
  }
}

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => loadState());
  const [bootKey, setBootKey] = useState(0);

  const profile = state.profiles.find((p) => p.id === state.activeId) ?? state.profiles[0];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  useEffect(() => {
    applyTheme(profile);
  }, [profile]);

  const update = useCallback((patch: Partial<Profile>) => {
    setState((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === s.activeId ? { ...p, ...patch } : p)),
    }));
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === s.activeId ? { ...DEFAULT_PROFILE, id: p.id, name: p.name } : p)),
    }));
  }, []);

  const addProfile = useCallback((name: string) => {
    setState((s) => {
      const id = `p-${Date.now()}`;
      return { activeId: id, profiles: [...s.profiles, { ...DEFAULT_PROFILE, id, name }] };
    });
  }, []);

  const selectProfile = useCallback((id: string) => {
    setState((s) => ({ ...s, activeId: id }));
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setState((s) => {
      const remaining = s.profiles.filter((p) => p.id !== id);
      const profiles = remaining.length ? remaining : [DEFAULT_PROFILE];
      return { profiles, activeId: profiles[0].id };
    });
  }, []);

  const exportProfile = useCallback(() => JSON.stringify(profile, null, 2), [profile]);

  const importProfile = useCallback((json: string) => {
    try {
      const p = { ...DEFAULT_PROFILE, ...JSON.parse(json), id: `p-${Date.now()}` } as Profile;
      setState((s) => ({ activeId: p.id, profiles: [...s.profiles, p] }));
    } catch {
      /* ignore */
    }
  }, []);

  const replayBoot = useCallback(() => setBootKey((k) => k + 1), []);

  const value = useMemo(
    () => ({
      profile,
      profiles: state.profiles,
      activeId: state.activeId,
      update,
      reset,
      addProfile,
      selectProfile,
      deleteProfile,
      exportProfile,
      importProfile,
      replayBoot,
      bootKey,
    }),
    [profile, state, update, reset, addProfile, selectProfile, deleteProfile, exportProfile, importProfile, replayBoot, bootKey],
  );

  return <PCtx.Provider value={value}>{children}</PCtx.Provider>;
}

export function usePersonalization() {
  const c = useContext(PCtx);
  if (!c) throw new Error("usePersonalization must be inside PersonalizationProvider");
  return c;
}

export { DEFAULT_PROFILE };
