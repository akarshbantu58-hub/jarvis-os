import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, Minus, Square } from "lucide-react";
import { useWindows, type WindowState } from "./WindowManager";

export function Window({ win, children }: { win: WindowState; children: ReactNode }) {
  const { closeWindow, focusWindow, updateWindow, toggleMinimize, toggleMaximize, activeId } = useWindows();
  const isActive = activeId === win.id;
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizeRef = useRef<{ w: number; h: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging && !resizeRef.current) return;
    const onMove = (e: PointerEvent) => {
      if (dragRef.current) {
        updateWindow(win.id, {
          x: Math.max(0, e.clientX - dragRef.current.dx),
          y: Math.max(28, e.clientY - dragRef.current.dy),
        });
      } else if (resizeRef.current) {
        const dw = e.clientX - resizeRef.current.x;
        const dh = e.clientY - resizeRef.current.y;
        updateWindow(win.id, {
          width: Math.max(280, resizeRef.current.w + dw),
          height: Math.max(200, resizeRef.current.h + dh),
        });
      }
    };
    const onUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
      setDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, win.id, updateWindow]);

  if (win.minimized) return null;

  const style = win.maximized
    ? { left: 0, top: 28, width: "100vw", height: "calc(100vh - 108px)", zIndex: win.zIndex }
    : { left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <div
      className={`glass-strong fixed rounded-2xl overflow-hidden flex flex-col transition-shadow ${isActive ? "ring-1 ring-primary/40" : ""}`}
      style={{ ...style, boxShadow: "var(--shadow-window)" }}
      onPointerDown={() => focusWindow(win.id)}
    >
      <div
        className="h-11 px-3 flex items-center gap-2 select-none cursor-grab active:cursor-grabbing border-b border-white/10 bg-white/5"
        onPointerDown={(e) => {
          if (win.maximized) return;
          dragRef.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
          setDragging(true);
        }}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <button
          aria-label="Minimize window"
          className="w-7 h-7 rounded-full bg-yellow-500/90 hover:bg-yellow-400 grid place-items-center shadow-md transition active:scale-90"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); toggleMinimize(win.id); }}
        >
          <Minus className="w-3.5 h-3.5 text-black" strokeWidth={3} />
        </button>
        <button
          aria-label="Maximize window"
          className="w-7 h-7 rounded-full bg-green-500/90 hover:bg-green-400 grid place-items-center shadow-md transition active:scale-90"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
        >
          <Square className="w-3 h-3 text-black" strokeWidth={3} />
        </button>
        <span className="mx-auto text-sm font-medium text-foreground/80 truncate px-2">{win.title}</span>
        <button
          aria-label="Close window"
          className="w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-400 grid place-items-center shadow-md transition active:scale-90"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
        >
          <X className="w-4 h-4 text-white" strokeWidth={3} />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      {!win.maximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onPointerDown={(e) => {
            e.stopPropagation();
            resizeRef.current = { w: win.width, h: win.height, x: e.clientX, y: e.clientY };
          }}
        />
      )}
    </div>
  );
}
