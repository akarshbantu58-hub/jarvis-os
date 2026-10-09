import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { APPS } from "./apps";
import { useWindows } from "./WindowManager";

export function Spotlight({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const { openApp } = useWindows();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  if (!open) return null;

  const filtered = APPS.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-strong w-[92vw] max-w-lg rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-12 border-b border-white/10">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search apps and actions…"
            className="flex-1 bg-transparent outline-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && filtered[0]) {
                openApp(filtered[0].id);
                onClose();
              }
            }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No results</div>
          )}
          {filtered.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => { openApp(a.id); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-left"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${a.color} grid place-items-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm">{a.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
