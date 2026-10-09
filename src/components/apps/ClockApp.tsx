import { useEffect, useState } from "react";

export function ClockApp() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 bg-transparent p-4">
      <div className="text-6xl font-light tabular-nums tracking-tight text-gradient-jarvis">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className="text-sm text-muted-foreground">
        {now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>
      <div className="relative w-40 h-40 rounded-full glass-strong grid place-items-center animate-pulse-glow mt-2">
        <div
          className="absolute w-0.5 h-16 bg-primary origin-bottom bottom-1/2"
          style={{ transform: `rotate(${now.getSeconds() * 6}deg)` }}
        />
        <div
          className="absolute w-1 h-14 bg-foreground origin-bottom bottom-1/2 rounded"
          style={{ transform: `rotate(${now.getMinutes() * 6}deg)` }}
        />
        <div
          className="absolute w-1.5 h-10 bg-foreground origin-bottom bottom-1/2 rounded"
          style={{ transform: `rotate(${(now.getHours() % 12) * 30 + now.getMinutes() * 0.5}deg)` }}
        />
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>
    </div>
  );
}
