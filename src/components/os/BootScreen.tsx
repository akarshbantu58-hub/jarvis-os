import { useEffect, useRef, useState } from "react";
import { usePersonalization } from "@/lib/personalization";
import { X } from "lucide-react";

const BOOT_STEPS = [
  "Initializing neural core…",
  "Loading language models…",
  "Calibrating voice matrix…",
  "Syncing holographic interface…",
];

export function BootScreen({ onDone }: { onDone: () => void }) {
  const { profile } = usePersonalization();
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const total = profile.bootDurationMs;
  const color = profile.bootColor;
  const logo = profile.bootLogoUrl;

  const finish = () => {
    setExiting(true);
    setTimeout(onDone, 600);
  };

  useEffect(() => {
    if (!profile.bootEnabled) {
      onDone();
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total);
      setProgress(p);
      setStep(Math.min(BOOT_STEPS.length - 1, Math.floor(p * BOOT_STEPS.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, profile.bootEnabled]);

  useEffect(() => {
    if (profile.bootSoundEnabled && profile.bootSoundUrl && audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => {});
    }
  }, [profile.bootSoundEnabled, profile.bootSoundUrl]);

  if (!profile.bootEnabled) return null;

  const style = profile.bootStyle;

  return (
    <div
      className={`fixed inset-0 z-[10000] grid place-items-center bg-background transition-opacity duration-600 ${
        exiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Skip button */}
      <button
        onClick={finish}
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs glass hover:bg-white/10 transition"
      >
        Skip <X className="w-3 h-3" />
      </button>

      {/* Background FX */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full blur-3xl animate-pulse"
          style={{ background: `${color}44` }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-3xl animate-pulse"
          style={{ background: `${profile.accent2}44`, animationDelay: "1s" }}
        />
        {style === "particles" &&
          Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 rounded-full bg-white/70 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${2 + Math.random() * 4}s`,
              }}
            />
          ))}
        {style === "scan" && (
          <div
            className="absolute inset-x-0 h-24 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent, ${color}55, transparent)`,
              animation: "scan-line 2.4s linear infinite",
            }}
          />
        )}
      </div>

      {/* Optional custom boot video */}
      {profile.bootVideoUrl && (
        <video
          src={profile.bootVideoUrl}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}

      <div className="relative flex flex-col items-center gap-8 px-6">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 grid place-items-center">
          {style !== "minimal" && (
            <>
              <div
                className="absolute inset-0 rounded-full animate-orb"
                style={{ border: `1px solid ${color}55` }}
              />
              <div
                className="absolute inset-2 rounded-full"
                style={{ border: `1px solid ${profile.accent2}55`, animation: "orb-rotate 12s linear infinite reverse" }}
              />
              <div
                className="absolute inset-6 rounded-full"
                style={{ border: `1px solid ${color}33`, animation: "orb-rotate 8s linear infinite" }}
              />
            </>
          )}
          <div
            className="absolute inset-0 rounded-full blur-2xl animate-pulse-glow"
            style={{ background: `${color}22` }}
          />
          {logo ? (
            <img
              src={logo}
              alt={profile.assistantName}
              className="relative w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-2xl animate-scale-in"
              style={{ filter: `drop-shadow(0 0 30px ${color}aa)` }}
            />
          ) : (
            <div
              className="relative w-40 h-40 rounded-full grid place-items-center text-5xl font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${color}, ${profile.accent2})` }}
            >
              {profile.assistantName.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <div className="text-xs tracking-[0.5em] text-muted-foreground uppercase">{profile.welcomeMessage}</div>
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-[0.3em]"
            style={{
              background: `linear-gradient(135deg, ${color}, ${profile.accent2})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {profile.assistantName}
          </h1>
          <div className="text-[10px] tracking-[0.4em] text-muted-foreground uppercase">
            {profile.osName}
          </div>
        </div>

        <div className="w-72 sm:w-96 flex flex-col gap-2">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-100 ease-out"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(to right, ${color}, ${profile.accent2})`,
                boxShadow: `0 0 20px ${color}aa`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] tracking-widest uppercase text-muted-foreground">
            <span className="truncate">{BOOT_STEPS[step]}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>
      </div>

      {profile.bootSoundEnabled && profile.bootSoundUrl && (
        <audio ref={audioRef} src={profile.bootSoundUrl} />
      )}

      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-10vh); }
          100% { transform: translateY(110vh); }
        }
      `}</style>
    </div>
  );
}
