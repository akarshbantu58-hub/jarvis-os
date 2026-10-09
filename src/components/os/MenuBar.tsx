import { useEffect, useState } from "react";
import { Search, Wifi, BatteryFull, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { usePersonalization } from "@/lib/personalization";
import { useAuth } from "@/lib/auth";

export function MenuBar({ onOpenSpotlight }: { onOpenSpotlight: () => void }) {
  const { profile } = usePersonalization();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-7 z-[9998] glass flex items-center px-3 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
        <span className="font-semibold text-gradient-jarvis">{profile.assistantName}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden sm:inline text-muted-foreground">{profile.userName}</span>
        {user ? (
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/10 transition text-muted-foreground"
            title={user.email ?? "Signed in"}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        ) : (
          <button
            onClick={() => void navigate({ to: "/auth" })}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/10 transition text-muted-foreground"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}
        <button
          onClick={onOpenSpotlight}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/10 transition"
          aria-label="Open spotlight search"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-muted-foreground">⌘K</span>
        </button>
        <Wifi className="w-3.5 h-3.5 opacity-70" />
        <BatteryFull className="w-3.5 h-3.5 opacity-70" />
        <span className="tabular-nums">{now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
      </div>
    </div>
  );
}
