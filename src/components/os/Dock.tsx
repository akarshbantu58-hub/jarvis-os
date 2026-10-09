import { useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { useWindows, type AppId } from "./WindowManager";
import { APPS } from "./apps";

export function Dock() {
  const { openApp, windows } = useWindows();
  const [expanded, setExpanded] = useState(false);
  const openIds = new Set(windows.map((w) => w.appId));

  const launch = (id: AppId) => {
    openApp(id);
    setExpanded(false);
  };

  return (
    <>
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[9999]">
        <div className="glass-strong rounded-2xl px-2 py-1.5 flex items-end gap-1.5">
          {APPS.map((app) => {
            const Icon = app.icon;
            const isOpen = openIds.has(app.id);
            return (
              <button
                key={app.id}
                onClick={() => launch(app.id)}
                className="group relative flex flex-col items-center"
                title={app.name}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${app.color} grid place-items-center shadow-lg transition-all duration-200 group-hover:-translate-y-1.5 group-hover:scale-110`}
                >
                  <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-white drop-shadow" />
                </div>
                <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md glass whitespace-nowrap pointer-events-none">
                  {app.name}
                </span>
                <div className={`mt-1 w-1 h-1 rounded-full transition ${isOpen ? "bg-primary" : "bg-transparent"}`} />
              </button>
            );
          })}
          <button
            onClick={() => setExpanded(true)}
            className="group relative flex flex-col items-center"
            title="More"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 grid place-items-center shadow-lg transition-all duration-200 group-hover:-translate-y-1.5 group-hover:scale-110 border border-white/10">
              <MoreHorizontal className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-white/90" />
            </div>
            <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md glass whitespace-nowrap pointer-events-none">
              More
            </span>
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative glass-strong rounded-3xl p-5 sm:p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gradient-jarvis">Apps</h2>
              <button
                onClick={() => setExpanded(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {APPS.map((app) => {
                const Icon = app.icon;
                const isOpen = openIds.has(app.id);
                return (
                  <button
                    key={app.id}
                    onClick={() => launch(app.id)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/10 transition"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.color} grid place-items-center shadow-lg transition-transform duration-200 group-hover:scale-110`}
                    >
                      <Icon className="w-6 h-6 text-white drop-shadow" />
                    </div>
                    <span className="text-[11px] text-center leading-tight text-foreground/90">
                      {app.name}
                    </span>
                    {isOpen && <span className="w-1 h-1 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
