import { Sparkles } from "lucide-react";

export function AboutApp() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center bg-transparent">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center animate-pulse-glow">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-gradient-jarvis">JARVIS Ultimate</h1>
        <p className="text-sm text-muted-foreground">Version 2.0 · Liquid Glass</p>
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">
        An AI-powered desktop workspace inspired by visionOS. Chat with JARVIS, take notes,
        crunch numbers, and manage your day — all in one glassy interface.
      </p>
      <div className="text-xs text-muted-foreground/70 mt-2">Powered by Lovable AI</div>
    </div>
  );
}
