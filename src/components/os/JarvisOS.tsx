import { createContext, useContext, useEffect, useState } from "react";
import { WindowManagerProvider, useWindows } from "@/components/os/WindowManager";
import { Background } from "@/components/os/Background";
import { Dock } from "@/components/os/Dock";
import { MenuBar } from "@/components/os/MenuBar";
import { Spotlight } from "@/components/os/Spotlight";
import { Window } from "@/components/os/Window";
import { ChatApp } from "@/components/apps/ChatApp";
import { VoiceApp } from "@/components/apps/VoiceApp";
import { NotesApp } from "@/components/apps/NotesApp";
import { CalculatorApp } from "@/components/apps/CalculatorApp";
import { ClockApp } from "@/components/apps/ClockApp";
import { SettingsApp } from "@/components/apps/SettingsApp";
import { AboutApp } from "@/components/apps/AboutApp";
import { PersonalizeApp } from "@/components/apps/PersonalizeApp";
import { DevStudioApp } from "@/components/apps/DevStudioApp";
import { TasksApp } from "@/components/apps/TasksApp";
import { FilesApp } from "@/components/apps/FilesApp";
import { ImagineApp } from "@/components/apps/ImagineApp";
import { BootScreen } from "@/components/os/BootScreen";
import { PersonalizationProvider, usePersonalization } from "@/lib/personalization";
import { AuthProvider } from "@/lib/auth";

const ThreadCtx = createContext<string | null>(null);
export function useRouteThreadId() {
  return useContext(ThreadCtx);
}

function AppRenderer({ appId }: { appId: string }) {
  switch (appId) {
    case "chat": return <ChatApp />;
    case "voice": return <VoiceApp />;
    case "notes": return <NotesApp />;
    case "calculator": return <CalculatorApp />;
    case "clock": return <ClockApp />;
    case "settings": return <SettingsApp />;
    case "about": return <AboutApp />;
    case "personalize": return <PersonalizeApp />;
    case "devstudio": return <DevStudioApp />;
    case "tasks": return <TasksApp />;
    case "files": return <FilesApp />;
    case "imagine": return <ImagineApp />;
    default: return null;
  }
}

function Desktop({ startApp }: { startApp: "voice" | "chat" }) {
  const { windows, openApp } = useWindows();
  const { profile } = usePersonalization();
  const [spotlight, setSpotlight] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSpotlight((s) => !s);
      } else if (e.key === "Escape") {
        setSpotlight(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!booted) {
      setBooted(true);
      const t = setTimeout(() => openApp(startApp), 500);
      return () => clearTimeout(t);
    }
  }, [booted, openApp, startApp]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <MenuBar onOpenSpotlight={() => setSpotlight(true)} />

      {windows.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none px-6 text-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 grid place-items-center animate-pulse-glow">
            <div className="w-20 h-20 rounded-full bg-background/40 backdrop-blur-xl grid place-items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 animate-orb" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-gradient-jarvis">{profile.osName}</h1>
          <p className="text-sm text-muted-foreground">{profile.greeting}</p>
        </div>
      )}

      {windows.map((w) => (
        <Window key={w.id} win={w}>
          <AppRenderer appId={w.appId} />
        </Window>
      ))}

      <Dock />
      <Spotlight open={spotlight} onClose={() => setSpotlight(false)} />
    </div>
  );
}

function BootLayer({ startApp }: { startApp: "voice" | "chat" }) {
  const { bootKey, profile } = usePersonalization();
  const [booting, setBooting] = useState(profile.bootEnabled);
  useEffect(() => {
    if (bootKey > 0) setBooting(true);
  }, [bootKey]);

  return (
    <>
      {booting && <BootScreen key={bootKey} onDone={() => setBooting(false)} />}
      <Desktop startApp={startApp} />
    </>
  );
}

export function JarvisOS({ threadId = null }: { threadId?: string | null }) {
  return (
    <AuthProvider>
      <ThreadCtx.Provider value={threadId}>
        <PersonalizationProvider>
          <WindowManagerProvider>
            <BootLayer startApp={threadId ? "chat" : "voice"} />
          </WindowManagerProvider>
        </PersonalizationProvider>
      </ThreadCtx.Provider>
    </AuthProvider>
  );
}
