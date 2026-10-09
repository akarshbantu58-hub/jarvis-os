import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AppId = "chat" | "voice" | "notes" | "calculator" | "settings" | "clock" | "about" | "personalize" | "devstudio" | "tasks" | "files" | "imagine";

export type WindowState = {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
};

type WM = {
  windows: WindowState[];
  activeId: string | null;
  openApp: (appId: AppId) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindow: (id: string, patch: Partial<WindowState>) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
};

const Ctx = createContext<WM | null>(null);

const APP_DEFAULTS: Record<AppId, { title: string; width: number; height: number }> = {
  chat: { title: "JARVIS Chat", width: 720, height: 560 },
  voice: { title: "Voice", width: 720, height: 720 },
  notes: { title: "Notes", width: 520, height: 440 },
  calculator: { title: "Calculator", width: 320, height: 460 },
  settings: { title: "Settings", width: 560, height: 480 },
  clock: { title: "Clock", width: 340, height: 300 },
  about: { title: "About JARVIS", width: 480, height: 400 },
  personalize: { title: "Personalization", width: 720, height: 620 },
  devstudio: { title: "JARVIS Dev Studio", width: 1100, height: 720 },
  tasks: { title: "Tasks", width: 560, height: 620 },
  files: { title: "Files", width: 720, height: 560 },
  imagine: { title: "Imagine — Nano Banana 2", width: 720, height: 720 },

};

let zTop = 10;
let idCounter = 0;

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const openApp = useCallback((appId: AppId) => {
    // Focus existing if singleton
    setWindows((prev) => {
      const existing = prev.find((w) => w.appId === appId);
      if (existing) {
        zTop += 1;
        setActiveId(existing.id);
        return prev.map((w) => (w.id === existing.id ? { ...w, minimized: false, zIndex: zTop } : w));
      }
      const def = APP_DEFAULTS[appId];
      idCounter += 1;
      zTop += 1;
      const id = `${appId}-${idCounter}`;
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const w: WindowState = {
        id,
        appId,
        title: def.title,
        x: isMobile ? 8 : 80 + ((idCounter * 30) % 200),
        y: isMobile ? 40 : 60 + ((idCounter * 30) % 160),
        width: isMobile ? Math.min(def.width, window.innerWidth - 16) : def.width,
        height: isMobile ? Math.min(def.height, window.innerHeight - 140) : def.height,
        zIndex: zTop,
        minimized: false,
        maximized: false,
      };
      setActiveId(id);
      return [...prev, w];
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const focusWindow = useCallback((id: string) => {
    zTop += 1;
    setActiveId(id);
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: zTop, minimized: false } : w)));
  }, []);

  const updateWindow = useCallback((id: string, patch: Partial<WindowState>) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)));
  }, []);

  const value = useMemo(
    () => ({ windows, activeId, openApp, closeWindow, focusWindow, updateWindow, toggleMinimize, toggleMaximize }),
    [windows, activeId, openApp, closeWindow, focusWindow, updateWindow, toggleMinimize, toggleMaximize],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWindows() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWindows must be used inside WindowManagerProvider");
  return ctx;
}
