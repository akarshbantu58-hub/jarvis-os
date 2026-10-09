import { useEffect, useState } from "react";
import defaultWallpaper from "@/assets/wallpaper.jpg";
import { usePersonalization } from "@/lib/personalization";

type Star = { x: number; y: number; s: number; d: number; o: number };

export function Background() {
  const { profile } = usePersonalization();
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 60 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 1.6 + 0.4,
        d: Math.random() * 4 + 2,
        o: 0.5 + Math.random() * 0.5,
      })),
    );
  }, []);

  const bg = profile.wallpaperUrl || defaultWallpaper;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-transparent to-background/80" />
      {profile.particles && stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.s,
            height: s.s,
            opacity: s.o,
            animationDuration: `${s.d}s`,
          }}
        />
      ))}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl" />
    </div>
  );
}
